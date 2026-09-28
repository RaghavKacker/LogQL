# LogQL — Compiler-Based Log Query & Optimization Engine

> **A B.Tech Computer Science Compiler Design Mini Project** demonstrating lexical analysis, syntax parsing, AST construction, semantic validation, rule-based query optimization, and query execution against structured server logs.

---

## 📌 Project Overview

**LogQL** is a purpose-built Domain-Specific Language (DSL) and execution system designed to query application and server logs declaratively. Rather than relying on third-party SQL parsers or database engines, LogQL implements the complete multi-stage compiler pipeline from scratch using **Flex**, **Bison**, and **C++17**, connected to an interactive **FastAPI** backend and **Next.js** developer studio.

### Key Capabilities
* **Custom Lexer & Parser**: Built with Flex (`lexer.l`) and Bison (`parser.y`) enforcing strict LALR(1) Context-Free Grammar.
* **Inspectable AST**: Hierarchical Abstract Syntax Tree representation with full JSON export for visualization.
* **Semantic Analysis**: Scope, schema attribute existence, operand type consistency, and aggregation constraint checks.
* **Demonstrable Query Optimization**: Rule-based passes including **Constant Folding**, **Predicate Pushdown**, **Duplicate Predicate Elimination**, and **Projection Reduction**.
* **Volcano-Style Execution Engine**: In-memory physical operator pipeline (`Scan`, `Filter`, `Aggregate`, `Project`, `Sort`, `Limit`).
* **Visual Developer Studio**: Interactive multi-tab UI to inspect Tokens, AST, Semantic Diagnostics, Optimizer Diffs, Physical Plans, and Log Analytics.

---

## 📚 Technical Documentation & Specifications

The complete design specification is split into dedicated, single-source-of-truth documents:

* 📄 **[PROJECT_CONTEXT.md](file:///d:/Projects/LogQl-%20CD%20Mini%20Project/PROJECT_CONTEXT.md)**: Academic context, domain problem, design philosophy, scope, and non-goals.
* 📄 **[REQUIREMENTS.md](file:///d:/Projects/LogQl-%20CD%20Mini%20Project/REQUIREMENTS.md)**: Functional/non-functional requirements, full grammar specification, and acceptance criteria.
* 📄 **[ARCHITECTURE.md](file:///d:/Projects/LogQl-%20CD%20Mini%20Project/ARCHITECTURE.md)**: 3-tier architecture, compiler pipeline stages, AST class hierarchy, and directory structure.
* 📄 **[TECH_STACK.md](file:///d:/Projects/LogQl-%20CD%20Mini%20Project/TECH_STACK.md)**: Technology choices, dependencies, build toolchains, and version guidance.
* 📄 **[DATABASE.md](file:///d:/Projects/LogQl-%20CD%20Mini%20Project/DATABASE.md)**: In-memory record storage strategy, normalized schema, log format parsers, and sample datasets.

---

## ⚙️ Compiler Pipeline

```text
LogQL Query ──► [ Lexer (Flex) ] ──► [ Parser (Bison) ] ──► [ AST Generation ]
                                                                     │
                                                                     ▼
Results & Charts ◄── [ Execution Engine ] ◄── [ Optimizer ] ◄── [ Semantic Check ]
```

---

## 🚀 Example LogQL Queries

```sql
-- 1. Simple Filter & Limit
SELECT timestamp, service, status, message
FROM logs
WHERE status >= 500
LIMIT 20;

-- 2. Aggregation & Grouping
SELECT service, COUNT(*)
FROM logs
WHERE status >= 400
GROUP BY service
ORDER BY COUNT(*) DESC;

-- 3. Optimization Demonstration (Constant Folding & Redundant Filter)
SELECT path, AVG(response_time)
FROM logs
WHERE status = 200 + 300 AND status >= 500
GROUP BY path
ORDER BY AVG(response_time) DESC;
```

---

## 🛠️ Tech Stack Summary

* **Compiler Core**: Flex (Lexer), Bison (Parser), C++17 (AST, Semantic Analyzer, Optimizer, Execution Engine)
* **Backend Bridge**: Python 3.10+, FastAPI, Pydantic, Uvicorn
* **Frontend Studio**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React, Recharts
* **Storage**: In-memory normalized record vector (Zero external database setup required)
