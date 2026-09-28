# REQUIREMENTS SPECIFICATION

This document specifies the complete functional and non-functional requirements for **LogQL — Compiler-Based Log Query & Optimization Engine**.

---

## 1. Functional Requirements (FR)

### FR-01: Log Ingestion & Input Handling
* **FR-01.1**: The system shall accept log data from two sources:
  1. Pre-packaged sample log files (e.g., Nginx access logs, JSON application logs, Syslog).
  2. Direct user upload / text pasting via the frontend interface.
* **FR-01.2**: Supported log formats shall include:
  * **JSON Lines (JSONL)**: Each line is a valid JSON object.
  * **Standard Combined Log Format (CLF)**: Standard Nginx/Apache log pattern.
  * **Common Syslog Format**: Standard timestamp + host + tag + message.
* **FR-01.3**: The ingestion subsystem shall parse log records into an in-memory normalized internal schema.

### FR-02: Normalized Log Record Schema
* **FR-02.1**: Each normalized log record shall map to standard typed fields:
  * `timestamp` (String / ISO-8601 representation)
  * `service` (String)
  * `level` (String: `INFO`, `WARN`, `ERROR`, `DEBUG`, `FATAL`)
  * `status` (Integer: HTTP status code or process exit code, e.g., `200`, `404`, `500`)
  * `response_time` (Float: Duration in milliseconds)
  * `path` (String: Request URI or endpoint)
  * `ip` (String: Client IP address)
  * `message` (String: Raw or descriptive log message payload)

### FR-03: LogQL Query Language Specification
The system shall support a declarative, SQL-style Domain-Specific Language with the following grammar rules:

```text
Query         ::= SELECT SelectList FROM TableRef [WHERE Expression] [GROUP BY GroupList] [ORDER BY OrderList] [LIMIT Integer] ;
SelectList    ::= [DISTINCT] ( '*' | SelectItem ( ',' SelectItem )* )
SelectItem    ::= FunctionCall [AS Identifier] | Identifier [AS Identifier]
GroupList     ::= Identifier ( ',' Identifier )*
OrderList     ::= OrderItem ( ',' OrderItem )*
OrderItem     ::= ( Identifier | FunctionCall ) [ASC | DESC]
Expression    ::= Expression OR Conjunction | Conjunction
Conjunction   ::= Conjunction AND Inversion | Inversion
Inversion     ::= NOT Inversion | Predicate
Predicate     ::= PrimaryExpr CompOp PrimaryExpr | '(' Expression ')'
PrimaryExpr   ::= Identifier | Literal | FunctionCall | PrimaryExpr MathOp PrimaryExpr
CompOp        ::= '=' | '!=' | '<' | '>' | '<=' | '>='
MathOp        ::= '+' | '-' | '*' | '/'
FunctionCall  ::= AggFunc '(' ( '*' | Identifier ) ')'
AggFunc       ::= 'COUNT' | 'MIN' | 'MAX' | 'AVG' | 'SUM'
Literal       ::= IntegerLiteral | FloatLiteral | StringLiteral | BooleanLiteral
```

### FR-04: Lexical Analysis (Flex/Lex)
* **FR-04.1**: The lexer shall recognize case-insensitive keywords: `SELECT`, `FROM`, `WHERE`, `GROUP`, `BY`, `ORDER`, `ASC`, `DESC`, `LIMIT`, `DISTINCT`, `AND`, `OR`, `NOT`, `COUNT`, `MIN`, `MAX`, `AVG`, `SUM`, `AS`.
* **FR-04.2**: The lexer shall tokenize identifiers matching `[a-zA-Z_][a-zA-Z0-9_]*`.
* **FR-04.3**: The lexer shall recognize numeric literals (integers `[0-9]+`, floats `[0-9]+\.[0-9]+`), string literals (`'[^']*'` or `"[^"]*"`), and boolean literals (`TRUE`, `FALSE`).
* **FR-04.4**: The lexer shall track token line numbers and column numbers.
* **FR-04.5**: The lexer shall output a serialized token stream containing:
  `[ { "token": "SELECT", "lexeme": "SELECT", "line": 1, "col": 1 }, ... ]`.

### FR-05: Syntax Analysis & AST Generation (Bison/YACC)
* **FR-05.1**: The parser shall validate queries according to the LogQL Context-Free Grammar.
* **FR-05.2**: The parser shall enforce proper clause ordering: `SELECT -> FROM -> [WHERE] -> [GROUP BY] -> [ORDER BY] -> [LIMIT]`.
* **FR-05.3**: The parser shall correctly resolve operator precedence (Math operators `*`, `/` over `+`, `-`; Comparison over Logical; `NOT` over `AND` over `OR`).
* **FR-05.4**: The parser shall generate a well-formed Abstract Syntax Tree (AST) representing the root `QueryNode` and its child branches.
* **FR-05.5**: The AST must be serializable into hierarchical JSON for frontend rendering.

### FR-06: Semantic Analysis
* **FR-06.1 - Schema Validation**: Validate that all referenced fields exist in the normalized log schema (e.g., query referencing `unknown_field` fails with error).
* **FR-06.2 - Type Consistency**: Validate operand types in binary expressions (e.g., comparing a string field `service = 500` without type conversion raises a semantic type warning/error).
* **FR-06.3 - Aggregation Rules**:
  * If aggregate functions (`COUNT`, `AVG`, etc.) are used alongside scalar fields, all scalar fields in the `SELECT` list must be present in the `GROUP BY` clause.
  * Aggregate functions cannot be nested (e.g., `COUNT(AVG(response_time))` is invalid).
* **FR-06.4 - Function Argument Validity**: Validate function argument counts and types (e.g., `COUNT(*)` is valid; `AVG(*)` is invalid; `AVG(service)` fails because `service` is a non-numeric string).
* **FR-06.5 - Clause Constraints**: Validate that `LIMIT` is a non-negative integer.

### FR-07: Query Optimization (Rule-Based Transformations)
The system shall implement and expose four demonstrable optimization passes:
* **FR-07.1 - Constant Folding**:
  * Evaluates compile-time constant arithmetic/logical expressions directly in the AST.
  * Example: `WHERE status >= 400 + 100` is transformed to `WHERE status >= 500`.
* **FR-07.2 - Duplicate Predicate Elimination**:
  * Simplifies redundant idempotent conditions joined by `AND`/`OR`.
  * Example: `WHERE status >= 500 AND status >= 500` is simplified to `WHERE status >= 500`.
* **FR-07.3 - Predicate Pushdown**:
  * Ensures filter operations (`WHERE`) are scheduled before aggregation (`GROUP BY`) and sorting (`ORDER BY`) so non-qualifying records are discarded as early as possible.
* **FR-07.4 - Projection Reduction**:
  * Identifies the exact set of columns required across `SELECT`, `WHERE`, `GROUP BY`, and `ORDER BY`, allowing the execution engine to skip processing unused fields.

### FR-08: Execution Plan & Execution Engine
* **FR-08.1**: Construct a physical execution pipeline composed of sequential/pipelineable operators:
  1. `LogScanOperator` (with projected column pruning)
  2. `FilterOperator` (evaluating optimized boolean expression tree)
  3. `AggregateOperator` (hash-based grouping for `GROUP BY` + aggregators)
  4. `ProjectOperator` (computing final select expressions and aliases)
  5. `SortOperator` (in-memory multi-column ordering)
  6. `LimitOperator` (early truncation)
* **FR-08.2**: The engine shall execute the pipeline against the in-memory dataset and return structured row results.
* **FR-08.3**: The engine shall record execution metrics: total rows scanned, rows filtered, rows grouped, rows returned, and execution duration in milliseconds.

### FR-09: Developer Studio UI
* **FR-09.1 - Query Editor**: Syntax-highlighted input area with pre-populated sample query shortcuts.
* **FR-09.2 - Dataset Selector**: Dropdown to switch between sample datasets or upload a custom log file.
* **FR-09.3 - Multi-Tab Inspection Panel**:
  * **Results Tab**: Interactive table displaying returned records and row counts.
  * **Tokens Tab**: Visual badge stream of lexer tokens with token names, values, and coordinates.
  * **AST Tab**: Visual hierarchical tree of the parsed query.
  * **Semantic Diagnostics Tab**: Summary of semantic validation checks (symbols, types, aggregation rules).
  * **Optimizer Tab**: Side-by-side view of pre-optimized AST vs. post-optimized AST and list of applied transformation rules.
  * **Execution Plan Tab**: Step-by-step pipeline visualizer displaying operator inputs, outputs, and cost metrics.
  * **Analytics / Charts Tab**: Basic visual charts (e.g., status code breakdown, response time bar charts, error frequencies).

### FR-10: Error Diagnostics & Diagnostics Reporting
* **FR-10.1**: The system shall categorize and clearly label error types:
  * `Lexical Error`: Invalid characters, unclosed string literals.
  * `Syntax Error`: Unexpected tokens, missing clauses, misplaced keywords with line/column pointer.
  * `Semantic Error`: Unknown attributes, invalid types, improper `GROUP BY` usage.
  * `Execution Error`: Zero-division during evaluation, invalid log format.
* **FR-10.2**: All errors shall return a human-readable message and location context.

---

## 2. Non-Functional Requirements (NFR)

* **NFR-01 - Portability & Simplicity**: The entire application must be able to run locally on a developer machine (Windows/Linux/macOS) with basic toolchains (GCC/Clang, Flex, Bison, Python 3.10+, Node.js 18+).
* **NFR-02 - Performance**:
  * Compilation (Lexing + Parsing + Semantic + Optimization) for typical queries (<500 characters) must take < 5ms.
  * In-memory query execution for datasets up to 10,000 log records must take < 50ms.
* **NFR-03 - Modularity & Maintainability**:
  * The compiler core (C/C++) must be isolated from the backend API (Python) and frontend (Next.js/React).
  * The compiler must be callable both as a standalone CLI executable and via the backend API.
* **NFR-04 - Code Readability & Viva Preparedness**: Code must be cleanly commented with references to compiler design textbook concepts (Dragon Book / Cooper & Torczon) to facilitate presentation and viva examination.

---

## 3. Scope Categorization: MVP vs. Optional vs. Future Scope

| Requirement | MVP (Must Have) | Optional / Enhanced | Future Scope (Out of Project Scope) |
| :--- | :--- | :--- | :--- |
| **Lexer (Flex)** | Complete keyword, literal, operator recognition | Unicode / Escape sequence parsing | Custom regex literal tokens |
| **Parser (Bison)** | Core LogQL grammar, CFG, AST generation | Autocomplete grammar suggestions | Multi-table JOIN grammar |
| **Semantic Analysis** | Schema, type check, `GROUP BY` validation | Strict datetime format validation | Custom user-defined functions (UDF) |
| **Optimizer** | Constant folding, predicate pushdown, duplicate removal | Advanced cost-based statistics optimizer | Distributed partition pruning |
| **Execution Engine** | In-memory stream/vectorized operator pipeline | Indexed log scanning (B-Tree/Hash) | Distributed map-reduce workers |
| **Log Formats** | JSONL, Nginx/Apache Combined, Syslog | Custom regex format configuration | Real-time streaming socket ingestion |
| **UI Inspection** | Interactive tabs for Tokens, AST, Optimizer, Plan, Results | Interactive Tree Visualizer (React Flow) | Collaborative query dashboard |
| **Analytics** | Bar/Pie charts for status distribution & latency | Anomaly detection alerts (threshold-based)| ML-based outlier clustering |

---

## 4. Acceptance Criteria

1. **Compilation Acceptance**:
   * A valid query such as `SELECT service, COUNT(*) FROM logs WHERE status >= 500 GROUP BY service ORDER BY COUNT(*) DESC;` successfully passes lexing, parsing, semantic analysis, and optimization without errors.
   * An invalid query such as `SELECT unknown_col FROM logs WHERE status = 'error'` cleanly produces a semantic error without crashing.
2. **Optimization Acceptance**:
   * A query containing `WHERE 200 + 300 = status AND status = 500` demonstrably shows constant folding (`500 = status`) and duplicate removal in the optimizer inspection tab.
3. **Execution Acceptance**:
   * Ingesting a sample log file of 1,000 entries and running an aggregate query returns mathematically correct grouped counts matching an independent verification (e.g., Python `Counter` or Excel).
4. **Pedagogical Acceptance**:
   * All intermediate stages (tokens, raw AST, optimized AST, physical plan) are fully visible in the web interface and exportable via JSON API.
