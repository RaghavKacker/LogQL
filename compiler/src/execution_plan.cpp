#include "execution_plan.hpp"
#include "optimizer.hpp"

namespace logql {

std::unique_ptr<PlanNode> ExecutionPlanner::buildPlan(const QueryNode* query) {
    if (!query) return nullptr;

    // 1. Base Scan Operator
    auto scanNode = std::make_unique<PlanNode>();
    scanNode->operatorName = "LogScanOperator";
    scanNode->description = "Scan normalized in-memory log stream";

    // Projected column pruning
    QueryOptimizer opt;
    scanNode->projectedColumns = query->select && query->select->isStar
        ? std::vector<std::string>{"timestamp", "service", "level", "status", "response_time", "path", "ip", "message"}
        : opt.computeProjectedFields(query);

    std::unique_ptr<PlanNode> currentRoot = std::move(scanNode);

    // 2. Filter Operator (Pushdown: immediately following scan)
    if (query->where && query->where->condition) {
        auto filterNode = std::make_unique<PlanNode>();
        filterNode->operatorName = "FilterOperator";
        filterNode->predicate = query->where->condition->toJson().dump();
        filterNode->description = "Evaluate boolean filter expression per record";
        filterNode->child = std::move(currentRoot);
        currentRoot = std::move(filterNode);
    }

    // 3. Aggregate Operator
    bool hasAggregates = false;
    std::vector<std::string> aggFuncs;
    if (query->select) {
        for (const auto& it : query->select->items) {
            if (it && it->expr) {
                if (auto* fn = dynamic_cast<FunctionCallNode*>(it->expr.get())) {
                    hasAggregates = true;
                    aggFuncs.push_back(fn->funcName + "(" + fn->argument + ")");
                }
            }
        }
    }

    if (query->groupBy || hasAggregates) {
        auto aggNode = std::make_unique<PlanNode>();
        aggNode->operatorName = "AggregateOperator";
        aggNode->description = "Hash-aggregate records by group keys and compute running accumulators";
        if (query->groupBy) {
            aggNode->groupKeys = query->groupBy->columns;
        }
        aggNode->aggregates = aggFuncs;
        aggNode->child = std::move(currentRoot);
        currentRoot = std::move(aggNode);
    }

    // 4. Project Operator
    auto projectNode = std::make_unique<PlanNode>();
    projectNode->operatorName = "ProjectOperator";
    projectNode->description = "Compute final select expressions, aliases, and output schema";
    if (query->select) {
        if (query->select->isStar) {
            projectNode->projectedColumns = {"timestamp", "service", "level", "status", "response_time", "path", "ip", "message"};
        } else {
            for (const auto& it : query->select->items) {
                if (it) projectNode->projectedColumns.push_back(it->getDisplayName());
            }
        }
    }
    projectNode->child = std::move(currentRoot);
    currentRoot = std::move(projectNode);

    // 5. Sort Operator
    if (query->orderBy && !query->orderBy->items.empty()) {
        auto sortNode = std::make_unique<PlanNode>();
        sortNode->operatorName = "SortOperator";
        sortNode->description = "In-memory multi-column sort using stable comparator";
        for (const auto& it : query->orderBy->items) {
            std::string dir = it.ascending ? "ASC" : "DESC";
            std::string key = it.expr ? it.expr->toJson().dump() : "unknown";
            sortNode->orderKeys.push_back(key + " " + dir);
        }
        sortNode->child = std::move(currentRoot);
        currentRoot = std::move(sortNode);
    }

    // 6. Limit Operator
    if (query->limit) {
        auto limitNode = std::make_unique<PlanNode>();
        limitNode->operatorName = "LimitOperator";
        limitNode->limitValue = query->limit->limit;
        limitNode->description = "Truncate result stream to " + std::to_string(query->limit->limit) + " rows";
        limitNode->child = std::move(currentRoot);
        currentRoot = std::move(limitNode);
    }

    return currentRoot;
}

} // namespace logql
