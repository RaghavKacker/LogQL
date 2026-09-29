#include "ast.hpp"
#include <cmath>

namespace logql {

FieldValue BinaryOpNode::evaluate(const LogRecord& record) const {
    if (!left || !right) return FieldValue();

    // Logical operators
    if (op == "AND") {
        FieldValue l = left->evaluate(record);
        if (!l.asBool()) return FieldValue(false);
        FieldValue r = right->evaluate(record);
        return FieldValue(r.asBool());
    }
    if (op == "OR") {
        FieldValue l = left->evaluate(record);
        if (l.asBool()) return FieldValue(true);
        FieldValue r = right->evaluate(record);
        return FieldValue(r.asBool());
    }

    FieldValue l = left->evaluate(record);
    FieldValue r = right->evaluate(record);

    if (l.isNull() || r.isNull()) return FieldValue();

    // Comparison operators
    if (op == "=") {
        if (l.isNumeric() && r.isNumeric()) {
            return FieldValue(std::abs(l.asFloat() - r.asFloat()) < 1e-9);
        }
        return FieldValue(l.asString() == r.asString());
    }
    if (op == "!=") {
        if (l.isNumeric() && r.isNumeric()) {
            return FieldValue(std::abs(l.asFloat() - r.asFloat()) >= 1e-9);
        }
        return FieldValue(l.asString() != r.asString());
    }
    if (op == "<") {
        if (l.isNumeric() && r.isNumeric()) return FieldValue(l.asFloat() < r.asFloat());
        return FieldValue(l.asString() < r.asString());
    }
    if (op == ">") {
        if (l.isNumeric() && r.isNumeric()) return FieldValue(l.asFloat() > r.asFloat());
        return FieldValue(l.asString() > r.asString());
    }
    if (op == "<=") {
        if (l.isNumeric() && r.isNumeric()) return FieldValue(l.asFloat() <= r.asFloat());
        return FieldValue(l.asString() <= r.asString());
    }
    if (op == ">=") {
        if (l.isNumeric() && r.isNumeric()) return FieldValue(l.asFloat() >= r.asFloat());
        return FieldValue(l.asString() >= r.asString());
    }

    // Arithmetic operators
    if (op == "+") {
        if (l.getType() == DataType::TYPE_INT && r.getType() == DataType::TYPE_INT) {
            return FieldValue(l.asInt() + r.asInt());
        }
        return FieldValue(l.asFloat() + r.asFloat());
    }
    if (op == "-") {
        if (l.getType() == DataType::TYPE_INT && r.getType() == DataType::TYPE_INT) {
            return FieldValue(l.asInt() - r.asInt());
        }
        return FieldValue(l.asFloat() - r.asFloat());
    }
    if (op == "*") {
        if (l.getType() == DataType::TYPE_INT && r.getType() == DataType::TYPE_INT) {
            return FieldValue(l.asInt() * r.asInt());
        }
        return FieldValue(l.asFloat() * r.asFloat());
    }
    if (op == "/") {
        double rVal = r.asFloat();
        if (std::abs(rVal) < 1e-9) return FieldValue(); // Null on divide-by-zero
        if (l.getType() == DataType::TYPE_INT && r.getType() == DataType::TYPE_INT && r.asInt() != 0 && (l.asInt() % r.asInt() == 0)) {
            return FieldValue(l.asInt() / r.asInt());
        }
        return FieldValue(l.asFloat() / rVal);
    }

    return FieldValue();
}

FieldValue UnaryOpNode::evaluate(const LogRecord& record) const {
    if (!operand) return FieldValue();
    FieldValue val = operand->evaluate(record);

    if (op == "NOT") {
        return FieldValue(!val.asBool());
    }
    if (op == "-") {
        if (val.getType() == DataType::TYPE_INT) return FieldValue(-val.asInt());
        return FieldValue(-val.asFloat());
    }

    return val;
}

} // namespace logql
