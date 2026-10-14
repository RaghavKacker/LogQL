#ifndef LOGQL_TAC_GENERATOR_HPP
#define LOGQL_TAC_GENERATOR_HPP

#include <string>
#include <vector>
#include <memory>
#include "ast.hpp"
#include "json.hpp"

namespace logql {

struct Quadruple {
    int index{0};
    std::string op;
    std::string arg1;
    std::string arg2;
    std::string result;
    std::string comment;

    nlohmann::json toJson() const {
        return {
            {"index", index},
            {"op", op},
            {"arg1", arg1},
            {"arg2", arg2},
            {"result", result},
            {"comment", comment}
        };
    }
};

struct TacInstruction {
    int line{0};
    std::string label;
    std::string code;
    std::string block;

    nlohmann::json toJson() const {
        return {
            {"line", line},
            {"label", label},
            {"code", code},
            {"block", block}
        };
    }
};

struct BasicBlock {
    std::string name;
    std::string label;
    std::vector<std::string> instructions;
    std::vector<std::string> successors;

    nlohmann::json toJson() const {
        return {
            {"name", name},
            {"label", label},
            {"instructions", instructions},
            {"successors", successors}
        };
    }
};

class TacGenerator {
public:
    TacGenerator() = default;

    struct Result {
        std::vector<Quadruple> quadruples;
        std::vector<TacInstruction> instructions;
        std::vector<BasicBlock> basicBlocks;
        std::vector<std::string> temporaryVariables;

        nlohmann::json toJson() const {
            nlohmann::json quads = nlohmann::json::array();
            for (const auto& q : quadruples) quads.push_back(q.toJson());

            nlohmann::json instrs = nlohmann::json::array();
            for (const auto& i : instructions) instrs.push_back(i.toJson());

            nlohmann::json blocks = nlohmann::json::array();
            for (const auto& b : basicBlocks) blocks.push_back(b.toJson());

            return {
                {"quadruples", quads},
                {"instructions", instrs},
                {"basicBlocks", blocks},
                {"temporaryCount", temporaryVariables.size()},
                {"temporaryVariables", temporaryVariables}
            };
        }
    };

    Result generate(const QueryNode* query);

private:
    int tempCounter{0};
    int labelCounter{0};
    int quadIndex{0};
    int lineCounter{1};

    Result currentResult;

    std::string newTemp();
    std::string newLabel(const std::string& prefix = "L");
    void emitQuad(const std::string& op, const std::string& arg1, const std::string& arg2, const std::string& res, const std::string& comment = "");
    void emitCode(const std::string& code, const std::string& block, const std::string& label = "");

    std::string generateExprTac(const ExprNode* expr, const std::string& currentBlock);
};

} // namespace logql

#endif // LOGQL_TAC_GENERATOR_HPP
