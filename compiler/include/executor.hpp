#ifndef LOGQL_EXECUTOR_HPP
#define LOGQL_EXECUTOR_HPP

#include <string>
#include <vector>
#include <unordered_map>
#include <optional>
#include <chrono>
#include "ast.hpp"
#include "log_record.hpp"
#include "execution_plan.hpp"
#include "json.hpp"

namespace logql {

using Row = std::unordered_map<std::string, FieldValue>;

struct ExecutionMetrics {
    int64_t recordsScanned{0};
    int64_t recordsFiltered{0};
    int64_t recordsGrouped{0};
    int64_t recordsReturned{0};
    double executionTimeMs{0.0};

    nlohmann::json toJson() const {
        return {
            {"recordsScanned", recordsScanned},
            {"recordsFiltered", recordsFiltered},
            {"recordsGrouped", recordsGrouped},
            {"recordsReturned", recordsReturned},
            {"executionTimeMs", executionTimeMs}
        };
    }
};

struct QueryResult {
    bool success{true};
    std::string errorMessage;
    std::vector<std::string> columns;
    std::vector<nlohmann::json> rows;
    ExecutionMetrics metrics;

    nlohmann::json toJson() const {
        return {
            {"success", success},
            {"errorMessage", errorMessage},
            {"columns", columns},
            {"rows", rows},
            {"metrics", metrics.toJson()}
        };
    }
};

class PhysicalOperator {
public:
    virtual ~PhysicalOperator() = default;
    virtual void open() = 0;
    virtual std::optional<Row> next() = 0;
    virtual void close() = 0;
};

class QueryExecutor {
public:
    QueryResult execute(const QueryNode* query, const std::vector<LogRecord>& dataset);
};

} // namespace logql

#endif // LOGQL_EXECUTOR_HPP
