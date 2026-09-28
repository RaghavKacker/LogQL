# ARCHITECTURE SPECIFICATION

This document outlines the system architecture, component relationships, data flows, and module boundaries for **LogQL — Compiler-Based Log Query & Optimization Engine**.

---

## 1. High-Level System Architecture

LogQL is organized as a modular 3-tier system:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          1. FRONTEND TIER                              │
│         Next.js (React / TypeScript / Tailwind CSS / Monaco)           │
│                                                                        │
│   ┌───────────────┐  ┌───────────────┐  ┌──────────────────────────┐   │
│   │ Query Studio  │  │ Visual AST    │  │ Multi-Stage Inspector    │   │
│   │ (Monaco/Input)│  │ (Tree Viewer) │  │ (Tokens, Optimizer, Plan)│   │
│   └───────┬───────┘  └───────▲───────┘  └────────────▲─────────────┘   │
└───────────┼──────────────────┼───────────────────────┼─────────────────┘
            │ HTTP POST        │ HTTP Response JSON    │
            ▼                  │                       │
┌──────────────────────────────┴───────────────────────┴─────────────────┐
│                          2. BACKEND TIER                               │
│                   FastAPI (Python 3.10+ / Pydantic)                    │
│                                                                        │
│   ┌─────────────────────┐  ┌──────────────────┐  ┌────────────────┐   │
│   │ API Endpoints       │  │ Log Ingestion &  │  │ Compiler CLI / │   │
│   │ (/compile, /execute)│  │ Normalizer       │  │ Subprocess / C │   │
│   └──────────┬──────────┘  └────────┬─────────┘  │ Bridge Driver  │   │
└──────────────┼──────────────────────┼────────────┴───────▲────────────┘
               │                      │                    │
               ▼                      ▼                    │
┌──────────────────────────────────────────────────────────┴─────────────┐
│                          3. COMPILER CORE                              │
│                    C / C++ (Flex, Bison, Native)                       │
│                                                                        │
│   ┌───────────────┐     ┌───────────────┐     ┌────────────────────┐   │
│   │ Lexer (Flex)  │ ──► │ Parser (Bison)│ ──► │ Abstract Syntax    │   │
│   │ (lexer.l)     │     │ (parser.y)    │     │ Tree (AST) Model   │   │
│   └───────────────┘     └───────────────┘     └─────────┬──────────┘   │
│                                                         │              │
│   ┌───────────────┐     ┌───────────────┐     ┌─────────▼──────────┐   │
│   │ Execution     │ ◄── │ Rule-Based    │ ◄── │ Semantic Analysis  │   │
│   │ Engine & Plan │     │ Optimizer     │     │ & Type Checking    │   │
│   └───────────────┘     └───────────────┘     └────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Compiler Pipeline Subsystem Architecture

The Compiler Core is the heart of the project. It is structured into clearly isolated compilation stages:

```text
              [ Source Query String ]
                         │
                         ▼
        ┌─────────────────────────────────┐
        │   Stage 1: Lexical Analysis     │ ◄── flex (lexer.l)
        │   • Token classification        │
        │   • Coordinate tracking (l/c)   │
        └────────────────┬────────────────┘
                         │ Token Stream
                         ▼
        ┌─────────────────────────────────┐
        │   Stage 2: Syntax Analysis      │ ◄── bison (parser.y)
        │   • Context-Free Grammar check  │
        │   • Operator precedence table   │
        └────────────────┬────────────────┘
                         │ Raw AST Hierarchy
                         ▼
        ┌─────────────────────────────────┐
        │   Stage 3: Semantic Analysis    │ ◄── semantic_checker.cpp
        │   • Schema attribute validation │
        │   • Type inference & checking   │
        │   • Aggregation clause rules    │
        └────────────────┬────────────────┘
                         │ Decorated / Validated AST
                         ▼
        ┌─────────────────────────────────┐
        │   Stage 4: Query Optimization   │ ◄── optimizer.cpp
        │   • Constant folding            │
        │   • Predicate pushdown          │
        │   • Duplicate rule elimination  │
        │   • Projected column pruning    │
        └────────────────┬────────────────┘
                         │ Optimized AST
                         ▼
        ┌─────────────────────────────────┐
        │   Stage 5: Physical Planner     │ ◄── execution_plan.cpp
        │   • Logical-to-physical mapping │
        │   • Operator tree construction  │
        └────────────────┬────────────────┘
                         │ Physical Operator Tree
                         ▼
        ┌─────────────────────────────────┐
        │   Stage 6: Execution Engine     │ ◄── executor.cpp
        │   • In-memory iterator pipeline │
        │   • Volano-style Scan/Filter/   │
        │     Aggregate/Sort/Limit        │
        └────────────────┬────────────────┘
                         │
                         ▼
             [ JSON Output & Metrics ]
```

---

## 3. Abstract Syntax Tree (AST) Architecture

The AST uses a typed object-oriented node hierarchy designed for traversal, transformation, and serialization.

### Node Class Hierarchy:
* `ASTNode` (Abstract Base)
  * `QueryNode` (Root: owns SelectList, FromClause, WhereClause, GroupByClause, OrderByClause, LimitClause)
  * `SelectListNode` (contains list of `SelectItemNode`, `distinct` flag)
  * `SelectItemNode` (expression, optional string `alias`)
  * `FromNode` (string `tableName` e.g., "logs")
  * `WhereNode` (expression root)
  * `GroupByNode` (list of column identifier strings)
  * `OrderByNode` (list of `OrderItemNode` with column/expression and direction `ASC`/`DESC`)
  * `LimitNode` (integer value)
  * `ExprNode` (Abstract Expression Base)
    * `BinaryOpNode` (operator, left `ExprNode*`, right `ExprNode*`)
    * `UnaryOpNode` (operator `NOT`/`NEG`, operand `ExprNode*`)
    * `IdentifierNode` (string `name`)
    * `LiteralNode` (type tag `INT`, `FLOAT`, `STRING`, `BOOL`, raw value)
    * `FunctionCallNode` (string `funcName`, argument `ExprNode*` or `*`)

### AST Serialization Contract:
Every AST node implements a `toJson()` method enabling direct export of the syntax tree to JSON for frontend visualization:
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

## 4. Execution Engine Architecture (Volcano / Iterator Pattern)

The execution engine uses an in-memory pull-based iterator model where each operator implements:
* `open()`: Initialize state and child operators.
* `next()`: Return next qualifying `Record` (or batch) or `EOF`.
* `close()`: Clean up resources.

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

* **`LogScanOperator`**: Streams normalized log records, applying projection reduction (only extracting needed fields).
* **`FilterOperator`**: Evaluates WHERE expression tree per record; rejects non-matching records immediately.
* **`AggregateOperator`**: Accumulates hash table entries keyed by `GROUP BY` attributes, maintaining running aggregate accumulators (`count`, `sum`, `min`, `max`).
* **`ProjectOperator`**: Formats final output columns, computing derived expressions and assigning aliases.
* **`SortOperator`**: Collects upstream records and sorts by specified keys using a custom comparator.
* **`LimitOperator`**: Emits rows until the row counter reaches the `LIMIT` threshold, triggering early stream termination.

---

## 5. Backend Service Architecture

The backend exposes a clean REST API using FastAPI. It acts as the bridge orchestrating dataset ingestion and compiler invocations.

### Primary Endpoints:
1. `POST /api/compile`:
   * **Input**: `{ "query": "SELECT service, COUNT(*) FROM logs..." }`
   * **Output**: `{ "tokens": [...], "ast": {...}, "semanticValid": true, "optimizedAst": {...}, "optimizationsApplied": [...], "plan": {...} }`
2. `POST /api/execute`:
   * **Input**: `{ "query": "...", "datasetId": "sample-nginx" }`
   * **Output**: `{ "results": [...], "executionTimeMs": 1.4, "recordsScanned": 1000, "recordsReturned": 12 }`
3. `GET /api/datasets`:
   * **Output**: List of available preloaded sample datasets.
4. `POST /api/datasets/upload`:
   * **Input**: Raw text or uploaded `.log` / `.json` file; parses and normalizes into a memory store.

---

## 6. Directory Structure

```text
logql/
├── compiler/                     # Core C/C++ Compiler & Execution Engine
│   ├── Makefile                  # Build definitions (gcc/g++, flex, bison)
│   ├── lexer.l                   # Flex lexer definition
│   ├── parser.y                  # Bison LALR(1) parser definition
│   ├── include/                  # Header files
│   │   ├── ast.hpp               # AST node structures
│   │   ├── token.hpp             # Token definitions & serialization
│   │   ├── semantic.hpp          # Semantic checker & symbol tables
│   │   ├── optimizer.hpp         # Optimization passes
│   │   ├── execution_plan.hpp    # Physical plan generator
│   │   ├── executor.hpp          # Operator iterator engine
│   │   └── log_record.hpp        # In-memory record representation
│   ├── src/                      # Implementation files
│   │   ├── ast.cpp
│   │   ├── semantic.cpp
│   │   ├── optimizer.cpp
│   │   ├── execution_plan.cpp
│   │   ├── executor.cpp
│   │   └── main.cpp              # CLI driver (supports JSON output mode)
│   └── tests/                    # Compiler unit tests
│       ├── test_lexer.cpp
│       ├── test_parser.cpp
│       └── test_optimizer.cpp
│
├── backend/                      # Python FastAPI Bridge & API Server
│   ├── app/
│   │   ├── main.py               # FastAPI application entrypoint
│   │   ├── config.py             # Server configuration
│   │   ├── routers/
│   │   │   ├── query.py          # /api/compile and /api/execute
│   │   │   └── datasets.py       # /api/datasets management
│   │   ├── services/
│   │   │   ├── compiler_bridge.py# Invokes compiled binary / FFI
│   │   │   └── log_ingestion.py  # Ingests JSONL, CLF, Syslog
│   │   └── models/
│   │       ├── api_models.py     # Pydantic request/response schemas
│   │       └── log_schema.py     # Normalized record definitions
│   └── requirements.txt
│
├── frontend/                     # Next.js / TypeScript Web UI
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing & Overview Page
│   │   │   └── studio/page.tsx   # Interactive Query Studio
│   │   ├── components/
│   │   │   ├── QueryEditor.tsx   # Monaco / Code input with samples
│   │   │   ├── ResultsTable.tsx  # Query result renderer
│   │   │   ├── TokenViewer.tsx   # Lexer token inspector
│   │   │   ├── AstViewer.tsx     # Tree visualizer for AST
│   │   │   ├── OptimizerDiff.tsx # Before/After optimization inspector
│   │   │   ├── PlanViewer.tsx    # Pipeline execution plan inspector
│   │   │   └── MetricsCharts.tsx # Visual graphs & summary metrics
│   │   └── lib/
│   │       └── api.ts            # Typed backend API client
│   ├── package.json
│   └── tsconfig.json
│
├── sample-logs/                  # Preloaded sample datasets for testing & demos
│   ├── web_access.log            # Nginx/Apache CLF format
│   ├── app_events.jsonl          # Microservice JSON log format
│   └── system.log                # Standard Syslog format
│
├── docs/                         # Additional project notes & viva cheat sheet
│   └── VIVA_CHEATSHEET.md
│
├── PROJECT_CONTEXT.md
├── REQUIREMENTS.md
├── ARCHITECTURE.md
├── TECH_STACK.md
├── DATABASE.md
└── README.md
```
