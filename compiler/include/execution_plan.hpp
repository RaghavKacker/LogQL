#ifndef LOGQL_EXECUTION_PLAN_HPP
#define LOGQL_EXECUTION_PLAN_HPP

#include <string>
#include <vector>
#include <memory>
#include "ast.hpp"
#include "json.hpp"

namespace logql {

struct PlanNode {
    std::string operatorName;
    std::string description;
    std::vector<std::string> projectedColumns;
    std::string predicate;
    std::vector<std::string> groupKeys;
    std::vector<std::string> aggregates;
    std::vector<std::string> orderKeys;
    int64_t limitValue{-1};
    std::unique_ptr<PlanNode> child;

    nlohmann::json toJson() const {
        nlohmann::json j;
        j["operator"] = operatorName;
        j["description"] = description;
        if (!projectedColumns.empty()) j["projectedColumns"] = projectedColumns;
        if (!predicate.empty()) j["predicate"] = predicate;
        if (!groupKeys.empty()) j["groupKeys"] = groupKeys;
        if (!aggregates.empty()) j["aggregates"] = aggregates;
        if (!orderKeys.empty()) j["orderKeys"] = orderKeys;
        if (limitValue >= 0) j["limit"] = limitValue;
        if (child) j["child"] = child->toJson();
        return j;
    }
};

class ExecutionPlanner {
public:
    std::unique_ptr<PlanNode> buildPlan(const QueryNode* optimizedQuery);
};

} // namespace logql

#endif // LOGQL_EXECUTION_PLAN_HPP
