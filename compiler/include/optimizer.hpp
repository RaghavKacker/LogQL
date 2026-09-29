#ifndef LOGQL_OPTIMIZER_HPP
#define LOGQL_OPTIMIZER_HPP

#include <string>
#include <vector>
#include <memory>
#include "ast.hpp"
#include "json.hpp"

namespace logql {

struct OptimizationRecord {
    std::string rule;
    std::string description;
    std::string before;
    std::string after;

    nlohmann::json toJson() const {
        return {
            {"rule", rule},
            {"description", description},
            {"before", before},
            {"after", after}
        };
    }
};

class QueryOptimizer {
public:
    std::vector<OptimizationRecord> records;

    // Run all optimization passes
    std::unique_ptr<QueryNode> optimize(const QueryNode* originalQuery);

    std::vector<std::string> computeProjectedFields(const QueryNode* query);

private:
    std::unique_ptr<ExprNode> foldConstants(std::unique_ptr<ExprNode> expr, bool& changed);
    std::unique_ptr<ExprNode> eliminateDuplicates(std::unique_ptr<ExprNode> expr, bool& changed);
    bool areExpressionsEquivalent(const ExprNode* a, const ExprNode* b);
};

} // namespace logql

#endif // LOGQL_OPTIMIZER_HPP
