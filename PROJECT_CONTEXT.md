# PROJECT CONTEXT

## 1. Project Identity

* **Project Name**: LogQL
* **Full Title**: LogQL — Compiler-Based Log Query & Optimization Engine
* **Academic Title**: A Compiler-Based Log Query and Optimization System
* **Project Type**: B.Tech Computer Science Compiler Design Mini Project
* **Domain**: Compiler Design + Domain-Specific Query Languages + Log Analysis

---

## 2. Academic Context & Educational Purpose

This project demonstrates the practical application of core **Compiler Design** theory to domain-specific log analytics. Instead of treating compiler design as an abstract, purely academic exercise (e.g., standard toy arithmetic evaluators), LogQL implements a complete, end-to-end compiler pipeline for a declarative query language designed to inspect structured log records.

The primary academic concepts demonstrated include:
* **Lexical Analysis**: Regular expressions, token generation, symbol/keyword recognition using **Flex / Lex**.
* **Syntax Analysis & Grammars**: Context-Free Grammars (CFG), LALR(1) parsing, shift-reduce conflict resolution, operator precedence handling using **Bison / YACC**.
* **Abstract Syntax Trees (AST)**: Intermediate structural representations modeling query structure, expressions, and clauses.
* **Semantic Analysis**: Scope/schema verification, symbol validation, type consistency checking, and aggregation constraint validation.
* **Query Optimization (Intermediate Code Optimization)**: AST and plan-level transformations including Predicate Pushdown, Constant Folding, Duplicate Predicate Elimination, and Projection Reduction.
* **Target Code Generation / Execution Planning**: Constructing a physical iterator/operator pipeline from an optimized query tree and executing it against normalized in-memory data.

---

## 3. The Problem

Modern server and application logging generates large volumes of textual data. Developers and system administrators frequently need to extract metrics, identify error spikes, and aggregate operational metrics.

Standard approaches usually rely on:
1. **Ad-hoc shell scripts / regex pipelines** (`grep`, `awk`, `sed`, `jq`), which are error-prone, lack type checking, and require complex procedural syntax for basic aggregations.
2. **Heavyweight enterprise platforms** (Elasticsearch, Splunk, Datadog), which require substantial infrastructure, distributed nodes, heavy memory footprints, and complex query engines.

LogQL bridges this gap conceptually for educational purposes by providing a declarative, SQL-inspired Domain-Specific Language (DSL) specifically tailored for structured server logs, implemented from the ground up using classic compiler construction tools.

---

## 4. Vision & Project Goals

The vision of LogQL is to provide a clean, self-contained educational compiler and execution system that:
* Transforms declarative LogQL source text into verified, optimized query execution plans.
* Exposes all compiler intermediate stages (tokens, AST, semantic diagnostics, optimizer passes, and execution plans) transparently through a developer-focused user interface.
* Delivers sub-millisecond query evaluation on local datasets without requiring heavy database installations or cloud infrastructure.
* Serves as an exemplary viva-ready project demonstrating every phase taught in an undergraduate Compiler Design course.

---

## 5. Core Compiler Pipeline

The query lifecycle strictly follows the classical multi-phase compiler pipeline:

```text
                     LogQL Query Source
                            │
                            ▼
                  [ Lexical Analysis ]  (Flex / Lex)
                            │
                       Token Stream
                            │
                            ▼
                  [ Syntax Analysis ]   (Bison / YACC)
                            │
                   Abstract Syntax Tree
                            │
                            ▼
                 [ Semantic Analysis ]  (Type/Schema Checker)
                            │
                    Decorated / Valid AST
                            │
                            ▼
                 [ Query Optimization ] (Rule-Based Transformations)
                            │
                    Optimized AST / Plan
                            │
                            ▼
                 [ Execution Planning ] (Physical Operator Tree)
                            │
                            ▼
                  [ Execution Engine ]  (Scan, Filter, Group, Sort)
                            │
                            ▼
                   Results & Diagnostics
```

---

## 6. Project Scope

### Included in Mini Project Scope (MVP):
* **Log Ingestion & Normalization**: Parsing common log formats (JSON logs, standard Apache/Nginx combined format, Syslog) into in-memory normalized records.
* **LogQL Language Support**:
  * Core clauses: `SELECT`, `FROM`, `WHERE`, `GROUP BY`, `ORDER BY`, `LIMIT`.
  * Modifiers & Predicates: `DISTINCT`, `AND`, `OR`, `NOT`.
  * Comparison operators: `=`, `!=`, `<`, `>`, `<=`, `>=`.
  * Aggregation functions: `COUNT()`, `MIN()`, `MAX()`, `AVG()`, `SUM()`.
* **Complete Compiler Pipeline**:
  * Lexer built with Flex.
  * Parser built with Bison.
  * Explicit C/C++ AST data structures with serialization capabilities (JSON output for tooling/UI).
  * Robust semantic analyzer with clear error diagnostics (line/column information).
  * Four demonstrable optimization passes: Constant Folding, Predicate Pushdown, Duplicate Predicate Elimination, and Projection Reduction.
* **Execution & Query Plan Output**:
  * Step-by-step physical plan execution engine.
  * Performance metrics (records scanned vs. records output, parse time, optimization savings).
* **Minimalist Developer Web UI**:
  * Interactive query editor.
  * Visual inspection tabs for: Query Results, Token Stream, AST Hierarchy, Semantic Validation Status, Optimization Diffs, and Execution Plan Tree.
  * Quick-select preloaded sample log datasets.

---

## 7. Out of Scope (Non-Goals)

To keep this project strictly aligned with the time and complexity constraints of a college mini project, the following are **explicitly excluded**:
* **No Cloud / Container Infrastructures**: No Docker, Kubernetes, AWS, GCP, or Helm charts.
* **No Distributed Systems**: No distributed workers, Kafka streaming, clustering, or map-reduce engines.
* **No Heavy Enterprise Databases**: No PostgreSQL, MySQL, MongoDB, Cassandra, or Elasticsearch cluster requirements.
* **No Authentication / Multi-Tenancy**: No login pages, JWT auth, RBAC, or user management.
* **No Full SQL Standards Compliance**: LogQL is an intentional DSL for logs, not a full ANSI SQL-92/99 database engine (e.g., no multi-table JOINs, subqueries, CTEs, transactions, schema migrations, or DDL).
* **No Machine-Learning Black Boxes**: Anomaly detection (if referenced) is strictly rule-based (e.g., status code thresholds, response time percentiles), not ML/neural models.
* **No Production CI/CD or Microservices**: The system is structured as a clean, modular monolith with a C/C++ compiler core, a lightweight Python bridge/backend, and a local Next.js frontend.

---

## 8. Design & Development Philosophy

The development of LogQL is governed by the following hierarchy of priorities:

$$\text{Correctness} > \text{Compiler Concepts} > \text{Clear Architecture} > \text{Demonstrability} > \text{UI Polish} > \text{Extra Features}$$

### Guiding Principles:
1. **Pedagogical Transparency**: Every compiler phase must produce inspectable intermediate representations (IRs). If a phase cannot be inspected or explained in a viva, it fails the academic purpose.
2. **Strict Phase Separation**: Lexing, parsing, semantic checking, optimizing, and executing must remain decoupled in separate source modules. Lexers must not perform parsing logic; parsers must not perform semantic checks; execution engines must not parse raw query strings.
3. **Fail-Fast Error Diagnostics**: Compiler errors must report precise locations and informative diagnostic messages rather than crashing with unhandled segmentation faults or cryptic generic errors.
4. **Zero Fluff**: Keep dependencies lean, local, and easy to run on standard developer machines without specialized hardware or external service credentials.

---

## 9. User Workflow & Experience

1. **Dataset Selection**: The user selects or pastes a sample log file (e.g., `web_server_access.log` or `app_events.json`).
2. **Query Composition**: The user enters a LogQL query in the Query Studio (with syntax highlighting and keyword assistance).
3. **Compilation & Execution**: The user clicks **Execute Query** (or presses `Ctrl+Enter`).
4. **Multifaceted Inspection**:
   * The **Results Tab** renders the tabular output or summary metrics.
   * The **Tokens Tab** displays the serialized lexer tokens with token IDs, line numbers, and lexemes.
   * The **AST Tab** renders the hierarchical tree of the parsed query.
   * The **Optimization Tab** shows before-and-after query tree comparisons and applied optimization rules.
   * The **Plan Tab** visualizes the operator pipeline (e.g., `Filter -> Project -> Aggregate -> Limit`).
   * The **Diagnostics Tab** highlights semantic checks and any errors with line-pointer feedback.
