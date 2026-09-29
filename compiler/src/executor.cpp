#include "executor.hpp"
#include <algorithm>
#include <cmath>
#include <set>
#include <map>

namespace logql {

struct AggregateAccumulator {
    int64_t count{0};
    double sum{0.0};
    double minVal{1e18};
    double maxVal{-1e18};
    bool hasMin{false};
    bool hasMax{false};
};

QueryResult QueryExecutor::execute(const QueryNode* query, const std::vector<LogRecord>& dataset) {
    auto startTime = std::chrono::high_resolution_clock::now();
    QueryResult result;

    if (!query) {
        result.success = false;
        result.errorMessage = "Query AST is null";
        return result;
    }

    // Determine output columns
    std::vector<std::string> outputColumns;
    if (query->select) {
        if (query->select->isStar) {
            outputColumns = {"timestamp", "service", "level", "status", "response_time", "path", "ip", "message"};
        } else {
            for (const auto& it : query->select->items) {
                if (it) outputColumns.push_back(it->getDisplayName());
            }
        }
    }
    result.columns = outputColumns;

    // Check if query has aggregation
    bool hasAggregates = false;
    if (query->select) {
        for (const auto& it : query->select->items) {
            if (it && it->expr) {
                if (dynamic_cast<FunctionCallNode*>(it->expr.get())) {
                    hasAggregates = true;
                    break;
                }
            }
        }
    }

    // Step 1: Scan & Filter
    std::vector<LogRecord> filteredRecords;
    filteredRecords.reserve(dataset.size());

    for (const auto& record : dataset) {
        result.metrics.recordsScanned++;
        if (query->where && query->where->condition) {
            FieldValue condVal = query->where->condition->evaluate(record);
            if (!condVal.asBool()) {
                result.metrics.recordsFiltered++;
                continue;
            }
        }
        filteredRecords.push_back(record);
    }

    // Step 2: Aggregation vs Scalar Projection
    std::vector<Row> processedRows;

    if (query->groupBy || hasAggregates) {
        // Map: group key -> (column name -> accumulator)
        std::map<std::string, std::unordered_map<std::string, AggregateAccumulator>> groupAccs;
        std::map<std::string, LogRecord> groupSampleRecords;

        for (const auto& rec : filteredRecords) {
            std::string groupKey = "";
            if (query->groupBy) {
                for (size_t i = 0; i < query->groupBy->columns.size(); ++i) {
                    if (i > 0) groupKey += "||";
                    groupKey += rec.getField(query->groupBy->columns[i]).asString();
                }
            } else {
                groupKey = "__ALL__";
            }

            if (groupSampleRecords.find(groupKey) == groupSampleRecords.end()) {
                groupSampleRecords[groupKey] = rec;
            }

            auto& accMap = groupAccs[groupKey];

            // Update accumulators for each aggregate function in SELECT
            if (query->select) {
                for (const auto& it : query->select->items) {
                    if (!it || !it->expr) continue;
                    if (auto* fn = dynamic_cast<FunctionCallNode*>(it->expr.get())) {
                        std::string fnKey = fn->funcName + "(" + fn->argument + ")";
                        auto& acc = accMap[fnKey];
                        acc.count++;

                        if (fn->argument != "*") {
                            FieldValue fVal = rec.getField(fn->argument);
                            if (fVal.isNumeric()) {
                                double num = fVal.asFloat();
                                acc.sum += num;
                                if (!acc.hasMin || num < acc.minVal) { acc.minVal = num; acc.hasMin = true; }
                                if (!acc.hasMax || num > acc.maxVal) { acc.maxVal = num; acc.hasMax = true; }
                            }
                        }
                    }
                }
            }
        }

        result.metrics.recordsGrouped = groupAccs.size();

        // Convert grouped accumulators into Rows
        for (const auto& pair : groupAccs) {
            const std::string& groupKey = pair.first;
            const auto& accMap = pair.second;
            const auto& sampleRec = groupSampleRecords[groupKey];

            Row row;
            if (query->select) {
                for (const auto& it : query->select->items) {
                    if (!it || !it->expr) continue;
                    std::string colName = it->getDisplayName();

                    if (auto* fn = dynamic_cast<FunctionCallNode*>(it->expr.get())) {
                        std::string fnKey = fn->funcName + "(" + fn->argument + ")";
                        auto accIt = accMap.find(fnKey);
                        if (accIt != accMap.end()) {
                            const auto& acc = accIt->second;
                            if (fn->funcName == "COUNT") row[colName] = FieldValue(acc.count);
                            else if (fn->funcName == "SUM") row[colName] = FieldValue(acc.sum);
                            else if (fn->funcName == "AVG") {
                                double avg = (acc.count > 0) ? (acc.sum / acc.count) : 0.0;
                                row[colName] = FieldValue(avg);
                            }
                            else if (fn->funcName == "MIN") row[colName] = acc.hasMin ? FieldValue(acc.minVal) : FieldValue();
                            else if (fn->funcName == "MAX") row[colName] = acc.hasMax ? FieldValue(acc.maxVal) : FieldValue();
                        } else {
                            row[colName] = FieldValue();
                        }
                    } else if (auto* id = dynamic_cast<IdentifierNode*>(it->expr.get())) {
                        row[colName] = sampleRec.getField(id->name);
                    } else {
                        row[colName] = it->expr->evaluate(sampleRec);
                    }
                }
            }
            processedRows.push_back(std::move(row));
        }

    } else {
        // Scalar Projection
        for (const auto& rec : filteredRecords) {
            Row row;
            if (query->select && query->select->isStar) {
                row["timestamp"] = FieldValue(rec.timestamp);
                row["service"] = FieldValue(rec.service);
                row["level"] = FieldValue(rec.level);
                row["status"] = FieldValue(rec.status);
                row["response_time"] = FieldValue(rec.response_time);
                row["path"] = FieldValue(rec.path);
                row["ip"] = FieldValue(rec.ip);
                row["message"] = FieldValue(rec.message);
            } else if (query->select) {
                for (const auto& it : query->select->items) {
                    if (!it || !it->expr) continue;
                    row[it->getDisplayName()] = it->expr->evaluate(rec);
                }
            }
            processedRows.push_back(std::move(row));
        }
    }

    // Step 3: DISTINCT
    if (query->select && query->select->distinct) {
        std::vector<Row> uniqueRows;
        std::set<std::string> seenRowKeys;

        for (const auto& row : processedRows) {
            std::string rowKey = "";
            for (const auto& col : outputColumns) {
                auto it = row.find(col);
                rowKey += (it != row.end() ? it->second.asString() : "") + "||";
            }
            if (seenRowKeys.find(rowKey) == seenRowKeys.end()) {
                seenRowKeys.insert(rowKey);
                uniqueRows.push_back(row);
            }
        }
        processedRows = std::move(uniqueRows);
    }

    // Step 4: ORDER BY
    if (query->orderBy && !query->orderBy->items.empty()) {
        std::stable_sort(processedRows.begin(), processedRows.end(), [&](const Row& a, const Row& b) {
            for (const auto& item : query->orderBy->items) {
                std::string sortKey = "";
                if (auto* id = dynamic_cast<IdentifierNode*>(item.expr.get())) {
                    sortKey = id->name;
                } else if (auto* fn = dynamic_cast<FunctionCallNode*>(item.expr.get())) {
                    sortKey = fn->funcName + "(" + fn->argument + ")";
                }

                auto itA = a.find(sortKey);
                auto itB = b.find(sortKey);
                FieldValue valA = (itA != a.end()) ? itA->second : FieldValue();
                FieldValue valB = (itB != b.end()) ? itB->second : FieldValue();

                if (valA.isNumeric() && valB.isNumeric()) {
                    if (std::abs(valA.asFloat() - valB.asFloat()) > 1e-9) {
                        return item.ascending ? (valA.asFloat() < valB.asFloat()) : (valA.asFloat() > valB.asFloat());
                    }
                } else {
                    if (valA.asString() != valB.asString()) {
                        return item.ascending ? (valA.asString() < valB.asString()) : (valA.asString() > valB.asString());
                    }
                }
            }
            return false;
        });
    }

    // Step 5: LIMIT
    if (query->limit && query->limit->limit >= 0) {
        size_t lim = static_cast<size_t>(query->limit->limit);
        if (processedRows.size() > lim) {
            processedRows.resize(lim);
        }
    }

    // Step 6: Convert Rows to JSON array
    for (const auto& row : processedRows) {
        nlohmann::json rowJson = nlohmann::json::object();
        for (const auto& col : outputColumns) {
            auto it = row.find(col);
            if (it != row.end()) {
                rowJson[col] = it->second.toJson();
            } else {
                rowJson[col] = nullptr;
            }
        }
        result.rows.push_back(std::move(rowJson));
    }

    result.metrics.recordsReturned = result.rows.size();

    auto endTime = std::chrono::high_resolution_clock::now();
    result.metrics.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();

    return result;
}

} // namespace logql
