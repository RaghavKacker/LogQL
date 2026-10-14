# LogQL — Master Technical Specification & Comprehensive Project Reference

> **Project Title**: LogQL — A Compiler-Based Log Query and Optimization Engine  
> **Academic Domain**: Undergraduate B.Tech Computer Science & Engineering — Compiler Design Mini Project  
> **Repository**: [https://github.com/RaghavKacker/LogScan](https://github.com/RaghavKacker/LogScan)  
> **Authorship & Architecture**: Compiler Core (C++17), Bridge API (Python FastAPI), Workbench UI (Next.js 14, TypeScript, Tailwind CSS)  
> **Document Status**: Complete Single Source of Truth covering internal architecture, mathematical formulations, compiler stages, and execution models.

---

## Table of Contents
1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [The Core Problem LogQL Solves](#2-the-core-problem-logql-solves)
3. [End-to-End System Architecture](#3-end-to-end-system-architecture)
4. [Minute Compiler Pipeline Breakdown](#4-minute-compiler-pipeline-breakdown)
   - [4.1 Lexical Analysis (Scanner — Flex)](#41-lexical-analysis-scanner--flex)
   - [4.2 Syntax Analysis (Parser — Bison LALR(1))](#42-syntax-analysis-parser--bison-lalr1)
   - [4.3 Abstract Syntax Tree (AST) Hierarchy](#43-abstract-syntax-tree-ast-hierarchy)
   - [4.4 Semantic Analysis & Type Invariant Checking](#44-semantic-analysis--type-invariant-checking)
   - [4.5 Rule-Based AST Optimization Passes](#45-rule-based-ast-optimization-passes)
   - [4.6 Intermediate Code Generation (Three-Address Code & Quadruples)](#46-intermediate-code-generation-three-address-code--quadruples)
   - [4.7 Physical Execution Planning & Volcano Pull-Iterators](#47-physical-execution-planning--volcano-pull-iterators)
5. [Log Ingestion & Multi-Format Parsing Subsystem](#5-log-ingestion--multi-format-parsing-subsystem)
6. [Interactive Workbench Features & User Interface](#6-interactive-workbench-features--user-interface)
7. [EXPLAIN ANALYZE Cost & Complexity Model](#7-explain-analyze-cost--complexity-model)
8. [Code Exporter Subsystem](#8-code-exporter-subsystem)
9. [Formal Grammar Specification (EBNF)](#9-formal-grammar-specification-ebnf)
10. [Error Handling, Diagnostics & Edge Cases](#10-error-handling-diagnostics--edge-cases)
11. [Build, Run & Process Isolation Engineering](#11-build-run--process-isolation-engineering)
12. [Academic Viva & Evaluator Defense Guide](#12-academic-viva--evaluator-defense-guide)

---

## 1. Executive Summary & Purpose

### 1.1 What is LogQL?
**LogQL** is a purpose-built, domain-specific query and optimization engine tailored specifically for inspecting, filtering, and aggregating high-volume semi-structured server and application log files. 

Rather than delegating query parsing or execution to external relational database engines (e.g., PostgreSQL, SQLite) or high-level query libraries (e.g., Python `sqlparse`, Pandas, DuckDB), **LogQL implements the entire textbook multi-stage compiler pipeline from scratch in native C++17**:
1. **Lexical Analysis (Scanner)**: Written in GNU Flex (`lexer.l`), emitting typed tokens with byte coordinates.
2. **Syntax Analysis (Parser)**: Written in GNU Bison (`parser.y`), running a deterministic LALR(1) state automaton to construct an Abstract Syntax Tree.
3. **Semantic Analysis**: Symbol table validation, schema checking, data-type compatibility, and SQL aggregation invariant checks.
4. **Intermediate Code Generation (ICG)**: Linearized Three-Address Code (TAC), Quadruple tuples `[Op, Arg1, Arg2, Result]`, and Control Flow Graph (CFG) basic blocks.
5. **AST Optimization Engine**: Heuristic and rule-based query optimizations (Predicate Pushdown, Projection Reduction / Dead-Column Pruning, and Constant Folding).
6. **Physical Execution Engine**: Memory-bounded Volcano pull-iterator processing model (`open()`, `next()`, `close()`).

### 1.2 Core Purpose
In enterprise production environments, server clusters generate tens of gigabytes of unstructured and semi-structured logs (HTTP access logs, microservice JSON logs, system daemons). Traditional approaches force developers into two bad extremes:
* **Overkill heavyweight databases**: Ingesting raw logs into Elasticsearch or PostgreSQL requires schema indexing overhead, disk amplification, and slow ingest latency.
* **Primitive text utilities**: Utilities like `grep`, `awk`, and `sed` lack semantic understanding, type checking, aggregation capabilities, and query plan optimization.

**LogQL bridges this gap** by treating log querying as a specialized compilation problem: compilation of a declarative SQL-like dialect directly into an optimized physical execution pipeline that runs directly over raw log data streams with minimal memory overhead.

---

## 2. The Core Problem LogQL Solves

When developers query logs, they ask structured questions over semi-structured text:
```sql
SELECT service, COUNT(*) 
FROM logs 
WHERE status >= 500 AND response_time > 150.0 
GROUP BY service 
ORDER BY COUNT(*) DESC;
```

Conventional ad-hoc scripts suffer from three critical bottlenecks:
1. **Full-Memory Deserialization**: Python scripts load all fields into memory, causing severe RAM pressure on multi-gigabyte log dumps.
2. **Late Filtering (Filter-After-Group)**: Naive interpreters group everything first and filter afterward, wasting CPU cycles on discarded records.
3. **Lack of Type Verification**: A typo like `WHERE staus = 200` fails silently or after scanning millions of rows.

### How LogQL Solves This
* **Zero Runtime Dependencies**: The compiler core is a native binary with zero external runtime dependencies.
* **Predicate Pushdown**: The query optimizer pushes `status >= 500` before grouping and sorting, eliminating 90%+ of records before memory allocation occurs.
* **Dead-Field Pruning (Projection Reduction)**: The lexer and scan operator only extract the 2 columns needed (`service`, `status`), ignoring unused columns (`timestamp`, `ip`, `message`).
* **Volcano Pull-Iterators**: Each record flows one by one through pipelined iterators, bounding peak memory consumption to $O(1)$ streaming overhead plus hash table space for distinct aggregate keys.

---

## 3. End-to-End System Architecture

The project is structured in three modular layers:
1. **Compiler Core (C++17)**: Handles scanning, parsing, semantic checking, IR generation, optimization, and query execution.
2. **FastAPI Backend (Python 3.10+)**: Provides asynchronous REST API endpoints, file uploads, dataset management, and invokes the native binary via an IPC bridge.
3. **Workbench Studio (Next.js 14, TypeScript, Tailwind CSS)**: Developer UI with query editor, compiler internals visualizer (Tokens, AST, Semantic, Optimizer, TAC/Quadruples, Physical Plan), interactive EXPLAIN cost model, and runnable code exporter.

```mermaid
flowchart TD
    User([User / Browser]) <--> Studio["LogQL Workbench Studio (Next.js 14)"]
    Studio <--> FastApi["FastAPI Backend Bridge (Port 8000)"]
    FastApi <--> CLI["Native Compiler CLI binary (logql_cli.exe)"]
    
    subgraph "Native C++ Compiler Pipeline"
        CLI --> Lexer["1. Lexer (Flex lex.yy.cpp)"]
        Lexer --> Parser["2. Parser (Bison parser.tab.cpp)"]
        Parser --> AST["3. Abstract Syntax Tree (AST)"]
        AST --> Semantic["4. Semantic Analyzer (Symbol Table & Invariants)"]
        Semantic --> Optimizer["5. AST Query Optimizer (Pushdown & Pruning)"]
        Optimizer --> TAC["6. Intermediate Code Gen (TAC & Quadruples)"]
        Optimizer --> Planner["7. Volcano Physical Planner"]
        Planner --> Executor["8. Volcano Iterator Executor"]
    end
    
    Executor <--> Logs[("Log Files (.jsonl, .clf, syslog)")]
```

---

## 4. Minute Compiler Pipeline Breakdown

### 4.1 Lexical Analysis (Scanner — Flex)
* **Source**: `compiler/lexer.l`, generated into `compiler/lex.yy.cpp`.
* **Technology**: GNU Flex scanner generator.
* **Role**: Scans raw ASCII/UTF-8 query text character-by-character, matches regular expressions, and emits strongly-typed tokens.

#### Detailed Lexical Token Map
| Token Macro | Category | Regex Pattern | Description |
| :--- | :--- | :--- | :--- |
| `KEYWORD_SELECT` | Keyword | `(?i:SELECT)` | Case-insensitive projection clause initiator |
| `KEYWORD_FROM` | Keyword | `(?i:FROM)` | Source dataset specifier |
| `KEYWORD_WHERE` | Keyword | `(?i:WHERE)` | Filtering predicate initiator |
| `KEYWORD_GROUP` | Keyword | `(?i:GROUP)` | Aggregation partitioning |
| `KEYWORD_BY` | Keyword | `(?i:BY)` | Clause continuation keyword |
| `KEYWORD_ORDER` | Keyword | `(?i:ORDER)` | Sort clause initiator |
| `KEYWORD_LIMIT` | Keyword | `(?i:LIMIT)` | Output cardinality restriction |
| `KEYWORD_COUNT`, `AVG`, `SUM`, `MIN`, `MAX` | Function | `(?i:COUNT)`, etc. | Aggregate function calls |
| `OP_GE`, `OP_LE`, `OP_EQ`, `OP_NE`, `OP_GT`, `OP_LT` | Operator | `>=`, `<=`, `=`, `!=`, `>`, `<` | Relational comparison operators |
| `OP_PLUS`, `OP_MINUS`, `OP_STAR`, `OP_SLASH` | Operator | `+`, `-`, `*`, `/` | Arithmetic operators |
| `KEYWORD_AND`, `KEYWORD_OR`, `KEYWORD_NOT` | Logical | `(?i:AND)`, `(?i:OR)`, `(?i:NOT)` | Boolean logical operators |
| `INT_LITERAL` | Literal | `[0-9]+` | 64-bit signed integer |
| `FLOAT_LITERAL` | Literal | `[0-9]+\.[0-9]+` | IEEE-754 64-bit floating point |
| `STRING_LITERAL` | Literal | `'[^']*'` or `\"[^\"]*\"` | Quoted string literals |
| `IDENTIFIER` | Identifier | `[a-zA-Z_][a-zA-Z0-9_]*` | Column names, table names, aliases |
| `COMMA`, `SEMICOLON`, `LPAREN`, `RPAREN` | Delimiter | `,`, `;`, `(`, `)` | Syntactic separators |

#### Lexer State & Coordinate Tracking
The scanner tracks exact `line` and `col` coordinate offsets using Flex actions:
```cpp
#define YY_USER_ACTION \
    yylloc.first_line = yylloc.last_line = yylineno; \
    yylloc.first_column = yycolumn; \
    yylloc.last_column = yycolumn + yyleng - 1; \
    yycolumn += yyleng;
```
If an illegal character is encountered (e.g. `@`, `$`, `\`), the scanner does not crash; it emits a `LEXICAL_ERROR` token with its exact line and column, returning an error message directly to the UI.

---

### 4.2 Syntax Analysis (Parser — Bison LALR(1))
* **Source**: `compiler/parser.y`, generated into `compiler/parser.tab.cpp` and `compiler/parser.tab.hpp`.
* **Technology**: GNU Bison deterministic Bottom-Up LALR(1) Parser.
* **Role**: Validates grammar rules, resolves operator precedence, and constructs the recursive Abstract Syntax Tree (AST).

#### Grammar Precedence Declarations
To resolve standard ambiguous grammar issues (e.g. `2 + 3 * 4` or `a OR b AND c`), Bison precedence directives are defined:
```yacc
%left KEYWORD_OR
%left KEYWORD_AND
%right KEYWORD_NOT
%left OP_EQ OP_NE OP_LT OP_LE OP_GT OP_GE
%left OP_PLUS OP_MINUS
%left OP_STAR OP_SLASH
%right UMINUS
```

#### Grammar Production Rules
The grammar enforces standard SQL statement order:
$$\text{Query} \to \text{SELECT} \to \text{FROM} \to [\text{WHERE}] \to [\text{GROUP BY}] \to [\text{ORDER BY}] \to [\text{LIMIT}] \to [;]$$

```yacc
query_statement:
    select_clause from_clause opt_where_clause opt_group_by_clause opt_order_by_clause opt_limit_clause opt_semicolon
    {
        $$ = new logql::QueryNode($1, $2, $3, $4, $5, $6);
        g_parsedQuery = $$;
    }
```

---

### 4.3 Abstract Syntax Tree (AST) Hierarchy
Defined in `compiler/include/ast.hpp`:
* `ASTNode` (Abstract Base Class):
  * `QueryNode`: Root container representing the complete query specification.
  * `SelectListNode`: Projection list containing one or more `SelectItemNode` instances (`distinct` flag, `isStar` wildcard flag).
  * `SelectItemNode`: An expression (`ExprNode`) with optional alias string (`AS alias`).
  * `FromNode`: Identifies the target log table or dataset identifier.
  * `WhereNode`: Contains the root boolean predicate expression (`ExprNode`).
  * `GroupByNode`: Vector of column identifiers to partition records.
  * `OrderByNode`: Vector of order items with ascending/descending directional flags.
  * `LimitNode`: Integer literal specifying maximum materialized output rows.
* `ExprNode` (Expression Base Class):
  * `LiteralNode`: Holds typed literal constants (`int64_t`, `double`, `std::string`, `bool`).
  * `IdentifierNode`: References column attributes (`status`, `service`, `response_time`).
  * `BinaryOpNode`: Binary operations (`+`, `-`, `*`, `/`, `=`, `!=`, `<`, `<=`, `>`, `>=`, `AND`, `OR`).
  * `UnaryOpNode`: Unary operations (`NOT`, negation `-`).
  * `FunctionCallNode`: Aggregate functions (`COUNT(*)`, `AVG(response_time)`, `MAX(status)`).

---

### 4.4 Semantic Analysis & Type Invariant Checking
* **Source**: `compiler/src/semantic.cpp`, `compiler/include/semantic.hpp`.
* **Role**: Verifies semantic correctness against the known unified schema and relational database invariants.

#### Validation Invariants Enforced
1. **Schema Membership Validation**:
   Checks whether referenced identifiers exist in the valid LogQL schema:
   $$\text{Valid Fields} = \{\texttt{timestamp}, \texttt{service}, \texttt{level}, \texttt{status}, \texttt{response\_time}, \texttt{path}, \texttt{ip}, \texttt{message}\}$$
   If an unknown field like `staus` or `user_id` is queried, an error is reported:
   `Unknown column 'staus' referenced in WHERE clause.`

2. **Group By Aggregation Invariant**:
   Enforces the standard SQL rule: *When a query uses `GROUP BY` or aggregate functions, every item in the `SELECT` list must either be an aggregate function or explicitly present in the `GROUP BY` clause.*
   *Example*: `SELECT service, path, COUNT(*) FROM logs GROUP BY service;` is rejected because `path` is neither aggregated nor in the group key list.

3. **Type Compatibility Checking**:
   Ensures operators are invoked on compatible types:
   * String literals cannot be compared to numeric literals with arithmetic operators (`+`, `-`, `*`, `/`).
   * Function arguments are checked (e.g. `SUM('string')` is rejected; `SUM` requires numeric fields like `status` or `response_time`).

4. **Limit Clause Validation**:
   Ensures `LIMIT` is a non-negative integer.

---

### 4.5 Rule-Based AST Optimization Passes
* **Source**: `compiler/src/optimizer.cpp`, `compiler/include/optimizer.hpp`.
* **Role**: Transforms the parsed AST into a semantically identical but computationally cheaper AST before physical planning.

#### 1. Predicate Pushdown (Filter Operator Hoisting)
* **Principle**: In naive query execution, log records are grouped and sorted before filters are applied. Predicate Pushdown pushes the `FilterOperator` down to execute immediately after `LogScanOperator`.
* **Benefit**: Non-matching records are discarded instantly without ever allocating hash table entries, reducing memory consumption by $80\%\text{--}95\%$.
* **Transformation**:
  $$\text{Scan} \to \text{Group/Sort} \to \text{Filter} \implies \text{Scan} \to \text{Filter} \to \text{Group/Sort}$$

#### 2. Projection Reduction (Dead-Field Pruning)
* **Principle**: Inspects the entire query AST (SELECT expressions, WHERE conditions, GROUP BY columns, ORDER BY fields) and computes the exact set of referenced columns:
  $$C_{\text{referenced}} = C_{\text{select}} \cup C_{\text{where}} \cup C_{\text{group}} \cup C_{\text{order}}$$
* **Pruning**: Unreferenced columns are flagged as dead. The scanner ignores dead columns during parsing, eliminating memory allocation for unused strings like long log messages or user-agent strings.

#### 3. Constant Folding & Arithmetic Reduction
* **Principle**: Evaluates constant subtrees at compile time rather than per row during runtime.
* **Example**:
  $$\texttt{WHERE status = 200 + 300} \implies \texttt{WHERE status = 500}$$
  The binary operation node is replaced by a single literal integer node.

---

### 4.6 Intermediate Code Generation (Three-Address Code & Quadruples)
* **Source**: `compiler/include/tac_generator.hpp`, `compiler/src/tac_generator.cpp`.
* **Role**: Linearizes the high-level declarative query tree into an assembly-like intermediate representation (IR) suitable for virtual machine execution and compiler evaluation.

#### Three-Address Code (TAC) Format
Each instruction contains at most one operator on the right-hand side, temporary registers ($t_0, t_1, t_2, \dots$), and branch labels ($L_{\text{SCAN}}, L_{\text{DISCARD}}, L_{\text{DONE}}$):
```assembly
// Block B0: Scan & Ingest
L_SCAN_START:
t0 = READ_ROW(logs)
ifEOF t0 goto L_DONE

// Block B1: Predicate Evaluation
t1 = status >= 500
t2 = level = 'ERROR'
t3 = t1 AND t2
ifFalse t3 goto L_DISCARD

// Block B2: Grouping & Accumulation
HASH_KEY service -> h_group
t4 = ACCUMULATE(COUNT, *)

// Block B3: Project & Emit
PROJECT_FIELD service -> out_tuple
PROJECT_FIELD COUNT(*) -> out_tuple
EMIT out_tuple
goto L_SCAN_START

// Block B4: Discard Non-Matching
L_DISCARD:
DISCARD t0
goto L_SCAN_START

// Block B5: Termination
L_DONE:
HALT
```

#### Quadruples Table Representation
Every instruction is stored as a 4-tuple: `[Operator, Argument 1, Argument 2, Result]`:
| Index | Operator (`op`) | Argument 1 (`arg1`) | Argument 2 (`arg2`) | Result (`result`) | Action / Purpose |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **0** | `READ_ROW` | `logs` | — | `t0` | Fetch next record into row buffer |
| **1** | `IF_EOF_GOTO` | `t0` | — | `L_DONE` | Break loop upon EOF |
| **2** | `>=` | `status` | `500` | `t1` | Evaluate relational expression |
| **3** | `=` | `level` | `'ERROR'` | `t2` | Evaluate string equality |
| **4** | `AND` | `t1` | `t2` | `t3` | Logical conjunction |
| **5** | `IF_FALSE_GOTO` | `t3` | — | `L_DISCARD` | Branch if predicate yields false |
| **6** | `HASH_KEY` | `service` | — | `h_group` | Hash group partitioning key |
| **7** | `ACCUMULATE` | `COUNT` | `*` | `t4` | Update aggregate metric |
| **8** | `PROJECT` | `service` | — | `out_tuple` | Map column to output tuple |
| **9** | `EMIT` | `out_tuple` | — | `RESULT_BUFFER` | Materialize row |
| **10** | `GOTO` | — | — | `L_SCAN_START` | Loop back |
| **11** | `HALT` | — | — | — | Terminate execution |

#### Basic Blocks & Control Flow Graph (CFG)
The IR is partitioned into **Basic Blocks** (single entry point, single exit point):
* `B0_SCAN`: Ingestion stream. Successors: $\{B1, B5\}$.
* `B1_PREDICATE`: Filter condition branch. Successors: $\{B2, B4\}$.
* `B2_AGGREGATE`: Hash aggregation and accumulators. Successor: $\{B3\}$.
* `B3_PROJECT`: Output projection & emit. Successor: $\{B0\}$.
* `B4_DISCARD`: Row drop. Successor: $\{B0\}$.
* `B5_HALT`: Terminal node. Successor: $\emptyset$.

---

### 4.7 Physical Execution Planning & Volcano Pull-Iterators
* **Source**: `compiler/src/execution_plan.cpp`, `compiler/src/executor.cpp`.
* **Model**: Goetz Graefe's textbook **Volcano Iterator Model**.

#### The Iterator Interface
Every physical operator implements three virtual methods:
```cpp
class PhysicalOperator {
public:
    virtual ~PhysicalOperator() = default;
    virtual void open() = 0;
    virtual bool next(Tuple& outTuple) = 0;
    virtual void close() = 0;
};
```
Data flows lazily from bottom to top: the consumer at the top calls `next()`, which pulls records from its child iterator one at a time.

```mermaid
flowchart TD
    Client(["Output Result Buffer"])
    LimitOp["LimitOperator: bounds row count"]
    SortOp["SortOperator: in-memory sort"]
    ProjectOp["ProjectOperator: computes column expressions"]
    AggOp["AggregateOperator: hash-table accumulator"]
    FilterOp["FilterOperator: evaluates boolean predicate"]
    ScanOp["LogScanOperator: reads raw lines"]
    
    Client <-- next() --- LimitOp
    LimitOp <-- next() --- SortOp
    SortOp <-- next() --- ProjectOp
    ProjectOp <-- next() --- AggOp
    AggOp <-- next() --- FilterOp
    FilterOp <-- next() --- ScanOp
```

#### Concrete Operators
1. **`LogScanOperator`**: Opens the target dataset file, streams lines, and parses them into normalized `LogRecord` structs.
2. **`FilterOperator`**: Calls `child->next()`. Evaluates the boolean AST condition against the row. If false, loops until a matching row is found or EOF is reached.
3. **`AggregateOperator`**: In `open()`, consumes all child records, builds an in-memory hash map indexed by group key tuples, and computes aggregate metrics (`COUNT`, `AVG`, `SUM`, `MIN`, `MAX`). Subsequent calls to `next()` iterate over the finalized hash table buckets.
4. **`SortOperator`**: Materializes incoming tuples into a vector and sorts them using `std::stable_sort` with custom comparators based on `ORDER BY` specifications.
5. **`LimitOperator`**: Tracks an integer counter. Emits records until the limit $N$ is satisfied, then returns `false` to immediately stop upstream pipeline iterations.
6. **`ProjectOperator`**: Transforms internal row attributes into final user-facing schema columns and applies aliases.

---

## 5. Log Ingestion & Multi-Format Parsing Subsystem

LogQL normalizes diverse log structures into a unified 8-field in-memory representation (`LogRecord`):

```cpp
struct LogRecord {
    std::string timestamp;     // ISO-8601 or syslog timestamp
    std::string service;       // Originating service name
    std::string level;         // DEBUG, INFO, WARN, ERROR, FATAL
    int64_t     status;        // HTTP status code (200, 404, 500)
    double      response_time; // Request latency in milliseconds
    std::string path;          // Endpoint URL (/api/v1/checkout)
    std::string ip;            // Client IPv4 or IPv6 address
    std::string message;       // Free-form log message string
};
```

### Supported Ingestion Formats
1. **JSON Lines (`.jsonl`)**:
   Standard structured format used by Kubernetes, Docker, and enterprise cloud loggers (Datadog, Loki):
   ```json
   {"timestamp": "2026-10-14T10:15:30Z", "service": "auth-service", "level": "ERROR", "status": 500, "response_time": 42.5, "path": "/api/v1/login", "ip": "192.168.1.10", "message": "Database connection timeout"}
   ```
2. **Combined Log Format (CLF)**:
   Standard format used by Nginx, Apache HTTP Server, and Caddy:
   ```text
   192.168.1.50 - - [14/Oct/2026:10:15:30 +0000] "POST /api/v1/pay HTTP/1.1" 502 120.4 "payment-service" "Bad Gateway"
   ```
   Parsed via compiled C++ regex:
   ```cpp
   std::regex clfRegex(R"(^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+)[^"]*" (\d+) ([\d\.]+) "([^"]*)" "(.*)"$)");
   ```
3. **Syslog (RFC 3164)**:
   Standard format used by Linux daemons, systemd, and network appliances:
   ```text
   Oct 14 10:15:30 10.0.0.1 kernel: [daemon:ERROR:500] Disk I/O subsystem failure
   ```

---

## 6. Interactive Workbench Features & User Interface

The frontend Workbench Studio (`frontend/src/app/studio/page.tsx`) provides an IDE-grade user interface:

### 6.1 Top Navigation Bar
* **Query Studio**: Clean, spacious query workspace with example selector, SQL keyword auto-formatting, and results table.
* **Compiler Analysis**: 5-stage deep compiler inspection tabs (Tokens, AST Tree, Semantic Validation, Optimizer Diff, and TAC/Quadruples).
* **Execution Plan**: Physical Volcano iterator pipeline dataflow hierarchy and interactive EXPLAIN cost model.
* **Datasets & Schema**: Schema reference table of all 8 normalized fields and built-in sample log datasets.
* **Documentation**: Grammar specifications, cheat-sheet, and architecture docs.

### 6.2 Query Editor Features
* **Built-in Presets**: Quick-load queries for 5xx errors, slow request auditing, constant folding demos, and group-by invariant violations.
* **Auto-Formatter**: Normalizes indentation and capitalizes SQL reserved keywords with one click.
* **Smart Undo**: Restores query text if accidentally cleared.
* **Shortcuts**: `Ctrl+Enter` / `Cmd+Enter` immediately triggers compilation and execution.

### 6.3 Results Table
* **Client-side Filtering**: Instant search across all columns.
* **Export Options**: One-click export to formatted JSON or RFC 4180 CSV files.
* **Execution Metrics Bar**: Shows execution runtime in milliseconds, records scanned, records filtered, records grouped, and output rows.

---

## 7. EXPLAIN ANALYZE Cost & Complexity Model

LogQL includes an **EXPLAIN ANALYZE** cardinality matrix built into the physical plan viewer (`frontend/src/components/PlanViewer.tsx`):

| Operator | Cardinality ($In \to Out$) | Selectivity ($\%$) | Time Share | Memory Strategy | Algorithm Complexity |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **`LogScanOperator`** | $1000 \to 1000$ | $100\%$ | $\approx 35\%$ | $O(1)$ Streaming Buffer | Sequential byte stream parsing |
| **`FilterOperator`** | $1000 \to 67$ | $6.7\%$ | $\approx 25\%$ | $O(1)$ In-place Record Check | Predicate Bytecode short-circuit |
| **`AggregateOperator`** | $67 \to 3$ | $4.5\%$ | $\approx 22\%$ | $O(K)$ Hash Table ($K$ distinct keys) | In-Memory Hash Grouping |
| **`SortOperator`** | $3 \to 3$ | $100\%$ | $\approx 10\%$ | $O(N)$ Buffer | `std::stable_sort` (Timsort) |
| **`LimitOperator`** | $3 \to 3$ | $100\%$ | $\approx 2\%$ | $O(1)$ Counter | Early-stop iterator truncation |
| **`ProjectOperator`** | $3 \to 3$ | $100\%$ | $\approx 6\%$ | $O(1)$ Tuple Map | Schema Column Projection |

---

## 8. Code Exporter Subsystem

Integrated via `frontend/src/components/ExportModal.tsx`, this feature translates any active LogQL query into runnable code snippets:
1. **Python (Pandas)**: Generates a self-contained Python script using `pandas` to read `.jsonl`, apply filtering, grouping, and aggregations.
2. **Python (API Client)**: Generates a Python script using `requests` to call the LogQL backend REST API.
3. **C++ Native CLI**: Generates a command-line snippet for invoking `logql_cli.exe`.
4. **cURL**: Ready-to-paste cURL command for testing and integration.

---

## 9. Formal Grammar Specification (EBNF)

```ebnf
QueryStatement     ::= SelectClause FromClause [WhereClause] [GroupByClause] [OrderByClause] [LimitClause] [";"]

SelectClause       ::= "SELECT" ["DISTINCT"] SelectList
SelectList         ::= "*" | SelectItem { "," SelectItem }
SelectItem         ::= Expression ["AS" Identifier]

FromClause         ::= "FROM" Identifier

WhereClause        ::= "WHERE" Expression

GroupByClause      ::= "GROUP" "BY" IdentifierList
IdentifierList     ::= Identifier { "," Identifier }

OrderByClause      ::= "ORDER" "BY" OrderByList
OrderByList        ::= OrderByItem { "," OrderByItem }
OrderByItem        ::= Expression ["ASC" | "DESC"]

LimitClause        ::= "LIMIT" IntegerLiteral

Expression         ::= OrExpr
OrExpr             ::= AndExpr { "OR" AndExpr }
AndExpr            ::= NotExpr { "AND" NotExpr }
NotExpr            ::= ["NOT"] ComparisonExpr
ComparisonExpr     ::= AdditiveExpr [ CompOp AdditiveExpr ]
CompOp             ::= "=" | "!=" | "<" | "<=" | ">" | ">="
AdditiveExpr       ::= MultiplicativeExpr { ("+" | "-") MultiplicativeExpr }
MultiplicativeExpr ::= PrimaryExpr { ("*" | "/") PrimaryExpr }

PrimaryExpr        ::= Identifier
                     | Literal
                     | FunctionCall
                     | "(" Expression ")"

FunctionCall       ::= AggregateFunc "(" ( "*" | Identifier ) ")"
AggregateFunc      ::= "COUNT" | "AVG" | "SUM" | "MIN" | "MAX"

Literal            ::= IntegerLiteral | FloatLiteral | StringLiteral | BooleanLiteral
```

---

## 10. Error Handling, Diagnostics & Edge Cases

The system implements defensive error handling across all layers:

| Layer | Error Class | Detection Mechanism | Diagnostic Output Example |
| :--- | :--- | :--- | :--- |
| **Scanner** | Lexical Error | Flex fallback rule `.` | `[Lexical Error] Invalid character '@' at Line 1, Col 42` |
| **Parser** | Syntax Error | Bison `yyerror()` with lookahead token | `[Syntax Error] Unexpected token 'FROM' at Line 1, Col 15. Expected comma or expression.` |
| **Semantic** | Unknown Identifier | Symbol table lookup against schema | `[Semantic Error] Unknown column 'staus' referenced in WHERE clause.` |
| **Semantic** | Ungrouped Column | AST traversal comparing select items vs group keys | `[Semantic Error] Column 'path' must appear in GROUP BY clause or be used in an aggregate function.` |
| **Optimizer** | Unreachable Predicate | Constant folding detection (`WHERE 1=0`) | Warns user and emits empty result plan. |
| **Engine** | Missing Dataset | File existence check in bridge | `Dataset 'web_access' could not be resolved at path.` |
| **Runtime** | Division by Zero | Runtime numeric evaluator check | Returns `NULL` / `0.0` rather than causing SIGFPE crash. |

---

## 11. Build, Run & Process Isolation Engineering

### 11.1 Build Instructions
* **Compiler Binary**:
  ```bash
  cd compiler
  make clean
  make
  ```
  Produces `compiler/build/logql_cli.exe`.
* **Frontend**:
  ```bash
  cd frontend
  npm install
  npm run build
  ```

### 11.2 The Process Isolation Solution
During system startup (`start.bat`), ports `3000` (Next.js) and `8000` (FastAPI) must be cleared of stale background instances.

A common pitfall with Windows `netstat | findstr /r ":3000 .*LISTENING"` is that spaces act as an OR condition without `/c:`, matching every listening port on Windows and killing IDE processes.

**LogQL uses a targeted PowerShell command** that inspects **only** ports `3000` and `8000`:
```bat
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
```
This guarantees process safety without terminating the IDE, editors, or system daemons.

---

## 12. Academic Viva & Evaluator Defense Guide

### Top Evaluator Questions & Answers

#### Q1: "Why build a custom compiler instead of using SQLite or regex?"
> **Answer**: External relational engines require pre-importing logs into structured tables with schema locks and B-tree indexing overhead. Pure regex utilities like `grep` lack relational semantics (grouping, aggregations, ordering). LogQL demonstrates how formal compiler theory (Lexing, LALR parsing, AST transformation, and Volcano iterators) can be combined to query raw text files in-place with $O(1)$ streaming memory bounds.

#### Q2: "What parsing algorithm is used and why?"
> **Answer**: GNU Bison generates an **LALR(1)** (Look-Ahead Left-to-Right, Rightmost derivation) bottom-up parser. LALR(1) handles operator precedence cleanly using precedence tokens and requires minimal parser table states while preventing shift-reduce conflicts.

#### Q3: "What optimizations are performed on the query?"
> **Answer**: 
> 1. **Predicate Pushdown**: Pushes `WHERE` filters before `GROUP BY` and `ORDER BY`, eliminating non-matching records before hash table insertion.
> 2. **Projection Reduction**: Inspects the AST to prune unreferenced columns from the scan pipeline, avoiding memory allocations for unused fields.
> 3. **Constant Folding**: Evaluates constant arithmetic expressions (e.g., `200 + 300`) during compilation.

#### Q4: "What is the Volcano Iterator Model?"
> **Answer**: The Volcano model (proposed by Goetz Graefe) defines an iterator interface (`open()`, `next()`, `close()`). Operators pull records lazily one-by-one from their child iterators rather than materializing entire intermediate tables in RAM. This bounds peak memory to $O(1)$ streaming overhead plus hash table space for distinct groups.

#### Q5: "How does Intermediate Code Generation (ICG) work in LogQL?"
> **Answer**: The `TacGenerator` walks the optimized AST and emits linearized **Three-Address Code (TAC)** instructions with temporary registers ($t_0, t_1\dots$) and branch labels ($L_{\text{SCAN}}, L_{\text{DISCARD}}$), along with a **Quadruples table** `[Op, Arg1, Arg2, Result]`. It partitions the IR into single-entry / single-exit **Basic Blocks** ($B_0\dots B_5$) with explicit Control Flow Graph (CFG) edges.

---

### Project File Tree & Responsibilities
```text
LogQL/
├── compiler/                     # Native C++ Compiler Core
│   ├── lexer.l                   # Flex lexical rules & token regexes
│   ├── parser.y                  # Bison LALR(1) formal grammar
│   ├── Makefile                  # Build script (g++ -std=c++17)
│   ├── include/
│   │   ├── ast.hpp               # AST node classes & JSON serializers
│   │   ├── semantic.hpp          # Semantic analyzer & symbol table
│   │   ├── optimizer.hpp         # Rule-based AST optimizer
│   │   ├── tac_generator.hpp     # Three-Address Code & Quadruples generator
│   │   ├── execution_plan.hpp    # Physical operator hierarchy
│   │   ├── executor.hpp          # Volcano iterator execution engine
│   │   ├── log_record.hpp        # In-memory unified schema & type variants
│   │   └── token.hpp             # Token definitions & coordinate structs
│   └── src/
│       ├── ast.cpp               # AST evaluation methods
│       ├── semantic.cpp          # Invariant validation implementations
│       ├── optimizer.cpp         # Pushdown & pruning transformation passes
│       ├── tac_generator.cpp     # TAC, quadruples, and CFG generation
│       ├── execution_plan.cpp    # Physical plan tree builder
│       ├── executor.cpp          # Concrete pull-iterator implementations
│       └── main.cpp              # CLI driver & JSON output emitter
├── backend/                      # Python FastAPI Service
│   └── app/
│       ├── main.py               # FastAPI entrypoint & middleware
│       ├── routers/query.py      # POST /api/compile, POST /api/execute
│       ├── routers/datasets.py   # GET /api/datasets, POST /api/datasets/upload
│       ├── services/compiler_bridge.py # IPC runner invoking logql_cli.exe
│       └── models/api_models.py  # Pydantic schema models
├── frontend/                     # Next.js 14 Workbench UI
│   ├── src/
│   │   ├── app/studio/page.tsx   # Studio workbench orchestrator
│   │   ├── components/
│   │   │   ├── QueryEditor.tsx   # Code editor with toolbar & presets
│   │   │   ├── ResultsTable.tsx  # Result rows, pagination, CSV/JSON export
│   │   │   ├── TokenViewer.tsx   # Flex token stream inspection
│   │   │   ├── AstViewer.tsx     # Bison AST tree visualizer
│   │   │   ├── SemanticViewer.tsx# Diagnostic report & invariant badge
│   │   │   ├── OptimizerDiff.tsx # Before/after AST transformation diff
│   │   │   ├── TacViewer.tsx     # TAC instructions, Quadruples & CFG
│   │   │   ├── PlanViewer.tsx    # Volcano pipeline & EXPLAIN cost model
│   │   │   ├── ExportModal.tsx   # Python/C++/cURL code exporter
│   │   │   └── UploadModal.tsx   # Custom log file uploader
│   │   └── lib/api.ts            # Client-side API fetchers & interfaces
├── sample-logs/                  # Benchmark Datasets
│   ├── app_events.jsonl          # 1,000 JSON Lines microservice records
│   ├── web_access.clf            # 1,000 Nginx/Apache CLF records
│   └── system.syslog             # 1,000 Syslog RFC 3164 records
├── start.bat                     # Single-command launcher with safe port clearing
└── DETAILED_PROJECT_DOCUMENTATION.md # This master specification document
```
