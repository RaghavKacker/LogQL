#include "semantic.hpp"
#include <algorithm>
#include <unordered_set>

namespace logql {

SemanticResult SemanticAnalyzer::analyze(const QueryNode* query) {
    SemanticResult result;
    result.isValid = true;

    if (!query) {
        result.isValid = false;
        result.diagnostics.push_back({"ERROR", "Query AST is null"});
        return result;
    }

    // 1. Validate FROM table
    if (query->from) {
        if (query->from->table != "logs") {
            result.diagnostics.push_back({"WARNING", "Unknown table '" + query->from->table + "', default schema 'logs' will be used"});
        }
    } else {
        result.isValid = false;
        result.diagnostics.push_back({"ERROR", "Missing FROM clause"});
    }

    // 2. Validate SELECT list & Aggregate / Group By rules
    bool hasAggregates = false;
    std::vector<std::string> scalarColumns;

    if (query->select) {
        for (const auto& item : query->select->items) {
            if (!item || !item->expr) continue;

            validateExpression(item->expr.get(), result.diagnostics);

            if (auto* fn = dynamic_cast<const FunctionCallNode*>(item->expr.get())) {
                hasAggregates = true;
                validateFunctionCall(fn, result.diagnostics);
            } else if (auto* id = dynamic_cast<const IdentifierNode*>(item->expr.get())) {
                scalarColumns.push_back(id->name);
            }
        }
    }

    // 3. Validate GROUP BY rules
    std::unordered_set<std::string> groupColumns;
    if (query->groupBy) {
        for (const auto& col : query->groupBy->columns) {
            if (!LogRecord::isValidField(col)) {
                result.isValid = false;
                result.diagnostics.push_back({"ERROR", "Unknown attribute '" + col + "' in GROUP BY clause"});
            }
            groupColumns.insert(col);
        }
    }

    // Aggregation Invariant:
    // If aggregate functions are present alongside scalar fields, all scalar fields in SELECT must appear in GROUP BY
    if (hasAggregates && !scalarColumns.empty()) {
        for (const auto& scalarCol : scalarColumns) {
            if (groupColumns.find(scalarCol) == groupColumns.end()) {
                result.isValid = false;
                result.diagnostics.push_back({
                    "ERROR",
                    "Scalar column '" + scalarCol + "' must appear in the GROUP BY clause or be used in an aggregate function"
                });
            }
        }
    }

    // 4. Validate WHERE clause
    if (query->where && query->where->condition) {
        validateExpression(query->where->condition.get(), result.diagnostics);
    }

    // 5. Validate ORDER BY clause
    if (query->orderBy) {
        for (const auto& item : query->orderBy->items) {
            if (item.expr) {
                validateExpression(item.expr.get(), result.diagnostics);
                if (auto* fn = dynamic_cast<const FunctionCallNode*>(item.expr.get())) {
                    validateFunctionCall(fn, result.diagnostics);
                }
            }
        }
    }

    // 6. Validate LIMIT clause
    if (query->limit) {
        if (query->limit->limit < 0) {
            result.isValid = false;
            result.diagnostics.push_back({"ERROR", "LIMIT value must be a non-negative integer"});
        }
    }

    // Check if any error diagnostic exists
    for (const auto& d : result.diagnostics) {
        if (d.severity == "ERROR") {
            result.isValid = false;
            break;
        }
    }

    return result;
}

void SemanticAnalyzer::validateExpression(const ExprNode* expr, std::vector<DiagnosticMessage>& diags) {
    if (!expr) return;

    if (auto* id = dynamic_cast<const IdentifierNode*>(expr)) {
        if (!LogRecord::isValidField(id->name)) {
            diags.push_back({"ERROR", "Unknown attribute '" + id->name + "' in log schema"});
        }
        return;
    }

    if (auto* binOp = dynamic_cast<const BinaryOpNode*>(expr)) {
        validateExpression(binOp->left.get(), diags);
        validateExpression(binOp->right.get(), diags);

        DataType leftType = inferType(binOp->left.get());
        DataType rightType = inferType(binOp->right.get());

        // Numeric comparison checks
        if (binOp->op == "<" || binOp->op == ">" || binOp->op == "<=" || binOp->op == ">=") {
            bool leftNum = (leftType == DataType::TYPE_INT || leftType == DataType::TYPE_FLOAT);
            bool rightNum = (rightType == DataType::TYPE_INT || rightType == DataType::TYPE_FLOAT);
            if (!leftNum || !rightNum) {
                diags.push_back({
                    "ERROR",
                    "Relational operator '" + binOp->op + "' requires numeric operands, got " +
                    dataTypeToString(leftType) + " and " + dataTypeToString(rightType)
                });
            }
        }
        return;
    }

    if (auto* unOp = dynamic_cast<const UnaryOpNode*>(expr)) {
        validateExpression(unOp->operand.get(), diags);
        return;
    }
}

void SemanticAnalyzer::validateFunctionCall(const FunctionCallNode* func, std::vector<DiagnosticMessage>& diags) {
    if (!func) return;

    if (func->funcName != "COUNT" && func->funcName != "MIN" &&
        func->funcName != "MAX" && func->funcName != "AVG" && func->funcName != "SUM") {
        diags.push_back({"ERROR", "Unknown aggregate function '" + func->funcName + "'"});
        return;
    }

    if (func->argument == "*") {
        if (func->funcName != "COUNT") {
            diags.push_back({"ERROR", "Aggregate function '" + func->funcName + "' does not allow '*' argument"});
        }
        return;
    }

    if (!LogRecord::isValidField(func->argument)) {
        diags.push_back({"ERROR", "Unknown attribute '" + func->argument + "' passed to function " + func->funcName});
        return;
    }

    // AVG and SUM require numeric fields
    if (func->funcName == "AVG" || func->funcName == "SUM") {
        DataType argType = LogRecord::getFieldType(func->argument);
        if (argType != DataType::TYPE_INT && argType != DataType::TYPE_FLOAT) {
            diags.push_back({
                "ERROR",
                "Function '" + func->funcName + "' requires a numeric field, but '" +
                func->argument + "' is of type " + dataTypeToString(argType)
            });
        }
    }
}

DataType SemanticAnalyzer::inferType(const ExprNode* expr) {
    if (!expr) return DataType::TYPE_NULL;

    if (auto* lit = dynamic_cast<const LiteralNode*>(expr)) {
        return lit->value.getType();
    }
    if (auto* id = dynamic_cast<const IdentifierNode*>(expr)) {
        if (LogRecord::isValidField(id->name)) {
            return LogRecord::getFieldType(id->name);
        }
        return DataType::TYPE_NULL;
    }
    if (auto* fn = dynamic_cast<const FunctionCallNode*>(expr)) {
        if (fn->funcName == "COUNT") return DataType::TYPE_INT;
        if (fn->funcName == "AVG") return DataType::TYPE_FLOAT;
        if (fn->argument != "*" && LogRecord::isValidField(fn->argument)) {
            return LogRecord::getFieldType(fn->argument);
        }
        return DataType::TYPE_FLOAT;
    }
    if (auto* binOp = dynamic_cast<const BinaryOpNode*>(expr)) {
        if (binOp->op == "=" || binOp->op == "!=" || binOp->op == "<" ||
            binOp->op == ">" || binOp->op == "<=" || binOp->op == ">=" ||
            binOp->op == "AND" || binOp->op == "OR") {
            return DataType::TYPE_BOOL;
        }
        DataType l = inferType(binOp->left.get());
        DataType r = inferType(binOp->right.get());
        if (l == DataType::TYPE_FLOAT || r == DataType::TYPE_FLOAT) return DataType::TYPE_FLOAT;
        return DataType::TYPE_INT;
    }
    if (auto* unOp = dynamic_cast<const UnaryOpNode*>(expr)) {
        if (unOp->op == "NOT") return DataType::TYPE_BOOL;
        return inferType(unOp->operand.get());
    }

    return DataType::TYPE_NULL;
}

} // namespace logql
