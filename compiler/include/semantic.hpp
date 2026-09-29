#ifndef LOGQL_SEMANTIC_HPP
#define LOGQL_SEMANTIC_HPP

#include <string>
#include <vector>
#include "ast.hpp"
#include "json.hpp"

namespace logql {

struct DiagnosticMessage {
    std::string severity; // "ERROR" or "WARNING"
    std::string message;
    int line{0};
    int col{0};

    nlohmann::json toJson() const {
        return {
            {"severity", severity},
            {"message", message},
            {"line", line},
            {"col", col}
        };
    }
};

struct SemanticResult {
    bool isValid{true};
    std::vector<DiagnosticMessage> diagnostics;

    nlohmann::json toJson() const {
        nlohmann::json diagList = nlohmann::json::array();
        for (const auto& d : diagnostics) {
            diagList.push_back(d.toJson());
        }
        return {
            {"isValid", isValid},
            {"diagnostics", diagList}
        };
    }
};

class SemanticAnalyzer {
public:
    SemanticResult analyze(const QueryNode* query);

private:
    void validateExpression(const ExprNode* expr, std::vector<DiagnosticMessage>& diags);
    void validateFunctionCall(const FunctionCallNode* func, std::vector<DiagnosticMessage>& diags);
    DataType inferType(const ExprNode* expr);
};

} // namespace logql

#endif // LOGQL_SEMANTIC_HPP
