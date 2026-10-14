#include "tac_generator.hpp"
#include <sstream>

namespace logql {

std::string TacGenerator::newTemp() {
    std::string t = "t" + std::to_string(tempCounter++);
    currentResult.temporaryVariables.push_back(t);
    return t;
}

std::string TacGenerator::newLabel(const std::string& prefix) {
    return prefix + std::to_string(labelCounter++);
}

void TacGenerator::emitQuad(const std::string& op, const std::string& arg1, const std::string& arg2, const std::string& res, const std::string& comment) {
    Quadruple q;
    q.index = quadIndex++;
    q.op = op;
    q.arg1 = arg1;
    q.arg2 = arg2;
    q.result = res;
    q.comment = comment;
    currentResult.quadruples.push_back(q);
}

void TacGenerator::emitCode(const std::string& code, const std::string& block, const std::string& label) {
    TacInstruction instr;
    instr.line = lineCounter++;
    instr.label = label;
    instr.code = code;
    instr.block = block;
    currentResult.instructions.push_back(instr);
}

std::string TacGenerator::generateExprTac(const ExprNode* expr, const std::string& currentBlock) {
    if (!expr) return "";

    if (const auto* lit = dynamic_cast<const LiteralNode*>(expr)) {
        std::string s = lit->value.asString();
        if (lit->value.getType() == DataType::TYPE_STRING) {
            s = "'" + s + "'";
        }
        return s;
    }

    if (const auto* id = dynamic_cast<const IdentifierNode*>(expr)) {
        return id->name;
    }

    if (const auto* bin = dynamic_cast<const BinaryOpNode*>(expr)) {
        std::string leftVal = generateExprTac(bin->left.get(), currentBlock);
        std::string rightVal = generateExprTac(bin->right.get(), currentBlock);
        std::string t = newTemp();
        emitQuad(bin->op, leftVal, rightVal, t, "Evaluate binary expression: " + leftVal + " " + bin->op + " " + rightVal);
        emitCode(t + " = " + leftVal + " " + bin->op + " " + rightVal, currentBlock);
        return t;
    }

    if (const auto* un = dynamic_cast<const UnaryOpNode*>(expr)) {
        std::string operandVal = generateExprTac(un->operand.get(), currentBlock);
        std::string t = newTemp();
        emitQuad(un->op, operandVal, "", t, "Evaluate unary expression: " + un->op + " " + operandVal);
        emitCode(t + " = " + un->op + " " + operandVal, currentBlock);
        return t;
    }

    if (const auto* fn = dynamic_cast<const FunctionCallNode*>(expr)) {
        std::string t = newTemp();
        emitQuad(fn->funcName, fn->argument, "", t, "Aggregate computation: " + fn->funcName + "(" + fn->argument + ")");
        emitCode(t + " = " + fn->funcName + "(" + fn->argument + ")", currentBlock);
        return t;
    }

    return "unknown";
}

TacGenerator::Result TacGenerator::generate(const QueryNode* query) {
    currentResult = Result();
    tempCounter = 0;
    labelCounter = 0;
    quadIndex = 0;
    lineCounter = 1;

    if (!query) return currentResult;

    std::string tableName = (query->from) ? query->from->table : "logs";
    std::string lScan = "L_SCAN_START";
    std::string lFilter = "L_FILTER";
    std::string lAgg = "L_AGGREGATE";
    std::string lProject = "L_PROJECT";
    std::string lDiscard = "L_DISCARD";
    std::string lDone = "L_DONE";

    // --- Block 0: B0_SCAN ---
    BasicBlock b0;
    b0.name = "B0_SCAN";
    b0.label = lScan;

    emitCode("// === Block B0: Scan & Read ===", b0.name);
    emitCode(lScan + ":", b0.name, lScan);
    b0.instructions.push_back(lScan + ":");

    std::string scanCode = "t0 = READ_ROW(" + tableName + ")";
    emitQuad("READ_ROW", tableName, "", "t0", "Fetch next log record into temporary row buffer");
    emitCode(scanCode, b0.name);
    b0.instructions.push_back(scanCode);

    std::string eofCheck = "ifEOF t0 goto " + lDone;
    emitQuad("IF_EOF_GOTO", "t0", "", lDone, "Terminate iteration upon reaching end of dataset stream");
    emitCode(eofCheck, b0.name);
    b0.instructions.push_back(eofCheck);

    b0.successors = { "B1_PREDICATE", "B5_HALT" };
    currentResult.basicBlocks.push_back(b0);

    // --- Block 1: B1_PREDICATE ---
    BasicBlock b1;
    b1.name = "B1_PREDICATE";
    b1.label = lFilter;
    emitCode("// === Block B1: Filter / Predicate Evaluation ===", b1.name);
    emitCode(lFilter + ":", b1.name, lFilter);
    b1.instructions.push_back(lFilter + ":");

    std::string condTemp = "";
    if (query->where && query->where->condition) {
        condTemp = generateExprTac(query->where->condition.get(), b1.name);
        b1.instructions.push_back("t_cond = " + condTemp);
        std::string ifFalseCode = "ifFalse " + condTemp + " goto " + lDiscard;
        emitQuad("IF_FALSE_GOTO", condTemp, "", lDiscard, "Branch to discard block if predicate yields false");
        emitCode(ifFalseCode, b1.name);
        b1.instructions.push_back(ifFalseCode);
        b1.successors = { "B2_AGGREGATE", "B4_DISCARD" };
    } else {
        std::string noFilter = "// No WHERE clause specified (scan all)";
        emitCode(noFilter, b1.name);
        b1.instructions.push_back(noFilter);
        b1.successors = { "B2_AGGREGATE" };
    }
    currentResult.basicBlocks.push_back(b1);

    // --- Block 2: B2_AGGREGATE ---
    BasicBlock b2;
    b2.name = "B2_AGGREGATE";
    b2.label = lAgg;
    emitCode("// === Block B2: Grouping & Aggregation ===", b2.name);
    emitCode(lAgg + ":", b2.name, lAgg);
    b2.instructions.push_back(lAgg + ":");

    if (query->groupBy && !query->groupBy->columns.empty()) {
        for (const auto& col : query->groupBy->columns) {
            std::string grpCode = "HASH_KEY " + col + " -> h_group";
            emitQuad("HASH_KEY", col, "", "h_group", "Insert record field into hash aggregate grouping key");
            emitCode(grpCode, b2.name);
            b2.instructions.push_back(grpCode);
        }
    }

    if (query->select) {
        for (const auto& it : query->select->items) {
            if (const auto* fn = dynamic_cast<const FunctionCallNode*>(it->expr.get())) {
                std::string aggTemp = newTemp();
                std::string aggCode = aggTemp + " = ACCUMULATE(" + fn->funcName + ", " + fn->argument + ")";
                emitQuad("ACCUMULATE", fn->funcName, fn->argument, aggTemp, "Update running aggregate metric accumulator");
                emitCode(aggCode, b2.name);
                b2.instructions.push_back(aggCode);
            }
        }
    }
    b2.successors = { "B3_PROJECT" };
    currentResult.basicBlocks.push_back(b2);

    // --- Block 3: B3_PROJECT ---
    BasicBlock b3;
    b3.name = "B3_PROJECT";
    b3.label = lProject;
    emitCode("// === Block B3: Project & Emit Tuple ===", b3.name);
    emitCode(lProject + ":", b3.name, lProject);
    b3.instructions.push_back(lProject + ":");

    std::vector<std::string> projFields;
    if (query->select) {
        for (const auto& it : query->select->items) {
            std::string dName = it->getDisplayName();
            std::string pCode = "PROJECT_FIELD " + dName + " -> out_tuple";
            emitQuad("PROJECT", dName, "", "out_tuple", "Map field to output tuple slot");
            emitCode(pCode, b3.name);
            b3.instructions.push_back(pCode);
        }
    }

    std::string emitCodeStr = "EMIT out_tuple";
    emitQuad("EMIT", "out_tuple", "", "RESULT_BUFFER", "Push finalized tuple to query output stream");
    emitCode(emitCodeStr, b3.name);
    b3.instructions.push_back(emitCodeStr);

    std::string loopBack = "goto " + lScan;
    emitQuad("GOTO", "", "", lScan, "Loop back to read next log stream row");
    emitCode(loopBack, b3.name);
    b3.instructions.push_back(loopBack);

    b3.successors = { "B0_SCAN" };
    currentResult.basicBlocks.push_back(b3);

    // --- Block 4: B4_DISCARD ---
    BasicBlock b4;
    b4.name = "B4_DISCARD";
    b4.label = lDiscard;
    emitCode("// === Block B4: Discard Non-Matching Row ===", b4.name);
    emitCode(lDiscard + ":", b4.name, lDiscard);
    b4.instructions.push_back(lDiscard + ":");

    std::string discardCode = "DISCARD t0";
    emitQuad("DISCARD", "t0", "", "", "Drop non-matching row without materializing");
    emitCode(discardCode, b4.name);
    b4.instructions.push_back(discardCode);

    std::string discardLoop = "goto " + lScan;
    emitQuad("GOTO", "", "", lScan, "Loop back to fetch next record");
    emitCode(discardLoop, b4.name);
    b4.instructions.push_back(discardLoop);

    b4.successors = { "B0_SCAN" };
    currentResult.basicBlocks.push_back(b4);

    // --- Block 5: B5_HALT ---
    BasicBlock b5;
    b5.name = "B5_HALT";
    b5.label = lDone;
    emitCode("// === Block B5: Termination ===", b5.name);
    emitCode(lDone + ":", b5.name, lDone);
    b5.instructions.push_back(lDone + ":");

    std::string haltCode = "HALT";
    emitQuad("HALT", "", "", "", "Finalize query execution pipeline");
    emitCode(haltCode, b5.name);
    b5.instructions.push_back(haltCode);

    b5.successors = {};
    currentResult.basicBlocks.push_back(b5);

    return currentResult;
}

} // namespace logql
