#include <iostream>
#include <cassert>
#include <string>
#include <vector>
#include "token.hpp"
#include "ast.hpp"
#include "semantic.hpp"
#include "optimizer.hpp"
#include "execution_plan.hpp"
#include "executor.hpp"

extern int yyparse();
extern void logql_scan_string(const char* str);
extern void logql_delete_buffer();
extern logql::QueryNode* g_parsedQuery;
extern std::string g_parseError;
extern std::vector<logql::Token> g_scannedTokens;

bool runTest(const std::string& testName, const std::string& query, bool shouldSucceed, bool checkOptimizations = false) {
    std::cout << "[RUNNING] " << testName << " ... ";
    g_scannedTokens.clear();
    g_parseError.clear();
    g_parsedQuery = nullptr;

    logql_scan_string(query.c_str());
    int parseRes = yyparse();
    logql_delete_buffer();

    if (parseRes != 0 || !g_parsedQuery) {
        if (!shouldSucceed) {
            std::cout << "PASSED (Expected syntax failure: " << g_parseError << ")" << std::endl;
            return true;
        } else {
            std::cout << "FAILED (Unexpected syntax error: " << g_parseError << ")" << std::endl;
            return false;
        }
    }

    logql::SemanticAnalyzer analyzer;
    logql::SemanticResult semRes = analyzer.analyze(g_parsedQuery);

    if (!semRes.isValid) {
        if (!shouldSucceed) {
            std::cout << "PASSED (Expected semantic failure)" << std::endl;
            delete g_parsedQuery;
            return true;
        } else {
            std::cout << "FAILED (Unexpected semantic error: " << semRes.diagnostics[0].message << ")" << std::endl;
            delete g_parsedQuery;
            return false;
        }
    }

    if (!shouldSucceed) {
        std::cout << "FAILED (Query was expected to fail semantic check but passed)" << std::endl;
        delete g_parsedQuery;
        return false;
    }

    // Optimization check
    logql::QueryOptimizer opt;
    auto optQuery = opt.optimize(g_parsedQuery);

    if (checkOptimizations && opt.records.empty()) {
        std::cout << "FAILED (Expected optimizations to be applied)" << std::endl;
        delete g_parsedQuery;
        return false;
    }

    // Execution check on synthetic records
    std::vector<logql::LogRecord> dataset;
    for (int i = 0; i < 100; ++i) {
        logql::LogRecord r;
        r.service = (i % 2 == 0) ? "auth-service" : "payment-api";
        r.status = (i % 4 == 0) ? 500 : 200;
        r.response_time = (double)(i * 5);
        r.level = (r.status >= 500) ? "ERROR" : "INFO";
        r.path = "/api/test";
        r.ip = "127.0.0.1";
        r.message = "Test message";
        r.timestamp = "2026-09-28T10:00:00Z";
        dataset.push_back(r);
    }

    logql::QueryExecutor executor;
    auto execRes = executor.execute(optQuery.get(), dataset);
    if (!execRes.success) {
        std::cout << "FAILED (Execution error: " << execRes.errorMessage << ")" << std::endl;
        delete g_parsedQuery;
        return false;
    }

    delete g_parsedQuery;
    std::cout << "PASSED (Returned " << execRes.rows.size() << " rows)" << std::endl;
    return true;
}

int main() {
    std::cout << "=============================================" << std::endl;
    std::cout << "      LOGQL COMPILER TEST SUITE RUNNER       " << std::endl;
    std::cout << "=============================================" << std::endl;

    int passed = 0;
    int total = 0;

    total++; if (runTest("TC-01: Basic SELECT & FROM", "SELECT service, status FROM logs;", true)) passed++;
    total++; if (runTest("TC-02: WHERE filter", "SELECT * FROM logs WHERE status >= 500;", true)) passed++;
    total++; if (runTest("TC-03: Conjunction AND/OR", "SELECT service FROM logs WHERE status = 500 AND response_time > 100;", true)) passed++;
    total++; if (runTest("TC-04: GROUP BY Aggregation", "SELECT service, COUNT(*) FROM logs GROUP BY service;", true)) passed++;
    total++; if (runTest("TC-05: ORDER BY & LIMIT", "SELECT service, COUNT(*) FROM logs GROUP BY service ORDER BY COUNT(*) DESC LIMIT 5;", true)) passed++;
    total++; if (runTest("TC-06: Constant Folding", "SELECT * FROM logs WHERE status = 200 + 300;", true, true)) passed++;
    total++; if (runTest("TC-07: Duplicate Predicate Removal", "SELECT * FROM logs WHERE status = 500 AND status = 500;", true, true)) passed++;
    total++; if (runTest("TC-08: Semantic Failure - Unknown Field", "SELECT unknown_col FROM logs;", false)) passed++;
    total++; if (runTest("TC-09: Semantic Failure - Missing GROUP BY", "SELECT service, path, COUNT(*) FROM logs GROUP BY service;", false)) passed++;
    total++; if (runTest("TC-10: Syntax Error - Malformed Query", "SELECT FROM WHERE;", false)) passed++;

    std::cout << "=============================================" << std::endl;
    std::cout << "RESULTS: " << passed << " / " << total << " tests passed." << std::endl;
    std::cout << "=============================================" << std::endl;

    return (passed == total) ? 0 : 1;
}
