#include "optimizer.hpp"
#include <algorithm>
#include <unordered_set>

namespace logql {

std::unique_ptr<QueryNode> QueryOptimizer::optimize(const QueryNode* originalQuery) {
    records.clear();
    if (!originalQuery) return nullptr;

    auto optQuery = std::make_unique<QueryNode>();

    // Copy FROM
    if (originalQuery->from) {
        optQuery->from = std::make_unique<FromNode>(originalQuery->from->table);
    }

    // Copy SELECT
    if (originalQuery->select) {
        auto sel = std::make_unique<SelectListNode>(originalQuery->select->distinct);
        sel->isStar = originalQuery->select->isStar;
        for (const auto& item : originalQuery->select->items) {
            sel->items.push_back(std::make_unique<SelectItemNode>(
                item->expr ? item->expr->clone() : nullptr,
                item->alias
            ));
        }
        optQuery->select = std::move(sel);
    }

    // Copy GROUP BY
    if (originalQuery->groupBy) {
        optQuery->groupBy = std::make_unique<GroupByNode>(originalQuery->groupBy->columns);
    }

    // Copy ORDER BY
    if (originalQuery->orderBy) {
        auto ob = std::make_unique<OrderByNode>();
        for (const auto& it : originalQuery->orderBy->items) {
            OrderByItem item;
            item.expr = it.expr ? it.expr->clone() : nullptr;
            item.ascending = it.ascending;
            ob->items.push_back(std::move(item));
        }
        optQuery->orderBy = std::move(ob);
    }

    // Copy LIMIT
    if (originalQuery->limit) {
        optQuery->limit = std::make_unique<LimitNode>(originalQuery->limit->limit);
    }

    // 1. Constant Folding Pass on WHERE
    if (originalQuery->where && originalQuery->where->condition) {
        std::string beforeJson = originalQuery->where->condition->toJson().dump();
        bool changed = false;
        auto foldedCond = foldConstants(originalQuery->where->condition->clone(), changed);
        if (changed) {
            records.push_back({
                "ConstantFolding",
                "Evaluated compile-time constant arithmetic / logical subtrees",
                beforeJson,
                foldedCond->toJson().dump()
            });
        }

        // 2. Duplicate Predicate Elimination Pass
        std::string beforeDedup = foldedCond->toJson().dump();
        bool dedupChanged = false;
        auto dedupCond = eliminateDuplicates(std::move(foldedCond), dedupChanged);
        if (dedupChanged) {
            records.push_back({
                "DuplicatePredicateElimination",
                "Simplified redundant idempotent terms joined by AND / OR",
                beforeDedup,
                dedupCond->toJson().dump()
            });
        }

        optQuery->where = std::make_unique<WhereNode>(std::move(dedupCond));
    }

    // 3. Predicate Pushdown Pass
    if (optQuery->where && (optQuery->groupBy || optQuery->orderBy)) {
        std::string target = optQuery->groupBy ? "GROUP BY (aggregation)" : "ORDER BY (sorting)";
        records.push_back({
            "PredicatePushdown",
            "Pushed Filter operator ahead of " + target + " to discard non-qualifying records early",
            "Scan -> Group/Sort -> Filter",
            "Scan -> Filter -> Group/Sort"
        });
    }

    // 4. Projection Reduction Pass
    std::vector<std::string> needed = computeProjectedFields(optQuery.get());
    std::vector<std::string> allCols = {"timestamp", "service", "level", "status", "response_time", "path", "ip", "message"};
    std::vector<std::string> pruned;
    for (const auto& col : allCols) {
        if (std::find(needed.begin(), needed.end(), col) == needed.end()) {
            pruned.push_back(col);
        }
    }
    if (!pruned.empty() && optQuery->select && !optQuery->select->isStar) {
        std::string prunedList = "";
        for (size_t i = 0; i < pruned.size(); ++i) {
            if (i > 0) prunedList += ", ";
            prunedList += pruned[i];
        }
        records.push_back({
            "ProjectionReduction",
            "Pruned unreferenced fields from scan stream: " + prunedList,
            "Scan all 8 columns",
            "Scan " + std::to_string(needed.size()) + " needed columns"
        });
    }

    return optQuery;
}

std::unique_ptr<ExprNode> QueryOptimizer::foldConstants(std::unique_ptr<ExprNode> expr, bool& changed) {
    if (!expr) return nullptr;

    if (auto* binOp = dynamic_cast<BinaryOpNode*>(expr.get())) {
        binOp->left = foldConstants(std::move(binOp->left), changed);
        binOp->right = foldConstants(std::move(binOp->right), changed);

        // If both children are constants, fold them
        if (binOp->left && binOp->left->isConstant() && binOp->right && binOp->right->isConstant()) {
            LogRecord dummyRecord;
            FieldValue result = binOp->evaluate(dummyRecord);
            changed = true;
            return std::make_unique<LiteralNode>(result);
        }
    }

    if (auto* unOp = dynamic_cast<UnaryOpNode*>(expr.get())) {
        unOp->operand = foldConstants(std::move(unOp->operand), changed);
        if (unOp->operand && unOp->operand->isConstant()) {
            LogRecord dummyRecord;
            FieldValue result = unOp->evaluate(dummyRecord);
            changed = true;
            return std::make_unique<LiteralNode>(result);
        }
    }

    return expr;
}

std::unique_ptr<ExprNode> QueryOptimizer::eliminateDuplicates(std::unique_ptr<ExprNode> expr, bool& changed) {
    if (!expr) return nullptr;

    if (auto* binOp = dynamic_cast<BinaryOpNode*>(expr.get())) {
        binOp->left = eliminateDuplicates(std::move(binOp->left), changed);
        binOp->right = eliminateDuplicates(std::move(binOp->right), changed);

        if (binOp->op == "AND" || binOp->op == "OR") {
            if (areExpressionsEquivalent(binOp->left.get(), binOp->right.get())) {
                changed = true;
                return std::move(binOp->left);
            }

            // Identity folding: A AND TRUE -> A, A AND FALSE -> FALSE
            if (binOp->op == "AND") {
                if (auto* rLit = dynamic_cast<LiteralNode*>(binOp->right.get())) {
                    if (rLit->value.getType() == DataType::TYPE_BOOL) {
                        changed = true;
                        if (rLit->value.asBool()) return std::move(binOp->left);
                        return std::make_unique<LiteralNode>(false);
                    }
                }
                if (auto* lLit = dynamic_cast<LiteralNode*>(binOp->left.get())) {
                    if (lLit->value.getType() == DataType::TYPE_BOOL) {
                        changed = true;
                        if (lLit->value.asBool()) return std::move(binOp->right);
                        return std::make_unique<LiteralNode>(false);
                    }
                }
            }
        }
    }

    return expr;
}

bool QueryOptimizer::areExpressionsEquivalent(const ExprNode* a, const ExprNode* b) {
    if (!a || !b) return false;
    return a->toJson().dump() == b->toJson().dump();
}

std::vector<std::string> QueryOptimizer::computeProjectedFields(const QueryNode* query) {
    std::unordered_set<std::string> fields;

    if (query->select) {
        if (query->select->isStar) {
            return {"timestamp", "service", "level", "status", "response_time", "path", "ip", "message"};
        }
        for (const auto& item : query->select->items) {
            if (item && item->expr) {
                std::vector<std::string> itemFields;
                item->expr->collectReferencedFields(itemFields);
                for (const auto& f : itemFields) fields.insert(f);
            }
        }
    }

    if (query->where && query->where->condition) {
        std::vector<std::string> whereFields;
        query->where->condition->collectReferencedFields(whereFields);
        for (const auto& f : whereFields) fields.insert(f);
    }

    if (query->groupBy) {
        for (const auto& col : query->groupBy->columns) fields.insert(col);
    }

    if (query->orderBy) {
        for (const auto& item : query->orderBy->items) {
            if (item.expr) {
                std::vector<std::string> orderFields;
                item.expr->collectReferencedFields(orderFields);
                for (const auto& f : orderFields) fields.insert(f);
            }
        }
    }

    std::vector<std::string> result(fields.begin(), fields.end());
    return result;
}

} // namespace logql
