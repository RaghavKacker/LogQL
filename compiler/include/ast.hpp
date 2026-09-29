#ifndef LOGQL_AST_HPP
#define LOGQL_AST_HPP

#include <string>
#include <vector>
#include <memory>
#include "json.hpp"
#include "log_record.hpp"

namespace logql {

class ASTNode {
public:
    virtual ~ASTNode() = default;
    virtual nlohmann::json toJson() const = 0;
};

class ExprNode : public ASTNode {
public:
    virtual ~ExprNode() = default;
    virtual FieldValue evaluate(const LogRecord& record) const = 0;
    virtual std::unique_ptr<ExprNode> clone() const = 0;
    virtual bool isConstant() const { return false; }
    virtual void collectReferencedFields(std::vector<std::string>& fields) const = 0;
};

class LiteralNode : public ExprNode {
public:
    FieldValue value;

    LiteralNode(FieldValue val) : value(std::move(val)) {}
    LiteralNode(int64_t val) : value(val) {}
    LiteralNode(double val) : value(val) {}
    LiteralNode(const std::string& val) : value(val) {}
    LiteralNode(bool val) : value(val) {}

    FieldValue evaluate(const LogRecord&) const override {
        return value;
    }

    std::unique_ptr<ExprNode> clone() const override {
        return std::make_unique<LiteralNode>(value);
    }

    bool isConstant() const override { return true; }

    void collectReferencedFields(std::vector<std::string>&) const override {}

    nlohmann::json toJson() const override {
        return {
            {"type", "LiteralNode"},
            {"dataType", dataTypeToString(value.getType())},
            {"value", value.toJson()}
        };
    }
};

class IdentifierNode : public ExprNode {
public:
    std::string name;

    IdentifierNode(std::string colName) : name(std::move(colName)) {}

    FieldValue evaluate(const LogRecord& record) const override {
        return record.getField(name);
    }

    std::unique_ptr<ExprNode> clone() const override {
        return std::make_unique<IdentifierNode>(name);
    }

    void collectReferencedFields(std::vector<std::string>& fields) const override {
        fields.push_back(name);
    }

    nlohmann::json toJson() const override {
        return {
            {"type", "IdentifierNode"},
            {"name", name}
        };
    }
};

class BinaryOpNode : public ExprNode {
public:
    std::string op;
    std::unique_ptr<ExprNode> left;
    std::unique_ptr<ExprNode> right;

    BinaryOpNode(std::string opStr, std::unique_ptr<ExprNode> l, std::unique_ptr<ExprNode> r)
        : op(std::move(opStr)), left(std::move(l)), right(std::move(r)) {}

    FieldValue evaluate(const LogRecord& record) const override;

    std::unique_ptr<ExprNode> clone() const override {
        return std::make_unique<BinaryOpNode>(op, left ? left->clone() : nullptr, right ? right->clone() : nullptr);
    }

    bool isConstant() const override {
        return left && left->isConstant() && right && right->isConstant();
    }

    void collectReferencedFields(std::vector<std::string>& fields) const override {
        if (left) left->collectReferencedFields(fields);
        if (right) right->collectReferencedFields(fields);
    }

    nlohmann::json toJson() const override {
        return {
            {"type", "BinaryOpNode"},
            {"operator", op},
            {"left", left ? left->toJson() : nullptr},
            {"right", right ? right->toJson() : nullptr}
        };
    }
};

class UnaryOpNode : public ExprNode {
public:
    std::string op;
    std::unique_ptr<ExprNode> operand;

    UnaryOpNode(std::string opStr, std::unique_ptr<ExprNode> opnd)
        : op(std::move(opStr)), operand(std::move(opnd)) {}

    FieldValue evaluate(const LogRecord& record) const override;

    std::unique_ptr<ExprNode> clone() const override {
        return std::make_unique<UnaryOpNode>(op, operand ? operand->clone() : nullptr);
    }

    bool isConstant() const override {
        return operand && operand->isConstant();
    }

    void collectReferencedFields(std::vector<std::string>& fields) const override {
        if (operand) operand->collectReferencedFields(fields);
    }

    nlohmann::json toJson() const override {
        return {
            {"type", "UnaryOpNode"},
            {"operator", op},
            {"operand", operand ? operand->toJson() : nullptr}
        };
    }
};

class FunctionCallNode : public ExprNode {
public:
    std::string funcName;
    std::string argument; // column name or "*"

    FunctionCallNode(std::string name, std::string arg)
        : funcName(std::move(name)), argument(std::move(arg)) {}

    FieldValue evaluate(const LogRecord& record) const override {
        // Evaluated at aggregation phase, defaults to field value if scalar
        if (argument == "*") return FieldValue(1);
        return record.getField(argument);
    }

    std::unique_ptr<ExprNode> clone() const override {
        return std::make_unique<FunctionCallNode>(funcName, argument);
    }

    void collectReferencedFields(std::vector<std::string>& fields) const override {
        if (argument != "*") fields.push_back(argument);
    }

    nlohmann::json toJson() const override {
        return {
            {"type", "FunctionCallNode"},
            {"function", funcName},
            {"arg", argument}
        };
    }
};

class SelectItemNode : public ASTNode {
public:
    std::unique_ptr<ExprNode> expr;
    std::string alias;

    SelectItemNode(std::unique_ptr<ExprNode> e, std::string a = "")
        : expr(std::move(e)), alias(std::move(a)) {}

    std::string getDisplayName() const {
        if (!alias.empty()) return alias;
        if (auto* id = dynamic_cast<IdentifierNode*>(expr.get())) return id->name;
        if (auto* fn = dynamic_cast<FunctionCallNode*>(expr.get())) return fn->funcName + "(" + fn->argument + ")";
        return "expr";
    }

    nlohmann::json toJson() const override {
        nlohmann::json j;
        j["type"] = "SelectItemNode";
        j["expr"] = expr ? expr->toJson() : nullptr;
        if (!alias.empty()) j["alias"] = alias;
        return j;
    }
};

class SelectListNode : public ASTNode {
public:
    bool distinct{false};
    bool isStar{false};
    std::vector<std::unique_ptr<SelectItemNode>> items;

    SelectListNode(bool dist = false) : distinct(dist), isStar(false) {}

    nlohmann::json toJson() const override {
        nlohmann::json itemsJson = nlohmann::json::array();
        for (const auto& it : items) {
            itemsJson.push_back(it->toJson());
        }
        return {
            {"type", "SelectListNode"},
            {"distinct", distinct},
            {"isStar", isStar},
            {"items", itemsJson}
        };
    }
};

class FromNode : public ASTNode {
public:
    std::string table;

    FromNode(std::string t) : table(std::move(t)) {}

    nlohmann::json toJson() const override {
        return {
            {"type", "FromNode"},
            {"table", table}
        };
    }
};

class WhereNode : public ASTNode {
public:
    std::unique_ptr<ExprNode> condition;

    WhereNode(std::unique_ptr<ExprNode> cond) : condition(std::move(cond)) {}

    nlohmann::json toJson() const override {
        return {
            {"type", "WhereNode"},
            {"condition", condition ? condition->toJson() : nullptr}
        };
    }
};

class GroupByNode : public ASTNode {
public:
    std::vector<std::string> columns;

    GroupByNode(std::vector<std::string> cols) : columns(std::move(cols)) {}

    nlohmann::json toJson() const override {
        return {
            {"type", "GroupByNode"},
            {"columns", columns}
        };
    }
};

struct OrderByItem {
    std::unique_ptr<ExprNode> expr;
    bool ascending{true};

    nlohmann::json toJson() const {
        return {
            {"expr", expr ? expr->toJson() : nullptr},
            {"direction", ascending ? "ASC" : "DESC"}
        };
    }
};

class OrderByNode : public ASTNode {
public:
    std::vector<OrderByItem> items;

    nlohmann::json toJson() const override {
        nlohmann::json itemsJson = nlohmann::json::array();
        for (const auto& it : items) {
            itemsJson.push_back(it.toJson());
        }
        return {
            {"type", "OrderByNode"},
            {"items", itemsJson}
        };
    }
};

class LimitNode : public ASTNode {
public:
    int64_t limit;

    LimitNode(int64_t l) : limit(l) {}

    nlohmann::json toJson() const override {
        return {
            {"type", "LimitNode"},
            {"limit", limit}
        };
    }
};

class QueryNode : public ASTNode {
public:
    std::unique_ptr<SelectListNode> select;
    std::unique_ptr<FromNode> from;
    std::unique_ptr<WhereNode> where;
    std::unique_ptr<GroupByNode> groupBy;
    std::unique_ptr<OrderByNode> orderBy;
    std::unique_ptr<LimitNode> limit;

    QueryNode() = default;

    nlohmann::json toJson() const override {
        nlohmann::json j;
        j["type"] = "QueryNode";
        j["select"] = select ? select->toJson() : nullptr;
        j["from"] = from ? from->toJson() : nullptr;
        j["where"] = where ? where->toJson() : nullptr;
        j["groupBy"] = groupBy ? groupBy->toJson() : nullptr;
        j["orderBy"] = orderBy ? orderBy->toJson() : nullptr;
        j["limit"] = limit ? limit->toJson() : nullptr;
        return j;
    }
};

} // namespace logql

#endif // LOGQL_AST_HPP
