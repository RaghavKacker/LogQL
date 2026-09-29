#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <memory>
#include <regex>

#include "token.hpp"
#include "ast.hpp"
#include "semantic.hpp"
#include "optimizer.hpp"
#include "execution_plan.hpp"
#include "executor.hpp"
#include "json.hpp"

// Bison / Flex globals
extern int yyparse();
extern void logql_scan_string(const char* str);
extern void logql_delete_buffer();
extern logql::QueryNode* g_parsedQuery;
extern std::string g_parseError;
extern int g_errorLine;
extern int g_errorCol;
extern std::vector<logql::Token> g_scannedTokens;

std::vector<logql::LogRecord> loadDataset(const std::string& path) {
    std::vector<logql::LogRecord> records;
    std::ifstream file(path);
    if (!file.is_open()) return records;

    std::string line;
    // Regex for Nginx/Apache Combined Log Format
    std::regex clfRegex(R"regex(^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d{3}) (\d+) "(.*?)" "(.*?)"$)regex");
    // Regex for Syslog RFC 3164
    std::regex syslogRegex(R"regex(^([A-Za-z]{3}\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(\S+)\[(\d+)\]:\s+(\w+)\s+\[(\d+)\]\s+(.*)$)regex");

    while (std::getline(file, line)) {
        if (line.empty()) continue;

        // Try JSON Lines
        if (line.front() == '{' && line.back() == '}') {
            try {
                auto j = nlohmann::json::parse(line);
                records.push_back(logql::LogRecord::fromJson(j));
                continue;
            } catch (...) {}
        }

        // Try Combined Log Format
        std::smatch m;
        if (std::regex_match(line, m, clfRegex)) {
            logql::LogRecord r;
            r.ip = m[1].str();
            r.timestamp = m[2].str();
            r.path = m[4].str();
            r.status = std::stoll(m[5].str());
            r.response_time = std::stod(m[6].str());
            r.service = m[7].str();
            r.message = m[8].str();
            r.level = (r.status >= 500) ? "ERROR" : ((r.status >= 400) ? "WARN" : "INFO");
            records.push_back(r);
            continue;
        }

        // Try Syslog
        if (std::regex_match(line, m, syslogRegex)) {
            logql::LogRecord r;
            r.timestamp = m[1].str();
            r.ip = m[2].str();
            r.service = m[3].str();
            r.level = m[5].str();
            r.status = std::stoll(m[6].str());
            r.message = m[7].str();
            r.path = "/";
            r.response_time = 10.0;
            records.push_back(r);
            continue;
        }

        // Fallback default
        logql::LogRecord r;
        r.message = line;
        r.service = "system";
        r.level = "INFO";
        r.status = 200;
        records.push_back(r);
    }

    return records;
}

int main(int argc, char** argv) {
    std::string queryString = "";
    std::string datasetPath = "";
    bool jsonMode = false;
    bool executeMode = false;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--query" && i + 1 < argc) {
            queryString = argv[++i];
        } else if (arg == "--dataset" && i + 1 < argc) {
            datasetPath = argv[++i];
        } else if (arg == "--json") {
            jsonMode = true;
        } else if (arg == "--execute") {
            executeMode = true;
        }
    }

    // If query string is empty, check standard input
    if (queryString.empty()) {
        std::string line;
        std::stringstream ss;
        while (std::getline(std::cin, line)) {
            ss << line << "\n";
        }
        queryString = ss.str();
    }

    if (queryString.empty()) {
        if (jsonMode) {
            nlohmann::json err = {
                {"success", false},
                {"stage", "Input"},
                {"error", "Empty query string provided"}
            };
            std::cout << err.dump(2) << std::endl;
        } else {
            std::cerr << "Error: Empty query provided." << std::endl;
        }
        return 1;
    }

    // 1. Lexical & Syntax Analysis
    g_scannedTokens.clear();
    g_parseError.clear();
    g_parsedQuery = nullptr;

    logql_scan_string(queryString.c_str());
    int parseResult = yyparse();
    logql_delete_buffer();

    if (parseResult != 0 || !g_parsedQuery) {
        if (jsonMode) {
            nlohmann::json err = {
                {"success", false},
                {"stage", "Parser"},
                {"error", g_parseError.empty() ? "Syntax error in LogQL query" : g_parseError},
                {"line", g_errorLine},
                {"col", g_errorCol},
                {"tokens", nlohmann::json::array()}
            };
            for (const auto& t : g_scannedTokens) err["tokens"].push_back(t.toJson());
            std::cout << err.dump(2) << std::endl;
        } else {
            std::cerr << "Syntax Error at line " << g_errorLine << ", col " << g_errorCol
                      << ": " << g_parseError << std::endl;
        }
        return 1;
    }

    // 2. Semantic Analysis
    logql::SemanticAnalyzer semanticAnalyzer;
    logql::SemanticResult semanticResult = semanticAnalyzer.analyze(g_parsedQuery);

    if (!semanticResult.isValid) {
        if (jsonMode) {
            nlohmann::json resp = {
                {"success", false},
                {"stage", "SemanticAnalysis"},
                {"tokens", nlohmann::json::array()},
                {"ast", g_parsedQuery->toJson()},
                {"semantic", semanticResult.toJson()}
            };
            for (const auto& t : g_scannedTokens) resp["tokens"].push_back(t.toJson());
            std::cout << resp.dump(2) << std::endl;
        } else {
            std::cerr << "Semantic Error(s) detected:" << std::endl;
            for (const auto& d : semanticResult.diagnostics) {
                std::cerr << "  [" << d.severity << "] " << d.message << std::endl;
            }
        }
        delete g_parsedQuery;
        return 1;
    }

    // 3. Query Optimization
    logql::QueryOptimizer optimizer;
    auto optimizedQuery = optimizer.optimize(g_parsedQuery);

    // 4. Physical Execution Planning
    logql::ExecutionPlanner planner;
    auto physicalPlan = planner.buildPlan(optimizedQuery.get());

    // 5. Query Execution (if requested and dataset provided)
    logql::QueryResult execResult;
    if (executeMode && !datasetPath.empty()) {
        std::vector<logql::LogRecord> dataset = loadDataset(datasetPath);
        logql::QueryExecutor executor;
        execResult = executor.execute(optimizedQuery.get(), dataset);
    }

    // Output formatting
    if (jsonMode) {
        nlohmann::json output;
        output["success"] = true;

        // Token stream
        nlohmann::json tokensJson = nlohmann::json::array();
        for (const auto& t : g_scannedTokens) tokensJson.push_back(t.toJson());
        output["tokens"] = tokensJson;

        // AST
        output["ast"] = g_parsedQuery->toJson();
        output["optimizedAst"] = optimizedQuery->toJson();

        // Semantic diagnostics
        output["semantic"] = semanticResult.toJson();

        // Optimizations
        nlohmann::json optList = nlohmann::json::array();
        for (const auto& opt : optimizer.records) optList.push_back(opt.toJson());
        output["optimizations"] = optList;

        // Physical Plan
        output["physicalPlan"] = physicalPlan ? physicalPlan->toJson() : nullptr;

        // Execution Results
        if (executeMode && !datasetPath.empty()) {
            output["results"] = execResult.toJson();
        }

        std::cout << output.dump(2) << std::endl;
    } else {
        std::cout << "=== LogQL Compilation Successful ===" << std::endl;
        std::cout << "Tokens: " << g_scannedTokens.size() << std::endl;
        std::cout << "Optimizations applied: " << optimizer.records.size() << std::endl;
        for (const auto& r : optimizer.records) {
            std::cout << "  - [" << r.rule << "] " << r.description << std::endl;
        }

        if (executeMode && !datasetPath.empty()) {
            std::cout << "\n=== Execution Results (" << execResult.rows.size() << " rows, "
                      << execResult.metrics.executionTimeMs << " ms) ===" << std::endl;
            for (const auto& row : execResult.rows) {
                std::cout << row.dump() << std::endl;
            }
        }
    }

    delete g_parsedQuery;
    return 0;
}
