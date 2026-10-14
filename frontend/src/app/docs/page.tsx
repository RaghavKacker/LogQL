import React from "react";
import Link from "next/link";
import { ArrowLeft, Terminal, Cpu, GitBranch, ShieldCheck, Zap, Network, BookOpen, Layers } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-ide-bg text-ide-text font-sans">
      <header className="h-10 bg-ide-sidebar border-b border-ide-border px-4 flex items-center justify-between select-none text-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-ide-muted hover:text-white transition font-medium"
          >
            <ArrowLeft size={14} /> Back to Query Workbench
          </Link>
          <div className="h-3 w-px bg-ide-border" />
          <span className="font-mono font-bold text-white">
            LogQL Compiler Specification & Architecture
          </span>
        </div>
        <div className="text-[11px] font-mono text-ide-subtle">
          B.Tech Computer Science &bull; Compiler Design Mini Project
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8 text-xs leading-relaxed">
        <section className="bg-ide-panel border border-ide-border rounded p-5 space-y-3">
          <div className="flex items-center gap-2 text-status-info font-mono font-bold text-sm">
            <Cpu size={16} />
            <h2>System Overview</h2>
          </div>
          <p className="text-ide-muted">
            <strong className="text-white font-semibold">LogQL</strong> is a domain-specific compiler and query execution engine developed in C++17 with Flex and Bison. It parses SQL-like declarative queries over unstructured and structured server log files, validates types and schema invariants, performs multi-pass AST optimizations (constant folding, predicate pushdown, and duplicate elimination), and executes via a Volcano iterator model.
          </p>
        </section>

        <section className="bg-ide-panel border border-ide-border rounded p-5 space-y-3">
          <div className="flex items-center gap-2 text-status-info font-mono font-bold text-sm">
            <Terminal size={16} />
            <h2>1. Lexical Analysis (Flex Lexer)</h2>
          </div>
          <p className="text-ide-muted">
            Source: <code className="text-status-info font-mono">compiler/lexer.l</code>
          </p>
          <p className="text-ide-muted">
            The lexer uses deterministic finite automata (DFA) patterns to tokenize the query string into keywords (<code className="text-token-keyword font-mono">SELECT</code>, <code className="text-token-keyword font-mono">FROM</code>, <code className="text-token-keyword font-mono">WHERE</code>, <code className="text-token-keyword font-mono">GROUP BY</code>, <code className="text-token-keyword font-mono">ORDER BY</code>, <code className="text-token-keyword font-mono">LIMIT</code>), identifiers, numeric literals, string literals, and operators. Every token tracks its exact line and column coordinate (<code className="text-ide-subtle font-mono">L{'{line}'}:{'{col}'}</code>) for precise compiler diagnostics.
          </p>
        </section>

        <section className="bg-ide-panel border border-ide-border rounded p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#9b8cb8] font-mono font-bold text-sm">
            <GitBranch size={16} />
            <h2>2. Syntax Analysis & Context-Free Grammar (Bison LALR(1))</h2>
          </div>
          <p className="text-ide-muted">
            Source: <code className="text-[#9b8cb8] font-mono">compiler/parser.y</code> & <code className="text-[#9b8cb8] font-mono">compiler/include/ast.hpp</code>
          </p>
          <p className="text-ide-muted">
            The syntax parser implements an <strong className="text-white">LALR(1) Context-Free Grammar</strong> without shift/reduce or reduce/reduce conflicts. It constructs an Abstract Syntax Tree (AST) rooted at <code className="text-[#9b8cb8] font-mono">QueryNode</code> containing:
          </p>
          <ul className="list-disc list-inside text-ide-muted space-y-1 font-mono text-[11px] pl-2">
            <li><code className="text-white">selectList</code>: Projections, column identifiers, and aggregate function calls (<code className="text-token-func">COUNT</code>, <code className="text-token-func">AVG</code>, <code className="text-token-func">SUM</code>, <code className="text-token-func">MIN</code>, <code className="text-token-func">MAX</code>)</li>
            <li><code className="text-white">fromTable</code>: Target log dataset identifier</li>
            <li><code className="text-white">whereClause</code>: Boolean/Arithmetic expression tree (<code className="text-token-keyword">AND</code>, <code className="text-token-keyword">OR</code>, <code className="text-token-keyword">NOT</code>, comparisons, binary ops)</li>
            <li><code className="text-white">groupByCols</code>: Column grouping specifications</li>
            <li><code className="text-white">orderByClause</code>: Sorting expressions and direction (<code className="text-token-keyword">ASC</code> / <code className="text-token-keyword">DESC</code>)</li>
            <li><code className="text-white">limitCount</code>: Row limit pagination integer</li>
          </ul>
        </section>

        <section className="bg-ide-panel border border-ide-border rounded p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#72b192] font-mono font-bold text-sm">
            <ShieldCheck size={16} />
            <h2>3. Semantic Analysis & Type System</h2>
          </div>
          <p className="text-ide-muted">
            Source: <code className="text-[#72b192] font-mono">compiler/src/semantic.cpp</code>
          </p>
          <p className="text-ide-muted">
            Validates semantic invariants before code generation or optimization:
          </p>
          <ol className="list-decimal list-inside text-ide-muted space-y-1 font-mono text-[11px] pl-2">
            <li><strong>Schema Verification:</strong> Column identifiers must exist in the active dataset schema or be valid wildcards (<code className="text-token-keyword">*</code>).</li>
            <li><strong>Type Consistency:</strong> Arithmetic operators (+, -, *, /) and numeric comparisons (&gt;, &lt;, &gt;=, &lt;=) are restricted to numeric or string fields. Implicit float promotion is validated.</li>
            <li><strong>GROUP BY Invariant:</strong> When an aggregation is present with a <code className="text-token-keyword">GROUP BY</code> clause, all non-aggregated select list columns must explicitly appear in the group key list.</li>
            <li><strong>Aggregate Nesting:</strong> Disallows illegal nested aggregations such as <code className="text-[#db8686] font-mono">COUNT(AVG(status))</code>.</li>
          </ol>
        </section>

        <section className="bg-ide-panel border border-ide-border rounded p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#cfa058] font-mono font-bold text-sm">
            <Zap size={16} />
            <h2>4. Rule-Based Query Optimization Passes</h2>
          </div>
          <p className="text-ide-muted">
            Source: <code className="text-[#cfa058] font-mono">compiler/src/optimizer.cpp</code>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
            <div className="bg-ide-bg border border-ide-border rounded p-3 space-y-1">
              <span className="text-white font-bold">1. Constant Folding</span>
              <p className="text-ide-muted font-sans">
                Recursively evaluates static subtrees at compile-time (e.g. <code className="text-[#cfa058]">200 + 300</code> &rarr; <code className="text-[#72b192]">500</code>).
              </p>
            </div>
            <div className="bg-ide-bg border border-ide-border rounded p-3 space-y-1">
              <span className="text-white font-bold">2. Duplicate Predicate Elimination</span>
              <p className="text-ide-muted font-sans">
                Simplifies idempotent boolean terms in conjunctions (e.g. <code className="text-[#cfa058]">status = 500 AND status = 500</code> &rarr; <code className="text-[#72b192]">status = 500</code>).
              </p>
            </div>
            <div className="bg-ide-bg border border-ide-border rounded p-3 space-y-1">
              <span className="text-white font-bold">3. Predicate Pushdown</span>
              <p className="text-ide-muted font-sans">
                Moves filter evaluations below grouping and projection operations to prune rows as early as possible.
              </p>
            </div>
            <div className="bg-ide-bg border border-ide-border rounded p-3 space-y-1">
              <span className="text-white font-bold">4. Projection Reduction</span>
              <p className="text-ide-muted font-sans">
                Extracts the strict subset of schema columns referenced across the query to minimize memory allocation during disk scans.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-ide-panel border border-ide-border rounded p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#9b8cb8] font-mono font-bold text-sm">
            <Network size={16} />
            <h2>5. Physical Execution Engine (Volcano Iterator Model)</h2>
          </div>
          <p className="text-ide-muted">
            Source: <code className="text-[#9b8cb8] font-mono">compiler/src/executor.cpp</code>
          </p>
          <p className="text-ide-muted">
            The physical planner converts the optimized AST into a pipeline of pull-based iterators implementing the classical <code className="text-white font-mono">open()</code>, <code className="text-white font-mono">next()</code>, and <code className="text-white font-mono">close()</code> interface:
          </p>
          <div className="bg-ide-bg border border-ide-border rounded p-3 font-mono text-[11px] text-ide-muted space-y-1">
            <div><span className="text-[#9b8cb8]">LimitOperator</span> (row truncation & early stopping)</div>
            <div className="pl-4"><span className="text-[#8ea8c9]">SortOperator</span> (in-memory quicksort by comparator)</div>
            <div className="pl-8"><span className="text-[#7fa1c4]">ProjectOperator</span> (evaluates final column expressions)</div>
            <div className="pl-12"><span className="text-[#cfa058]">AggregateOperator</span> (hash-based grouping & accumulator evaluation)</div>
            <div className="pl-16"><span className="text-[#db8686]">FilterOperator</span> (evaluates boolean predicate on raw tuples)</div>
            <div className="pl-20"><span className="text-[#72b192]">LogScanOperator</span> (streams log records from memory/disk buffer)</div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ide-border py-4 text-center text-xs text-ide-subtle font-mono">
        LogQL &bull; A Compiler-Based Log Query and Optimization System &bull; C++17 Native Engine
      </footer>
    </div>
  );
}
