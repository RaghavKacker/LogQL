# PROJECT_CONTEXT.md — Master Technical Specification & Project Knowledge Base

> **LogQL — Compiler-Based Log Query & Optimization Engine**  
> *Formal Academic Title: A Compiler-Based Log Query and Optimization System*  
> *Project Type: B.Tech Computer Science Compiler Design Mini Project*  
> *Status: Active Master Specification & Single Source of Truth*

---

## 1. Executive Summary & Project Identity

### 1.1 Project Identity
* **Project Name**: `LogQL`
* **Full Name**: LogQL — Compiler-Based Log Query & Optimization Engine
* **Formal Academic Title**: A Compiler-Based Log Query and Optimization System
* **Project Nature**: Undergraduate Computer Science (B.Tech CS) Compiler Design Mini Project
* **Primary Academic Domain**: Compiler Design, Lexical Analysis, Syntax Analysis, Semantic Analysis, Intermediate Representations, Code Optimization, Query Processing Engines
* **Secondary Domains**: Domain-Specific Languages (DSLs), Structured Log Analytics, Volcano Iterator Models, Data Visualization

### 1.2 Executive Summary
**LogQL** is a purpose-built, domain-specific query and optimization engine tailored specifically for inspecting, filtering, and aggregating semi-structured server and application log files. Rather than delegating query parsing or execution to external relational database engines (e.g., PostgreSQL, SQLite) or high-level query libraries (e.g., Python `sqlparse`, Pandas), LogQL implements the complete, textbook multi-stage compiler pipeline from scratch:

1. **Lexical Analysis (Scanner)**: Built with **Flex** (`lexer.l`), producing a typed token stream with source coordinates (line/column).
2. **Syntax Analysis (Parser)**: Built with **Bison** (`parser.y`), enforcing an unambiguous $LALR(1)$ Context-Free Grammar.
3. **Abstract Syntax Tree (AST)**: An object-oriented C++17 node hierarchy with complete JSON intermediate representation (IR) export.
4. **Semantic Analysis**: Symbol table validation against a normalized log schema, type-compatibility verification, and SQL-style aggregation constraint enforcement.
5. **Rule-Based Query Optimizer**: Concrete AST/IR transformation passes including **Constant Folding**, **Predicate Pushdown**, **Duplicate Predicate Elimination**, and **Projection Reduction**.
6. **Physical Execution Engine**: An in-memory Volcano-style pull-iterator pipeline (`Scan`, `Filter`, `Aggregate`, `Project`, `Sort`, `Limit`) operating directly over normalized in-memory log vectors.
7. **Developer Studio UI & Bridge**: A modern **Python/FastAPI** bridge connected to a **Next.js/React/TypeScript** studio allowing full visual inspection of every intermediate compilation phase.

---

## 2. Project Purpose & Problem Statement

### 2.1 The Problem
Modern distributed systems, cloud microservices, and web servers generate massive volumes of log data across various formats (Common Log Format, Syslog, JSON Lines). In practice, developers and sysadmins analyze these logs using two extremes:
1. **Ad-hoc CLI one-liners (`grep`, `awk`, `sed`, `jq`, `cut`)**: These tools are procedural, error-prone, lack static type-safety, and become extremely complex and unreadable when performing multi-attribute filtering, grouping, or aggregations.
2. **Heavyweight Enterprise Platforms (Elasticsearch/Kibana, Splunk, Datadog)**: These systems require extensive multi-node infrastructure, heavy JVM memory footprints, multi-gigabyte container dependencies, and complex cloud setup, making them unsuitable for lightweight local developer tooling or academic study.

### 2.2 The LogQL Solution
LogQL bridges this gap by providing a declarative, SQL-like Domain-Specific Language (DSL) specifically optimized for log streams. Users formulate declarative queries such as:

```sql
SELECT service, COUNT(*)
FROM logs
WHERE status >= 500 AND response_time > 100.0
GROUP BY service
ORDER BY COUNT(*) DESC
LIMIT 10;
```

The LogQL engine compiles this query through dedicated compiler stages, optimizes the execution plan, executes it over in-memory normalized log records in sub-millisecond time, and surfaces every intermediate compiler artifact (tokens, raw AST, decorated AST, optimization diffs, physical operator tree, and execution metrics) to the user.

### 2.3 Academic & Pedagogical Relevance
In undergraduate computer science curricula, Compiler Design courses frequently assign toy calculators or simple syntax checkers that print `Valid Syntax` or `Invalid Syntax`. LogQL elevates this learning experience by demonstrating:
* How theoretical compiler concepts (DFAs, NFAs, CFGs, Shift-Reduce parsing, AST construction, Semantic Type Checking, Intermediate Representation Optimization) power real-world database query engines and developer tools.
* The direct correspondence between programming language compilers and database query compilers.
* Full transparency during academic viva examinations, where examiners can visually observe how a query is tokenized, parsed into a tree, optimized via algebraic rewrite rules, and executed via physical iterators.

---

## 3. Objectives

* **OBJ-01**: Design and implement a formal Context-Free Grammar (CFG) for a SQL-like log query language (`LogQL`).
* **OBJ-02**: Build a deterministic finite automaton (DFA) based lexer using **Flex** to tokenize LogQL queries with precise source coordinate tracking.
* **OBJ-03**: Build an $LALR(1)$ parser using **Bison** that constructs an explicit, strongly-typed Abstract Syntax Tree (AST).
* **OBJ-04**: Implement a semantic analyzer in C++17 to validate schema attributes, type consistency, and aggregation semantics.
* **OBJ-05**: Implement four demonstrable rule-based AST/logical optimization passes (Constant Folding, Duplicate Predicate Elimination, Predicate Pushdown, Projection Reduction).
* **OBJ-06**: Build an in-memory Volcano-style pull-iterator execution engine executing queries directly against parsed log records.
* **OBJ-07**: Ingest and normalize three standard log formats: JSON Lines (`.jsonl`), Nginx/Apache Combined Log Format (`CLF`), and standard Syslog (`RFC 3164`).
* **OBJ-08**: Develop a developer-oriented web studio (Next.js/React/TypeScript) and REST API (FastAPI) enabling real-time inspection of all compiler phases and execution metrics.
* **OBJ-09**: Maintain zero external database dependencies for complete local portability.

---

## 4. Scope (IN SCOPE)

The LogQL project encompasses:
* **Log Ingestion & Normalization**: Parsing JSONL, Apache/Nginx Combined Log Format, and Syslog files into normalized in-memory `LogRecord` structures.
* **Lexical Analysis**: Full tokenization with keyword, identifier, literal, and operator recognition, plus error reporting with line/column coordinates.
* **Syntax Parsing**: Grammar enforcement, operator precedence handling, clause ordering enforcement, and hierarchical AST generation.
* **AST Serialization**: Full JSON export of the AST for programmatic manipulation and UI visualization.
* **Semantic Analysis**: Attribute validation against schema, operand type checking, aggregation rule verification, and clause parameter validation.
* **Query Optimization**: Rule-based AST transformations (Constant Folding, Duplicate Removal, Predicate Pushdown, Projection Pruning).
* **Physical Query Planning & Execution**: Iterator-based operator execution pipeline (`Scan`, `Filter`, `Aggregate`, `Project`, `Sort`, `Limit`).
* **Interactive Web Studio**: Monaco-based query editor, token badge viewer, AST tree visualizer, optimizer before/after diff inspector, physical plan pipeline visualizer, tabular result viewer, and Recharts log metrics.
* **Stand-Alone Compiler CLI**: A compiled C++ executable capable of running directly from the terminal or invoked via the FastAPI backend.

---

## 5. Out of Scope (Explicit Non-Goals)

To prevent scope creep and maintain strict college mini-project boundaries, the following are **explicitly OUT OF SCOPE**:
* **No Multi-Table JOINs**: Log queries operate on a single table (`logs` stream). No Cartesian products or nested joins.
* **No Subqueries or Common Table Expressions (CTEs)**: Queries are single-level declarative statements.
* **No DDL or DML Statements**: No `CREATE`, `ALTER`, `DROP`, `INSERT`, `UPDATE`, or `DELETE`. Logs are immutable read-only streams.
* **No External Database Infrastructure**: No PostgreSQL, MySQL, MongoDB, Elasticsearch, Cassandra, or Redis.
* **No Containerization or Cloud Orchestration**: No Docker, Kubernetes, Helm, Terraform, or AWS/GCP deployments required.
* **No Distributed / Multi-Node Execution**: No MapReduce, Spark, or distributed worker nodes; execution is purely single-process in-memory.
* **No Complex Enterprise Features**: No OAuth/SAML authentication, RBAC, tenant isolation, ACID transactions, WAL logging, or SSL termination.
* **No Machine Learning / Deep Learning**: Anomaly detection and metrics are purely rule-based and statistical.

---

## 6. Project Status

| Component | Status | Implementation Details & Files |
| :--- | :--- | :--- |
| **Specification & Architecture** | `IMPLEMENTED` | Complete specifications consolidated into `PROJECT_CONTEXT.md` |
| **Lexer (Flex)** | `IMPLEMENTED` | `compiler/lexer.l`, case-insensitive keywords, coordinates tracking |
| **Parser (Bison)** | `IMPLEMENTED` | `compiler/parser.y`, LALR(1) grammar, AST construction actions |
| **AST Class Model** | `IMPLEMENTED` | `compiler/include/ast.hpp`, `compiler/src/ast.cpp`, `toJson()` serialization |
| **Semantic Analyzer** | `IMPLEMENTED` | `compiler/include/semantic.hpp`, `compiler/src/semantic.cpp`, schema & type checks |
| **Query Optimizer** | `IMPLEMENTED` | `compiler/include/optimizer.hpp`, `compiler/src/optimizer.cpp`, 4 rule passes |
| **Physical Planner & Executor** | `IMPLEMENTED` | `compiler/include/executor.hpp`, `compiler/src/executor.cpp`, Volcano iterator pipeline |
| **CLI Driver** | `IMPLEMENTED` | `compiler/src/main.cpp`, supports `--json`, `--tokens`, `--ast`, `--plan`, `--execute` |
| **Backend API (FastAPI)** | `IMPLEMENTED` | `backend/app/main.py`, routers for `/api/compile`, `/api/execute`, `/api/datasets` |
| **Log Normalizer** | `IMPLEMENTED` | `backend/app/services/log_ingestion.py`, JSONL, CLF, Syslog regex parsers |
| **Frontend Studio (Next.js)** | `IMPLEMENTED` | `frontend/src/app/studio/page.tsx`, multi-tab compiler inspector |
| **AST & Plan Visualizers** | `IMPLEMENTED` | `frontend/src/components/AstViewer.tsx`, `PlanViewer.tsx`, `OptimizerDiff.tsx` |
| **Test Suite** | `IMPLEMENTED` | `compiler/tests/`, unit tests for lexer, parser, semantic analyzer, optimizer |
| **Sample Datasets** | `IMPLEMENTED` | `sample-logs/web_access.log`, `app_events.jsonl`, `system.log` |

---

## 7. Repository Structure

```text
LogQL/
├── compiler/                         # Core C++17 Compiler & Execution Engine
│   ├── Makefile                      # GNU Make build script for Flex, Bison, and C++
│   ├── lexer.l                       # Flex lexical specification
│   ├── parser.y                      # Bison LALR(1) grammar & AST generation actions
│   ├── include/                      # C++ Header declarations
│   │   ├── ast.hpp                   # AST Node hierarchy & JSON serialization
│   │   ├── token.hpp                 # Token struct & token type enums
│   │   ├── semantic.hpp              # Semantic analyzer & schema validator
│   │   ├── optimizer.hpp             # Rule-based AST optimizer passes
│   │   ├── execution_plan.hpp        # Physical plan operator definitions
│   │   ├── executor.hpp              # Volcano-style iterator execution engine
│   │   ├── log_record.hpp            # In-memory normalized LogRecord data structure
│   │   └── json.hpp                  # Single-header nlohmann/json library
│   ├── src/                          # C++ Implementation sources
│   │   ├── ast.cpp                   # AST node methods & JSON conversion logic
│   │   ├── semantic.cpp              # Type inference, symbol validation, aggregation rules
│   │   ├── optimizer.cpp             # Constant folding, predicate pushdown, duplicate removal
│   │   ├── execution_plan.cpp        # Logical-to-physical plan builder
│   │   ├── executor.cpp              # Physical operators (Scan, Filter, Aggregate, Sort, Limit)
│   │   └── main.cpp                  # Compiler CLI entrypoint & JSON output mode
│   └── tests/                        # Compiler C++ test suite
│       ├── test_lexer.cpp            # Tokenization unit tests
│       ├── test_parser.cpp           # Grammar & AST construction tests
│       ├── test_semantic.cpp         # Semantic diagnostic tests
│       └── test_optimizer.cpp        # Optimization pass verification tests
│
├── backend/                          # Python FastAPI Server & Subprocess Bridge
│   ├── requirements.txt              # Python dependencies (fastapi, uvicorn, pydantic)
│   └── app/
│       ├── main.py                   # FastAPI app initialization, CORS, routing
│       ├── config.py                 # File paths, compiler binary location, dataset paths
│       ├── routers/
│       │   ├── query.py              # POST /api/compile and POST /api/execute endpoints
│       │   └── datasets.py           # GET /api/datasets and POST /api/datasets/upload
│       ├── services/
│       │   ├── compiler_bridge.py    # Subprocess execution bridge invoking compiled CLI
│       │   └── log_ingestion.py      # Normalization parsers for JSONL, CLF, and Syslog
│       └── models/
│           ├── api_models.py         # Pydantic schemas for requests, responses, diagnostics
│           └── log_schema.py         # Normalized record model & field definitions
│
├── frontend/                         # Next.js 14 / TypeScript Developer Studio
│   ├── package.json                  # Frontend dependencies & scripts
│   ├── tsconfig.json                 # TypeScript compiler configuration
│   ├── tailwind.config.ts            # Tailwind CSS configuration & dark theme tokens
│   ├── postcss.config.js             # PostCSS plugins
│   └── src/
│       ├── app/
│       │   ├── layout.tsx            # Root HTML layout with dark theme wrapper
│       │   ├── page.tsx              # Landing page & system architecture overview
│       │   └── studio/
│       │       └── page.tsx          # Main Query Studio page with multi-tab interface
│       ├── components/
│       │   ├── QueryEditor.tsx       # Query input editor with preloaded query presets
│       │   ├── ResultsTable.tsx      # Paginated/scrollable query execution result table
│       │   ├── TokenViewer.tsx       # Token stream badge inspector with coordinates
│       │   ├── AstViewer.tsx         # Interactive collapsible AST tree visualizer
│       │   ├── SemanticViewer.tsx    # Semantic symbol and diagnostic inspector
│       │   ├── OptimizerDiff.tsx     # Side-by-side pre/post AST & rule transformation diff
│       │   ├── PlanViewer.tsx        # Physical operator pipeline step-by-step visualizer
│       │   ├── MetricsCharts.tsx     # Recharts status code breakdown & latency graphs
│       │   └── DatasetSelector.tsx   # Dataset switcher and custom log uploader
│       └── lib/
│           └── api.ts                # Axios/Fetch client for FastAPI backend endpoints
│
├── sample-logs/                      # Preloaded benchmark datasets
│   ├── web_access.log                # Nginx/Apache Combined Log Format sample (1,000 lines)
│   ├── app_events.jsonl              # Microservice JSON Lines sample (1,000 lines)
│   └── system.log                    # Standard Syslog sample (1,000 lines)
│
├── docs/                             # Academic presentation assets & notes
│   └── VIVA_CHEATSHEET.md            # Viva questions, compiler theory answers, and demo script
│
├── PROJECT_CONTEXT.md                # Single authoritative master specification (THIS FILE)
└── README.md                         # Quickstart guide and repository summary
```

### 7.1 Important File Specifications

#### `compiler/lexer.l`
* **Purpose**: Flex lexical definition file specifying regular expressions for keywords, identifiers, numeric/string literals, operators, and whitespace.
* **Input**: Raw query string via `yyin` or `yy_scan_string`.
* **Output**: Token stream, `yylval` semantic values, and coordinates (`yylloc`).
* **Dependencies**: `parser.tab.hpp` (generated by Bison), `include/token.hpp`.
* **Modification Safety**: Safe to add new keywords or operators; must keep token constants synchronized with `parser.y`.

#### `compiler/parser.y`
* **Purpose**: Bison grammar specification file defining the $LALR(1)$ grammar and constructing AST nodes in its semantic action blocks.
* **Input**: Token stream emitted by `yylex()`.
* **Output**: Root pointer `ASTNode* root` (typically a `QueryNode*`).
* **Dependencies**: `include/ast.hpp`, `include/token.hpp`.
* **Modification Safety**: Ensure operator precedence `%left`, `%right` directives remain unambiguous to avoid Shift/Reduce conflicts.

#### `compiler/src/semantic.cpp`
* **Purpose**: Validates query semantics against the log schema, checks type consistency of expressions, verifies `GROUP BY` column presence for scalar fields, and validates function arguments.
* **Input**: Raw `QueryNode*` AST.
* **Output**: `SemanticResult` struct containing `bool isValid` and `std::vector<DiagnosticMessage> diagnostics`.
* **Modification Safety**: Safe to add new schema fields or aggregate functions.

#### `compiler/src/optimizer.cpp`
* **Purpose**: Executes deterministic, rule-based transformation passes on the AST.
* **Input**: Validated `QueryNode*` AST.
* **Output**: Optimized `QueryNode*` AST and `std::vector<OptimizationRecord>` logging every rule applied.
* **Modification Safety**: Must guarantee algebraic equivalence; transformations must never alter the query output semantics.

#### `compiler/src/executor.cpp`
* **Purpose**: Implements the Volcano-style physical operator pipeline (`LogScanOperator`, `FilterOperator`, `AggregateOperator`, `ProjectOperator`, `SortOperator`, `LimitOperator`).
* **Input**: Physical plan and `std::vector<LogRecord>` dataset.
* **Output**: Tabular query result (`std::vector<Row>`) and execution statistics (`ExecutionMetrics`).
* **Modification Safety**: Maintain pull-based `open()`, `next()`, `close()` iterator contracts.

---

## 8. Technology Stack

### 8.1 Technology Matrix

| Subsystem | Technology | Version | Purpose | Justification |
| :--- | :--- | :--- | :--- | :--- |
| **Lexer** | **Flex** | 2.6.x+ | Lexical analysis & tokenization | Standard academic tool for generating fast, DFA-based state-machine tokenizers. |
| **Parser** | **Bison (YACC)** | 3.8.x+ | LALR(1) syntax analysis & AST creation | Industry/academic standard for unambiguous CFG parsing with shift-reduce resolution. |
| **Core Engine** | **C++ (C++17)** | C++17 | AST, Semantic check, Optimizer, Execution | High performance, strict type safety, clean OOP hierarchy, smart pointers (`std::unique_ptr`). |
| **Build System** | **GNU Make & GCC/G++**| Make 4.x / GCC 11+ | Compilation of C++ and Flex/Bison sources | Standard, portable, zero-overhead build toolchain. |
| **JSON Library** | **nlohmann/json** | 3.11.x | Single-header C++ JSON serialization | Serializes tokens, AST, optimization records, and execution metrics to JSON for frontend consumption. |
| **Backend Framework**| **Python FastAPI** | 0.109.0+ | REST API & Subprocess Orchestrator | High productivity async web framework with automatic OpenAPI docs and Pydantic validation. |
| **ASGI Server** | **Uvicorn** | 0.27.0+ | ASGI web server for FastAPI | Lightweight, high-throughput server for local development. |
| **Data Validation** | **Pydantic** | 2.6.0+ | API request/response schema modeling | Strongly types JSON payloads sent between frontend and backend. |
| **Frontend Framework**| **Next.js** | 14.1.0+ | Web-based Developer Studio | Modern React framework with App Router, server/client component splitting, and fast bundling. |
| **UI Library** | **React** | 18.2.0+ | Declarative component UI | Industry-standard component architecture for interactive tools. |
| **Language / Typing**| **TypeScript** | 5.3.x+ | Static typing for web frontend | Ensures strict contract adherence with backend Pydantic API responses. |
| **CSS Framework** | **Tailwind CSS** | 3.4.1+ | Utility-first CSS styling | Clean developer dark-mode aesthetic inspired by Datadog, Grafana, and VS Code. |
| **Icons** | **Lucide React** | 0.330.0+ | UI iconography | Clean, minimalist SVG icons for compiler stages and buttons. |
| **Charts** | **Recharts** | 2.12.0+ | Query analytics visualizations | Declarative SVG charting for HTTP status codes, latency histograms, and error rates. |

---

## 9. System Architecture

LogQL follows a clean 3-tier modular architecture:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           1. FRONTEND TIER                              │
│         Next.js 14 / React 18 / TypeScript / Tailwind CSS / Recharts    │
│                                                                         │
│   ┌────────────────┐   ┌────────────────┐   ┌───────────────────────┐   │
│   │  Query Studio  │   │ Visual AST     │   │ Multi-Stage Inspector │   │
│   │  (Editor UI)   │   │ (Tree Viewer)  │   │ (Tokens, Opt, Plan)   │   │
│   └───────┬────────┘   └───────▲────────┘   └───────────▲───────────┘   │
└───────────┼────────────────────┼────────────────────────┼───────────────┘
            │ HTTP POST          │ HTTP Response JSON     │
            ▼                    │                        │
┌────────────────────────────────┴────────────────────────┴───────────────┐
│                           2. BACKEND TIER                               │
│                  FastAPI / Python 3.10+ / Pydantic                      │
│                                                                         │
│   ┌────────────────────┐   ┌───────────────────┐   ┌────────────────┐   │
│   │ API Endpoints      │   │ Log Normalizer    │   │ Subprocess     │   │
│   │ (/compile,/execute)│   │ (JSONL, CLF, Sys) │   │ Bridge Driver  │   │
│   └─────────┬──────────┘   └─────────┬─────────┘   └────────▲───────┘   │
└─────────────┼────────────────────────┼──────────────────────┼───────────┘
              │                        │                      │
              ▼                        ▼                      │
┌─────────────────────────────────────────────────────────────┴───────────┐
│                           3. COMPILER CORE                              │
│                  C++17 (Flex, Bison, Native Binary)                     │
│                                                                         │
│   ┌────────────────┐      ┌────────────────┐      ┌─────────────────┐   │
│   │  Lexer (Flex)  │ ───► │  Parser (Bison)│ ───► │ Abstract Syntax │   │
│   │  (lexer.l)     │      │  (parser.y)    │      │ Tree (AST)      │   │
│   └────────────────┘      └────────────────┘      └────────┬────────┘   │
│                                                            │            │
│   ┌────────────────┐      ┌────────────────┐      ┌────────▼────────┐   │
│   │ Volcano Engine │ ◄─── │ Rule-Based     │ ◄─── │ Semantic Check  │   │
│   │ & Plan Executor│      │ Optimizer      │      │ & Symbol Table  │   │
│   └────────────────┘      └────────────────┘      └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.1 Tier Communication Contracts
1. **Frontend $\leftrightarrow$ Backend**: Communicates over standard HTTP JSON REST endpoints (`http://localhost:8000/api/...`).
2. **Backend $\leftrightarrow$ Compiler Core**: Communicates via standard subprocess invocation (`subprocess.Popen`) calling `./compiler/build/logql_cli --json` and piping query text and JSON dataset payloads via standard input/output streams.

---

## 10. Compiler Architecture

The compilation pipeline operates as a deterministic, multi-stage pipeline:

```text
LogQL Query String (e.g. "SELECT service, COUNT(*) FROM logs WHERE status >= 500...")
       │
       ▼
[ 1. Lexical Analysis (Flex) ]
       │ Emits: std::vector<Token> (Type, Lexeme, Line, Col)
       ▼
[ 2. Syntax Analysis (Bison) ]
       │ Emits: Raw AST Root (QueryNode*)
       ▼
[ 3. Semantic Analysis ]
       │ Validates: Schema Attributes, Type Consistency, Aggregation Rules
       │ Emits: Decorated AST + Diagnostics
       ▼
[ 4. Query Optimizer ]
       │ Passes: Constant Folding, Duplicate Predicate Elimination,
       │         Predicate Pushdown, Projection Reduction
       │ Emits: Optimized AST + Optimization Log
       ▼
[ 5. Physical Planner ]
       │ Maps logical AST nodes to Physical Operator Hierarchy
       │ Emits: Physical Operator Tree
       ▼
[ 6. Execution Engine (Volcano Iterators) ]
       │ Evaluates operators over std::vector<LogRecord>
       │ Emits: std::vector<Row> + ExecutionMetrics
       ▼
Final JSON Response (Tokens, AST, Diagnostics, Opt AST, Plan, Rows, Metrics)
```

---

## 11. LogQL Language Specification

### 11.1 Supported Grammar Constructs

LogQL supports the following primary clauses:
* `SELECT [DISTINCT] <select_list>`
* `FROM logs`
* `[WHERE <boolean_expression>]`
* `[GROUP BY <identifier_list>]`
* `[ORDER BY <order_list>]`
* `[LIMIT <integer_literal>]`

### 11.2 Example Queries

#### 1. Basic Projection & Scan
```sql
SELECT timestamp, service, level, message
FROM logs;
```

#### 2. Filtering with Comparison & Arithmetic
```sql
SELECT service, path, status, response_time
FROM logs
WHERE status >= 400 AND response_time > 150.0;
```

#### 3. Aggregation with Grouping
```sql
SELECT service, COUNT(*), AVG(response_time), MAX(response_time)
FROM logs
WHERE status >= 500
GROUP BY service;
```

#### 4. Sorting and Pagination
```sql
SELECT service, COUNT(*)
FROM logs
GROUP BY service
ORDER BY COUNT(*) DESC
LIMIT 5;
```

#### 5. Constant Folding & Redundant Filter Demonstration
```sql
SELECT path, AVG(response_time)
FROM logs
WHERE status = 200 + 300 AND status >= 500
GROUP BY path
ORDER BY AVG(response_time) DESC;
```

---

## 12. Lexical Analysis

### 12.1 Token Categories

#### Keywords (Case-Insensitive)
`SELECT`, `FROM`, `WHERE`, `GROUP`, `BY`, `ORDER`, `ASC`, `DESC`, `LIMIT`, `DISTINCT`, `AS`, `AND`, `OR`, `NOT`, `COUNT`, `MIN`, `MAX`, `AVG`, `SUM`, `TRUE`, `FALSE`, `NULL`.

#### Identifiers
Matches regular expression: `[a-zA-Z_][a-zA-Z0-9_]*` (e.g., `status`, `response_time`, `service`, `path`, `ip`, `message`).

#### Literals
* **Integer Literal**: `[0-9]+` (e.g., `200`, `500`)
* **Float Literal**: `[0-9]+\.[0-9]+` (e.g., `142.5`, `0.05`)
* **String Literal**: `'[^']*'` or `\"[^\"]*\"` (e.g., `'auth-service'`, `"ERROR"`)
* **Boolean Literal**: `TRUE`, `FALSE`

#### Operators
* **Comparison**: `=`, `!=`, `<`, `>`, `<=`, `>=`
* **Arithmetic**: `+`, `-`, `*`, `/`

#### Symbols
`(`, `)`, `,`, `*`, `;`

### 12.2 Coordinate Tracking & Token Structure
The lexer tracks source line numbers and column numbers using `yylloc`. Each token is serialized as:
```json
{
  "token": "KEYWORD_SELECT",
  "lexeme": "SELECT",
  "line": 1,
  "col": 1
}
```

---

## 13. Grammar & Syntax Analysis

### 13.1 Context-Free Grammar (CFG) Specification

```text
Query         ::= SELECT SelectList FROM TableRef [WhereClause] [GroupByClause] [OrderByClause] [LimitClause] OptSemicolon

SelectList    ::= [DISTINCT] ( '*' | SelectItemList )
SelectItemList::= SelectItem ( ',' SelectItem )*
SelectItem    ::= FunctionCall [AS Identifier] | Identifier [AS Identifier]

TableRef      ::= Identifier

WhereClause   ::= WHERE Expression

GroupByClause ::= GROUP BY IdentifierList
IdentifierList::= Identifier ( ',' Identifier )*

OrderByClause ::= ORDER BY OrderItemList
OrderItemList ::= OrderItem ( ',' OrderItem )*
OrderItem     ::= ( Identifier | FunctionCall ) [ASC | DESC]

LimitClause   ::= LIMIT IntegerLiteral

OptSemicolon  ::= ';' | ε

Expression    ::= Expression OR Conjunction | Conjunction
Conjunction   ::= Conjunction AND Inversion | Inversion
Inversion     ::= NOT Inversion | Predicate
Predicate     ::= PrimaryExpr CompOp PrimaryExpr | '(' Expression ')'
PrimaryExpr   ::= PrimaryExpr ('+' | '-') Term | Term
Term          ::= Term ('*' | '/') Factor | Factor
Factor        ::= Identifier | Literal | FunctionCall | '(' Expression ')'

CompOp        ::= '=' | '!=' | '<' | '>' | '<=' | '>='
FunctionCall  ::= AggFunc '(' ( '*' | Identifier ) ')'
AggFunc       ::= 'COUNT' | 'MIN' | 'MAX' | 'AVG' | 'SUM'
Literal       ::= IntegerLiteral | FloatLiteral | StringLiteral | BooleanLiteral
```

### 13.2 Operator Precedence & Associativity

```text
%left OR
%left AND
%right NOT
%nonassoc '=' '!=' '<' '>' '<=' '>='
%left '+' '-'
%left '*' '/'
```

---

## 14. AST Architecture

### 14.1 Class Hierarchy

```text
ASTNode (Abstract Base)
├── QueryNode (Root: SelectListNode*, FromNode*, WhereNode*, GroupByNode*, OrderByNode*, LimitNode*)
├── SelectListNode (bool distinct, std::vector<std::unique_ptr<SelectItemNode>> items)
├── SelectItemNode (std::unique_ptr<ExprNode> expr, std::string alias)
├── FromNode (std::string tableName)
├── WhereNode (std::unique_ptr<ExprNode> condition)
├── GroupByNode (std::vector<std::string> columns)
├── OrderByNode (std::vector<OrderByItem> items)
├── LimitNode (int64_t limitValue)
└── ExprNode (Abstract Expression Base)
    ├── BinaryOpNode (std::string op, std::unique_ptr<ExprNode> left, std::unique_ptr<ExprNode> right)
    ├── UnaryOpNode (std::string op, std::unique_ptr<ExprNode> operand)
    ├── IdentifierNode (std::string name)
    ├── LiteralNode (LiteralType type, LiteralValue value)
    └── FunctionCallNode (std::string funcName, std::string argument)
```

### 14.2 AST JSON Representation Example
For query `SELECT service, COUNT(*) FROM logs WHERE status >= 500 GROUP BY service`:
```json
{
  "type": "QueryNode",
  "select": {
    "distinct": false,
    "items": [
      { "type": "IdentifierNode", "name": "service" },
      { "type": "FunctionCallNode", "function": "COUNT", "arg": "*" }
    ]
  },
  "from": { "type": "FromNode", "table": "logs" },
  "where": {
    "type": "BinaryOpNode",
    "operator": ">=",
    "left": { "type": "IdentifierNode", "name": "status" },
    "right": { "type": "LiteralNode", "dataType": "INT", "value": 500 }
  },
  "groupBy": ["service"]
}
```

---

## 15. Semantic Analysis

### 15.1 Semantic Rules
1. **Schema Attribute Existence**: Every `IdentifierNode` in `SELECT`, `WHERE`, `GROUP BY`, and `ORDER BY` must match a valid field in the normalized schema (`timestamp`, `service`, `level`, `status`, `response_time`, `path`, `ip`, `message`).
2. **Type Compatibility**:
   * Numeric comparisons (`<`, `>`, `<=`, `>=`) are only valid between numeric fields (`status`, `response_time`) and numeric literals.
   * String equality (`=`, `!=`) requires string or boolean literals.
3. **Aggregation Invariant**:
   * If any aggregate function (`COUNT`, `AVG`, etc.) is used in `SELECT`, all non-aggregate (scalar) columns in `SELECT` must be explicitly listed in the `GROUP BY` clause.
   * Aggregate functions cannot be nested (e.g., `COUNT(AVG(response_time))` is rejected).
4. **Aggregate Argument Validity**:
   * `COUNT(*)` and `COUNT(field)` are valid.
   * `AVG`, `SUM`, `MIN`, `MAX` cannot accept `*`.
   * `AVG` and `SUM` require numeric fields (`status`, `response_time`).
5. **Clause Value Constraints**: `LIMIT` must be an integer $\ge 0$.

---

## 16. Type System

### 16.1 Supported Types
* `STRING`: Text values (e.g., `"auth-service"`, `"ERROR"`).
* `INTEGER`: 64-bit signed integers (e.g., `200`, `500`).
* `FLOAT`: 64-bit floating point values (e.g., `142.5`).
* `BOOLEAN`: `TRUE` or `FALSE`.

### 16.2 Type Compatibility Matrix

| Left Type | Right Type | Allowed Operators | Result Type |
| :--- | :--- | :--- | :--- |
| `INTEGER` | `INTEGER` | `+`, `-`, `*`, `/`, `=`, `!=`, `<`, `>`, `<=`, `>=` | `INTEGER` / `BOOLEAN` |
| `FLOAT` | `FLOAT` | `+`, `-`, `*`, `/`, `=`, `!=`, `<`, `>`, `<=`, `>=` | `FLOAT` / `BOOLEAN` |
| `INTEGER` | `FLOAT` | `+`, `-`, `*`, `/`, `=`, `!=`, `<`, `>`, `<=`, `>=` | `FLOAT` / `BOOLEAN` (implicit promotion) |
| `STRING` | `STRING` | `=`, `!=` | `BOOLEAN` |
| `BOOLEAN` | `BOOLEAN` | `AND`, `OR`, `=`, `!=` | `BOOLEAN` |

---

## 17. Query Optimization

LogQL implements four concrete, demonstrable rule-based optimization passes:

### 17.1 Rule 1: Constant Folding
* **Purpose**: Evaluates constant arithmetic and logical subtrees at compile time.
* **Transformation**: AST node `BinaryOpNode("+", Literal(200), Literal(300))` $\longrightarrow$ `LiteralNode(500)`.
* **Benefit**: Eliminates per-record evaluation overhead during execution.

### 17.2 Rule 2: Duplicate Predicate Elimination
* **Purpose**: Removes redundant idempotent boolean terms joined by `AND` or `OR`.
* **Transformation**: `status >= 500 AND status >= 500` $\longrightarrow$ `status >= 500`.
* **Benefit**: Reduces expression tree depth and condition evaluations.

### 17.3 Rule 3: Predicate Pushdown
* **Purpose**: Schedules `FilterOperator` immediately after `LogScanOperator`, before `AggregateOperator` and `SortOperator`.
* **Benefit**: Non-matching rows are discarded before memory allocation in hash-tables or sort buffers.

### 17.4 Rule 4: Projection Reduction
* **Purpose**: Computes the strict set of referenced fields across all query clauses.
* **Transformation**: If query only references `service` and `status`, only those two fields are extracted from records; unreferenced fields (`message`, `ip`, `path`) are ignored during scanning.

---

## 18. Query Planning

The Physical Planner converts the optimized AST into an operator pipeline:

```text
                  ┌───────────────────────┐
                  │     LimitOperator     │
                  └───────────▲───────────┘
                              │
                  ┌───────────┴───────────┐
                  │     SortOperator      │
                  └───────────▲───────────┘
                              │
                  ┌───────────┴───────────┐
                  │    ProjectOperator    │
                  └───────────▲───────────┘
                              │
                  ┌───────────┴───────────┐
                  │   AggregateOperator   │
                  └───────────▲───────────┘
                              │
                  ┌───────────┴───────────┐
                  │    FilterOperator     │
                  └───────────▲───────────┘
                              │
                  ┌───────────┴───────────┐
                  │    LogScanOperator    │
                  └───────────────────────┘
```

---

## 19. Execution Engine (Volcano Iterator Model)

Each physical operator inherits from an abstract base class:
```cpp
class PhysicalOperator {
public:
    virtual ~PhysicalOperator() = default;
    virtual void open() = 0;
    virtual std::optional<Row> next() = 0;
    virtual void close() = 0;
};
```

### 19.1 Operator Responsibilities
* **`LogScanOperator`**: Streams normalized `LogRecord` structs from the active in-memory dataset, pruning unprojected fields.
* **`FilterOperator`**: Pulls rows from child operator and evaluates the `WHERE` expression tree; discards rows evaluating to false.
* **`AggregateOperator`**: Hash-aggregates upstream rows by `GROUP BY` keys, computing running totals for `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`.
* **`ProjectOperator`**: Computes final column expressions, aliases, and extracts the requested output shape.
* **`SortOperator`**: Consumes all input rows into an internal buffer and executes multi-column sorting using custom comparators (`std::stable_sort`).
* **`LimitOperator`**: Tracks emitted row counts and signals `EOF` once the limit threshold is met.

---

## 20. Log Ingestion & Normalization

### 20.1 Supported Formats

#### 1. JSON Lines (`.jsonl`)
Lines parsed directly as JSON objects:
```json
{"timestamp": "2026-09-28T10:15:30Z", "service": "auth-service", "level": "ERROR", "status": 500, "response_time": 142.5, "path": "/api/v1/login", "ip": "192.168.1.45", "message": "Database connection timeout"}
```

#### 2. Nginx/Apache Combined Log Format (CLF)
Regex Pattern: `^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d{3}) (\d+) "(.*?)" "(.*?)"$`  
Example line:
```text
192.168.1.45 - - [28/Sep/2026:10:15:30 +0000] "POST /api/v1/login HTTP/1.1" 500 142 "auth-service" "Database connection timeout"
```

#### 3. Standard Syslog (RFC 3164)
Example line:
```text
Sep 28 10:15:30 server01 auth-service[1245]: ERROR [500] Database connection timeout
```

---

## 21. Data Model

All ingested records are normalized to a canonical `LogRecord` schema:

| Field Name | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `timestamp` | `STRING` | No | `""` | ISO-8601 formatted event timestamp string |
| `service` | `STRING` | No | `"unknown"` | Originating service or process name |
| `level` | `STRING` | No | `"INFO"` | Severity: `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL` |
| `status` | `INTEGER` | Yes | `0` | HTTP response code or process exit status |
| `response_time` | `FLOAT` | Yes | `0.0` | Request or task latency in milliseconds |
| `path` | `STRING` | Yes | `""` | Request URL path or resource URI |
| `ip` | `STRING` | Yes | `""` | Client IPv4/IPv6 address |
| `message` | `STRING` | No | `""` | Raw descriptive event message payload |

---

## 22. Database / Storage

### 22.1 In-Memory Architecture Decision
LogQL does **NOT** use an external database daemon.
* **Why**: The project's core mission is demonstrating a compiler, optimizer, and execution engine. An external RDBMS would obscure the compiler's role.
* **How it lives**: Active logs reside in memory as `std::vector<LogRecord>` inside the compiler process during query execution.
* **Portability**: The project has zero database setup steps, zero credentials, zero background services, and instant startup time.

---

## 23. Backend Architecture

Built with Python 3.10+ and FastAPI.

### 23.1 Module Breakdown
* `backend/app/main.py`: FastAPI entrypoint, CORS configuration, API router registration.
* `backend/app/routers/query.py`: Exposes `/api/compile` and `/api/execute`.
* `backend/app/routers/datasets.py`: Exposes dataset listing and custom file upload handlers.
* `backend/app/services/compiler_bridge.py`: Manages the C++ executable subprocess lifecycle, piping query strings and capturing JSON output.
* `backend/app/services/log_ingestion.py`: Normalizes uploaded and sample log files into uniform JSON records.
* `backend/app/models/api_models.py`: Pydantic models enforcing API contracts.

---

## 24. API Specification

### 24.1 `POST /api/compile`
* **Purpose**: Compiles a query through Lexer, Parser, Semantic Analyzer, and Optimizer without executing over a dataset.
* **Request Body**:
```json
{
  "query": "SELECT service, COUNT(*) FROM logs WHERE status >= 500 GROUP BY service;"
}
```
* **Response Body**:
```json
{
  "success": true,
  "tokens": [
    { "token": "KEYWORD_SELECT", "lexeme": "SELECT", "line": 1, "col": 1 },
    { "token": "IDENTIFIER", "lexeme": "service", "line": 1, "col": 8 },
    { "token": "COMMA", "lexeme": ",", "line": 1, "col": 15 },
    { "token": "KEYWORD_COUNT", "lexeme": "COUNT", "line": 1, "col": 17 },
    { "token": "LPAREN", "lexeme": "(", "line": 1, "col": 22 },
    { "token": "STAR", "lexeme": "*", "line": 1, "col": 23 },
    { "token": "RPAREN", "lexeme": ")", "line": 1, "col": 24 },
    { "token": "KEYWORD_FROM", "lexeme": "FROM", "line": 1, "col": 26 },
    { "token": "IDENTIFIER", "lexeme": "logs", "line": 1, "col": 31 },
    { "token": "KEYWORD_WHERE", "lexeme": "WHERE", "line": 1, "col": 36 },
    { "token": "IDENTIFIER", "lexeme": "status", "line": 1, "col": 42 },
    { "token": "OP_GE", "lexeme": ">=", "line": 1, "col": 49 },
    { "token": "INT_LITERAL", "lexeme": "500", "line": 1, "col": 52 },
    { "token": "KEYWORD_GROUP", "lexeme": "GROUP", "line": 1, "col": 56 },
    { "token": "KEYWORD_BY", "lexeme": "BY", "line": 1, "col": 62 },
    { "token": "IDENTIFIER", "lexeme": "service", "line": 1, "col": 65 },
    { "token": "SEMICOLON", "lexeme": ";", "line": 1, "col": 72 }
  ],
  "ast": {
    "type": "QueryNode",
    "select": {
      "distinct": false,
      "items": [
        { "type": "IdentifierNode", "name": "service" },
        { "type": "FunctionCallNode", "function": "COUNT", "arg": "*" }
      ]
    },
    "from": { "type": "FromNode", "table": "logs" },
    "where": {
      "type": "BinaryOpNode",
      "operator": ">=",
      "left": { "type": "IdentifierNode", "name": "status" },
      "right": { "type": "LiteralNode", "dataType": "INT", "value": 500 }
    },
    "groupBy": ["service"]
  },
  "semantic": {
    "isValid": true,
    "diagnostics": []
  },
  "optimizations": [
    { "rule": "PredicatePushdown", "description": "Pushed filter on 'status' ahead of grouping" },
    { "rule": "ProjectionReduction", "description": "Pruned unreferenced fields: timestamp, level, path, ip, message" }
  ],
  "physicalPlan": {
    "rootOperator": "ProjectOperator",
    "child": {
      "operator": "AggregateOperator",
      "keys": ["service"],
      "aggregates": ["COUNT(*)"],
      "child": {
        "operator": "FilterOperator",
        "predicate": "status >= 500",
        "child": {
          "operator": "LogScanOperator",
          "projectedColumns": ["service", "status"]
        }
      }
    }
  }
}
```

### 24.2 `POST /api/execute`
* **Purpose**: Compiles and executes the query against a dataset.
* **Request Body**:
```json
{
  "query": "SELECT service, COUNT(*) FROM logs WHERE status >= 500 GROUP BY service ORDER BY COUNT(*) DESC;",
  "datasetId": "web_access"
}
```
* **Response Body**:
```json
{
  "success": true,
  "columns": ["service", "COUNT(*)"],
  "rows": [
    { "service": "auth-service", "COUNT(*)": 42 },
    { "service": "payment-api", "COUNT(*)": 18 },
    { "service": "user-service", "COUNT(*)": 7 }
  ],
  "metrics": {
    "recordsScanned": 1000,
    "recordsFiltered": 933,
    "recordsGrouped": 67,
    "recordsReturned": 3,
    "executionTimeMs": 1.84
  }
}
```

### 24.3 `GET /api/datasets`
* **Returns**: Array of preloaded dataset descriptors (`id`, `name`, `format`, `recordCount`, `path`).

### 24.4 `POST /api/datasets/upload`
* **Request**: Multipart file or text payload with `format` (`jsonl`, `clf`, `syslog`).
* **Returns**: `{ "datasetId": "custom_1727618000", "recordCount": 500 }`.

---

## 25. Frontend Architecture

Built with Next.js 14 (App Router), TypeScript, and Tailwind CSS.

### 25.1 Component Hierarchy
* `src/app/studio/page.tsx` (Main Studio Controller)
  * `DatasetSelector`: Selects preloaded dataset or triggers custom upload.
  * `QueryEditor`: Code editor with syntax highlights and quick query templates.
  * `MultiTabInspector`:
    * `ResultsTable`: Renders execution output rows with sorting and pagination.
    * `TokenViewer`: Badge-based representation of the lexer's token stream.
    * `AstViewer`: Interactive tree structure displaying AST nodes and expressions.
    * `SemanticViewer`: Symbol table and diagnostic validation summary.
    * `OptimizerDiff`: Before-and-after AST comparison and applied rules log.
    * `PlanViewer`: Flowchart of the physical operator pipeline with row metrics.
    * `MetricsCharts`: Recharts visualizations (HTTP status breakdown, latency histogram).

---

## 26. UI/UX Design System

* **Theme**: Deep developer dark mode (`#0b0f19` background, `#111827` panels, `#1f2937` borders).
* **Accents**: Indigo/Cyan gradient highlights (`#6366f1` / `#06b6d4`), Emerald for success (`#10b981`), Rose for compiler diagnostics/errors (`#f43f5e`), Amber for optimization badges (`#f59e0b`).
* **Typography**: Clean sans-serif (`Inter`) for UI controls; monospaced font (`JetBrains Mono` / `Fira Code`) for editor, tokens, AST, and query results.

---

## 27. Page & Route Map

* **`/` (Landing Page)**: Overview of LogQL, interactive compiler pipeline diagram, feature highlights, and link to Query Studio.
* **`/studio` (Query Studio)**: The full-featured IDE interface for executing queries, inspecting compiler stages, and exploring logs.

---

## 28. Query Studio Workflow

```text
 1. Select Dataset (web_access.log, app_events.jsonl, system.log, or Upload)
 2. Choose Query Preset or Type Custom LogQL Query
 3. Click 'Run Query' (Ctrl + Enter)
 4. View Tabs:
    ├── [Results]        ──► Output Data Table & Row Counts
    ├── [Tokens]         ──► Lexer Token Stream with Line/Col Badges
    ├── [AST]            ──► Hierarchical Tree Representation
    ├── [Semantic]       ──► Schema & Type Diagnostic Checks
    ├── [Optimizer]      ──► Before/After AST Diff & Applied Rule Passes
    ├── [Physical Plan]  ──► Volcano Pipeline Flow & Execution Step Costs
    └── [Charts]         ──► Recharts Visual Analytics
```

---

## 29. AST Visualization

* Rendered using a recursive tree component.
* Node headers show node type (`QueryNode`, `BinaryOpNode`, `FunctionCallNode`).
* Expandable/collapsible branches for expressions and clause subtrees.
* Value badges show literal values and types (`INT: 500`, `STRING: 'auth-service'`).

---

## 30. Execution Plan Visualization

* Operator pipeline displayed as a vertical flowchart:
  $$\text{LogScan} \longrightarrow \text{Filter} \longrightarrow \text{Aggregate} \longrightarrow \text{Project} \longrightarrow \text{Sort} \longrightarrow \text{Limit}$$
* Each operator card displays:
  * Operator Name and configuration (e.g., `Filter: status >= 500`)
  * Input Row Count $\to$ Output Row Count
  * Selectivity / Drop-off percentage
  * Time spent per operator

---

## 31. Analytics & Visualizations

The Charts tab provides three primary visualizations:
1. **HTTP Status Breakdown**: Donut chart displaying proportion of `2xx`, `3xx`, `4xx`, and `5xx` events.
2. **Response Time Latency Histogram**: Bar chart showing latency distribution bins ($<50\text{ms}$, $50\text{--}200\text{ms}$, $>200\text{ms}$).
3. **Error Frequency by Service**: Horizontal bar chart comparing error occurrences across microservices.

---

## 32. Error Handling & Diagnostics

| Error Category | Cause | Detection Point | User-Facing Diagnostic Example |
| :--- | :--- | :--- | :--- |
| **Lexical Error** | Unrecognized character, unclosed string | Lexer (`lexer.l`) | `Lexical Error at line 1, col 23: Unrecognized token '@'` |
| **Syntax Error** | Unexpected token, improper clause order | Parser (`parser.y`) | `Syntax Error at line 1, col 35: Unexpected token 'WHERE', expected 'FROM'` |
| **Semantic Error** | Unknown field name, invalid aggregate | Semantic Checker (`semantic.cpp`) | `Semantic Error at line 1, col 8: Unknown attribute 'foo_bar' in schema` |
| **Type Error** | Comparing incompatible types | Semantic Checker (`semantic.cpp`) | `Type Error at line 1, col 25: Cannot compare STRING 'service' with INTEGER 500` |
| **Execution Error** | Division by zero, malformed log record | Execution Engine (`executor.cpp`) | `Execution Error: Division by zero encountered during evaluation` |

---

## 33. Security Considerations

Even as a mini project, LogQL implements essential local security protections:
* **Subprocess Sanitization**: Queries are passed to the compiler binary via `stdin` or explicit command-line argument encapsulation—never via raw shell string concatenation—preventing shell command injection.
* **Path Traversal Prevention**: Dataset paths are strictly validated against a permitted whitelist in `sample-logs/` or sanitized unique identifiers in a temp upload folder.
* **Query Length Limit**: Input query string is capped at $4,096$ characters to prevent memory exhaustion in the lexer.
* **Log File Size Guard**: Custom uploads are limited to $10\text{ MB}$ ($< 50,000$ lines) to maintain strict in-memory execution boundaries.

---

## 34. Testing Strategy

LogQL includes automated tests across all tiers:

```text
tests/
├── compiler/
│   ├── test_lexer.cpp       # Unit tests for token stream correctness
│   ├── test_parser.cpp      # Unit tests for CFG and AST generation
│   ├── test_semantic.cpp    # Unit tests for schema & type errors
│   └── test_optimizer.cpp   # Unit tests for constant folding & pushdown
├── backend/
│   └── test_api.py          # FastAPI endpoint integration tests
```

---

## 35. Test Case Catalog

| Test ID | Test Name | Input Query | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Simple Scan & Select | `SELECT service, status FROM logs;` | Valid AST, scans all records, returns 2 columns | `PASSED` |
| **TC-02** | Filter with Comparison | `SELECT * FROM logs WHERE status >= 500;` | Valid AST, FilterOperator matches only $\ge 500$ | `PASSED` |
| **TC-03** | Multi-Condition Conjunction | `SELECT * FROM logs WHERE status >= 400 AND service = 'auth-service';` | Evaluates binary AND condition correctly | `PASSED` |
| **TC-04** | Group By Aggregation | `SELECT service, COUNT(*) FROM logs GROUP BY service;` | AggregateOperator groups rows by service | `PASSED` |
| **TC-05** | Order By & Limit | `SELECT service, COUNT(*) FROM logs GROUP BY service ORDER BY COUNT(*) DESC LIMIT 3;` | Emits top 3 services by count | `PASSED` |
| **TC-06** | Constant Folding | `SELECT * FROM logs WHERE status >= 200 + 300;` | Optimizer folds `200 + 300` into `500` | `PASSED` |
| **TC-07** | Duplicate Filter Removal | `SELECT * FROM logs WHERE status = 500 AND status = 500;` | Optimizer eliminates redundant predicate | `PASSED` |
| **TC-08** | Predicate Pushdown | `SELECT service, COUNT(*) FROM logs WHERE status = 500 GROUP BY service;` | Filter is executed before Aggregation | `PASSED` |
| **TC-09** | Projection Pruning | `SELECT service FROM logs;` | Scan only loads `service`, prunes unused fields | `PASSED` |
| **TC-10** | Semantic Error (Unknown Field) | `SELECT non_existent_column FROM logs;` | Semantic diagnostic: Unknown attribute | `PASSED` |
| **TC-11** | Semantic Error (Type Mismatch) | `SELECT * FROM logs WHERE service > 500;` | Semantic diagnostic: Incompatible types | `PASSED` |
| **TC-12** | Semantic Error (Ungrouped Field)| `SELECT service, path, COUNT(*) FROM logs GROUP BY service;` | Semantic diagnostic: `path` not in GROUP BY | `PASSED` |
| **TC-13** | Syntax Error (Missing FROM) | `SELECT service WHERE status = 200;` | Syntax diagnostic with line/col pointer | `PASSED` |
| **TC-14** | Lexical Error (Invalid Char) | `SELECT * FROM logs WHERE status @ 200;` | Lexical diagnostic: Unrecognized token `@` | `PASSED` |

---

## 36. Sample Data

The `sample-logs/` folder contains realistic test datasets:
1. **`web_access.log`**: 1,000 lines of Nginx access logs covering various HTTP statuses (`200`, `301`, `400`, `404`, `500`, `503`) and response times from `10ms` to `2500ms`.
2. **`app_events.jsonl`**: 1,000 JSON Lines formatted microservice logs originating from `auth-service`, `payment-api`, `user-service`, and `api-gateway`.
3. **`system.log`**: 1,000 lines of Syslog RFC 3164 entries capturing daemon messages and kernel alerts.

---

## 37. Development Environment

### Prerequisites
* **C++ Compiler**: GCC 11+ or Clang 13+ with `-std=c++17`.
* **Lexer & Parser Generators**: `flex` (v2.6+) and `bison` (v3.8+).
* **Build Tool**: GNU Make (v4.x+).
* **Python Runtime**: Python 3.10 or higher.
* **Node.js Runtime**: Node.js v18.x or v20.x (LTS) with `npm`.
* **OS Support**: Windows (via MinGW-w64 / MSYS2 / WSL2), Ubuntu/Debian Linux, or macOS.

---

## 38. Installation

### 1. Toolchain Installation
* **Ubuntu/Debian**:
  ```bash
  sudo apt update
  sudo apt install -y build-essential flex bison python3 python3-pip nodejs npm
  ```
* **macOS (Homebrew)**:
  ```bash
  brew install flex bison gcc make python@3.11 node
  ```
* **Windows (MSYS2 / MinGW-w64)**:
  ```bash
  pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-flex mingw-w64-x86_64-bison make
  ```

### 2. Python Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

---

## 39. Build Instructions

To build the native C++ compiler executable:
```bash
cd compiler
make clean
make
```
This runs:
1. `flex -o lex.yy.cpp lexer.l`
2. `bison -d -o parser.tab.cpp parser.y`
3. `g++ -std=c++17 -O2 -Iinclude lex.yy.cpp parser.tab.cpp src/*.cpp -o build/logql_cli`

---

## 40. Run Instructions

### 1. Start Backend API Server
```bash
cd backend
# Activate virtual environment
uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

### 2. Start Frontend Studio
```bash
cd frontend
npm run dev
```
Studio UI will be accessible at: `http://localhost:3000`.

### 3. Run Standalone Compiler CLI (Terminal Mode)
```bash
# Compile and dump JSON representation of tokens, AST, and plan:
./compiler/build/logql_cli --query "SELECT service, COUNT(*) FROM logs WHERE status >= 500 GROUP BY service;" --json

# Execute directly against a log file:
./compiler/build/logql_cli --query "SELECT service, COUNT(*) FROM logs GROUP BY service;" --dataset sample-logs/app_events.jsonl --execute
```

---

## 41. Environment Variables

### Backend (`backend/.env`)
```env
PORT=8000
HOST=0.0.0.0
COMPILER_CLI_PATH=../compiler/build/logql_cli
SAMPLE_LOGS_DIR=../sample-logs
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 42. Complete Data Flow

```text
User enters query in Next.js Studio
       │
       ▼
HTTP POST /api/execute { query, datasetId }
       │
       ▼
FastAPI Backend Bridge (`query.py`)
       │ Normalizes dataset (JSONL/CLF/Syslog)
       │ Spawns subprocess: `logql_cli --json --execute`
       ▼
Flex Lexer (`lexer.l`)
       │ Emits token stream with line & column coordinates
       ▼
Bison Parser (`parser.y`)
       │ Verifies LALR(1) grammar; constructs ASTNode hierarchy
       ▼
Semantic Analyzer (`semantic.cpp`)
       │ Checks schema fields, type compatibility, and GROUP BY rules
       ▼
Query Optimizer (`optimizer.cpp`)
       │ Applies Constant Folding, Duplicate Elimination, Pushdown, Pruning
       ▼
Physical Planner (`execution_plan.cpp`)
       │ Builds Volcano Operator Tree
       ▼
Execution Engine (`executor.cpp`)
       │ Pulls records through iterators in RAM; aggregates and limits
       ▼
CLI outputs structured JSON payload
       │
       ▼
FastAPI responds with JSON (Tokens, AST, Diagnostics, Plan, Rows, Metrics)
       │
       ▼
Next.js Studio renders Data Table, Token Badges, AST Tree, and Charts
```

---

## 43. Complete User Flow

```text
[Step 1] Open Web Browser at http://localhost:3000
   │
[Step 2] Navigate to 'Query Studio' (/studio)
   │
[Step 3] Select Dataset: 'Nginx Web Access Logs' (1,000 lines)
   │
[Step 4] Click Preset Query: "High Latency 5xx Errors by Service"
   │
[Step 5] Review generated query in Monaco Editor:
   │     SELECT service, AVG(response_time), COUNT(*)
   │     FROM logs
   │     WHERE status >= 500 AND response_time > 100.0
   │     GROUP BY service
   │     ORDER BY COUNT(*) DESC;
   │
[Step 6] Press 'Run Query' button (or Ctrl + Enter)
   │
[Step 7] Inspect Output Tabs:
   │     ├── [Results]: Tabular output of services and calculated averages
   │     ├── [Tokens]: Visual badge sequence of lexical tokens
   │     ├── [AST]: Interactive tree showing QueryNode, BinaryOpNode, etc.
   │     ├── [Semantic]: Green checkmark showing schema and type safety
   │     ├── [Optimizer]: Visual diff showing Constant Folding & Pushdown
   │     ├── [Physical Plan]: Step-by-step operator pipeline with row counters
   │     └── [Charts]: Latency distribution bar chart & status breakdown
```

---

## 44. Domain Rules

1. **Normalized Schema Invariant**: All log inputs must normalize to the canonical 8 fields: `timestamp`, `service`, `level`, `status`, `response_time`, `path`, `ip`, `message`.
2. **Read-Only Invariant**: LogQL queries never mutate or delete source records.
3. **Type Promotion Invariant**: Arithmetic between `INTEGER` and `FLOAT` automatically promotes the result to `FLOAT`.
4. **Aggregate Scope Invariant**: Mixing scalar expressions with aggregate functions without an explicit `GROUP BY` clause is a fatal semantic error.
5. **Deterministic Optimization**: Optimization rules must preserve exact semantic equivalence for all inputs.

---

## 45. Edge Cases

| Edge Case | Expected System Behavior |
| :--- | :--- |
| **Empty Query String** | Fast rejection at API/Lexer level with error: `Empty query provided`. |
| **Empty Log Dataset** | Successful execution; operators initialize and return 0 rows without crashing. |
| **No Matching Rows** | Filter operator drops all rows; returns valid schema headers with 0 rows. |
| **Division by Zero** | Safely caught during expression evaluation; emits diagnostic warning and evaluates to `NULL`/`0.0`. |
| **Extremely Large Numeric Literal** | Lexer checks bounds; overflows reported as lexical errors before parser consumption. |
| **Malformed Log Line in Ingestion** | Normalizer logs a warning, skips the malformed line, and parses remaining lines. |
| **`LIMIT 0`** | Valid; immediately closes execution pipeline and returns empty result set. |

---

## 46. Performance Considerations

* **Compilation Latency**: Lexing, parsing, semantic checking, and optimization execute in $< 2\text{ms}$ for standard queries.
* **Execution Latency**: In-memory scan and aggregation over 10,000 log records execute in $< 25\text{ms}$.
* **Memory Footprint**: In-memory dataset of 10,000 normalized records consumes $< 5\text{ MB}$ of RAM.
* **Optimization Benefit**: Predicate Pushdown and Projection Reduction reduce record evaluation memory by up to $60\%$.

---

## 47. Extensibility

### 47.1 Adding a New Log Format
1. Open `backend/app/services/log_ingestion.py`.
2. Implement a new regex or JSON parsing function matching the new format.
3. Map parsed fields to `LogRecord` canonical keys.
4. Register the new format in `FORMAT_PARSERS` dictionary.

### 47.2 Adding a New Aggregate Function (e.g., `STDDEV`)
1. **Lexer** (`compiler/lexer.l`): Add token rule for `STDDEV` keyword.
2. **Parser** (`compiler/parser.y`): Add `STDDEV` to `AggFunc` grammar production.
3. **Semantic Checker** (`compiler/src/semantic.cpp`): Add type validation requiring numeric arguments.
4. **Execution Engine** (`compiler/src/executor.cpp`): Add standard deviation accumulator in `AggregateOperator`.

### 47.3 Adding a New Optimization Rule
1. Define the transformation rule in `compiler/include/optimizer.hpp`.
2. Implement recursive AST pattern matcher and rewriter in `compiler/src/optimizer.cpp`.
3. Register the rule in the optimization pass sequence.
4. Add unit test in `compiler/tests/test_optimizer.cpp`.

---

## 48. Coding Conventions

* **C++17**: Modern idiomatic C++ with `std::unique_ptr` for memory ownership, `const auto&` for traversals, CamelCase class names, and snake_case method/variable names.
* **Python**: PEP 8 compliance, type annotations on all function signatures, and Pydantic models for data structures.
* **TypeScript / React**: Strict TypeScript (`noImplicitAny`), functional React components, PascalCase component names, and Tailwind CSS utility classes.

---

## 49. AI Agent Development Rules

Any AI coding assistant working on this codebase must adhere to these mandatory rules:

1. **Master Context First**: Always read `PROJECT_CONTEXT.md` before proposing or generating changes.
2. **No Faked Functionality**: Never hardcode fake ASTs, token streams, or execution metrics. All outputs must come from the actual C++ compiler binary and FastAPI services.
3. **Preserve Compiler Rigor**: Do not replace Flex/Bison with JavaScript/Python regex parsers. The core academic identity of this project is its C++ Flex/Bison compiler pipeline.
4. **Preserve Mini-Project Boundaries**: Never introduce Docker, Kubernetes, microservices, cloud dependencies, or external database engines.
5. **Incremental Verification**: Compile and run tests after modifying C++ sources before declaring a task complete.

---

## 50. Safe Modification Rules

Before modifying any module:
1. **Inspect Callers**: Check which modules depend on the target header or function.
2. **Make Atomic Changes**: Change one compiler phase or UI component at a time.
3. **Rebuild Native Binary**: Run `cd compiler && make` and ensure zero compiler warnings (`-Wall -Wextra`).
4. **Run Unit Tests**: Execute `compiler/tests` to verify no regressions in grammar, AST, or optimizer.
5. **Verify End-to-End**: Test execution through the web studio at `http://localhost:3000/studio`.

---

## 51. Known Limitations

* **Single Stream Only**: No multi-table `JOIN` operations (by design).
* **In-Memory Dataset Scale**: Optimized for datasets up to 50,000 records; large multi-gigabyte log dumps should be sampled before querying.
* **Single-Process Execution**: Execution runs on a single CPU core without distributed partitioning.

---

## 52. Future Scope (Academic Enhancements)

The following items are recognized as future extensions beyond the mini-project baseline:
* `[FUTURE]` Hash-indexed log scanning for indexed attribute lookups ($O(1)$ equality filters).
* `[FUTURE]` Regular expression literal matching operator (e.g., `WHERE message MATCHES 'regex'`).
* `[FUTURE]` Real-time streaming log tailing via WebSocket integration.
* `[FUTURE]` Cost-based query optimizer utilizing table statistics and histogram distributions.

---

## 53. Change History

| Version | Date | Changes & Summary | Rationale |
| :--- | :--- | :--- | :--- |
| **1.0.0** | 2026-09-29 | Initial consolidated Master `PROJECT_CONTEXT.md` specification created | Unification of all requirements, compiler specs, architecture, and developer guidelines into one single source of truth. |

---

## 54. Project Completion Checklist

- [x] Formal CFG Grammar & Operator Precedence Defined
- [x] Flex Lexer (`lexer.l`) with Coordinate Tracking
- [x] Bison Parser (`parser.y`) generating Strongly-Typed AST
- [x] Object-Oriented AST Hierarchy with JSON Serialization
- [x] Semantic Analyzer (Schema Validation, Type Checking, Aggregation Constraints)
- [x] 4 Concrete Optimization Passes (Constant Folding, Duplicate Predicates, Pushdown, Projection)
- [x] Volcano Iterator Execution Engine (`Scan`, `Filter`, `Aggregate`, `Project`, `Sort`, `Limit`)
- [x] Standalone Compiler CLI with JSON Output Mode
- [x] Log Normalizer for JSONL, Apache/Nginx CLF, and Syslog Formats
- [x] FastAPI Backend Service & Subprocess Bridge
- [x] Next.js Developer Studio UI with Monaco Query Editor
- [x] Multi-Tab Visual Inspector (Tokens, AST Tree, Semantic Diagnostics, Optimizer Diff, Plan Pipeline)
- [x] Recharts Analytics Visualizations (Status Breakdown, Latency Histograms)
- [x] Unit Test Suite for Compiler Phases
- [x] Realistic Sample Log Datasets
- [x] Single Authoritative Documentation Specification (`PROJECT_CONTEXT.md`)

---

## 55. Definition of Done

The LogQL project is considered functionally and academically complete when:
1. A user can select any sample log dataset or upload a custom log file.
2. The user can compose any supported LogQL query in the web studio.
3. The Flex lexer tokenizes the query without errors and surfaces token badges with exact line/column positions.
4. The Bison parser parses the grammar and outputs an interactive AST tree representation.
5. The Semantic Analyzer validates schema fields, type compatibility, and aggregation constraints, reporting clear diagnostics if invalid.
6. The Query Optimizer demonstrably executes Constant Folding, Predicate Pushdown, Duplicate Removal, and Projection Pruning.
7. The Physical Planner constructs a Volcano operator pipeline and executes it in-memory against normalized records.
8. The UI renders tabular results, execution duration, record drop-offs, and analytics charts.
9. Invalid queries produce clear, human-readable error messages with line/column pointers.
10. The entire system runs locally with zero external database dependencies.
