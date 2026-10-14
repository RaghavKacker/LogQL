import React from "react";
import Link from "next/link";
import { ArrowLeft, Terminal, Cpu, GitBranch, ShieldCheck, Zap, Network } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-ide-bg text-ide-text font-sans">
      <header className="h-11 bg-ide-sidebar border-b border-ide-border px-4 flex items-center justify-between select-none text-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-ide-muted hover:text-white transition font-medium"
          >
            <ArrowLeft size={14} /> Back to Query Workbench
          </Link>
          <div className="h-3 w-px bg-ide-border" />
          <span className="font-mono font-semibold text-white">
            LogQL Documentation & Compiler Pipeline
          </span>
        </div>
        <div className="text-[11px] font-mono text-ide-subtle hidden sm:block">
          B.Tech Computer Science &bull; Compiler Design
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6 text-xs leading-relaxed">
        <section className="bg-ide-panel border border-ide-border rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-ide-text font-mono font-semibold text-sm">
            <Cpu size={16} className="text-ide-muted" />
            <h2>System Overview</h2>
          </div>
          <p className="text-ide-muted text-xs leading-relaxed">
            <strong className="text-white font-semibold">LogQL</strong> is a domain-specific query compiler and execution engine implemented in C++17 with Flex and Bison. It parses declarative, SQL-like queries over semi-structured server logs, performs static type verification and aggregation validation, executes 4 rule-based AST optimization passes (Constant Folding, Duplicate Predicate Elimination, Predicate Pushdown, and Projection Reduction), and evaluates queries using a Volcano pull-iterator pipeline.
          </p>
        </section>

        <section className="bg-ide-panel border border-ide-border rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-ide-text font-mono font-semibold text-sm">
            <Terminal size={16} className="text-blue-400" />
            <h2>1. Lexical Analysis (Flex Scanner)</h2>
          </div>
          <p className="text-ide-subtle font-mono text-[11px]">
            Source: <code className="text-ide-muted">compiler/lexer.l</code>
          </p>
          <p className="text-ide-muted text-xs leading-relaxed">
            The scanner uses deterministic finite automata (DFA) patterns to tokenize queries into typed tokens: keywords (<code className="text-token-keyword font-mono">SELECT</code>, <code className="text-token-keyword font-mono">FROM</code>, <code className="text-token-keyword font-mono">WHERE</code>, <code className="text-token-keyword font-mono">GROUP BY</code>, <code className="text-token-keyword font-mono">ORDER BY</code>, <code className="text-token-keyword font-mono">LIMIT</code>), identifiers, numeric and string literals, and operators. Every token records line and column coordinates for accurate compiler error diagnostics.
          </p>
        </section>

        <section className="bg-ide-panel border border-ide-border rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-ide-text font-mono font-semibold text-sm">
            <GitBranch size={16} className="text-purple-400" />
            <h2>2. Syntax Analysis & Context-Free Grammar (Bison LALR(1))</h2>
          </div>
          <p className="text-ide-subtle font-mono text-[11px]">
            Source: <code className="text-ide-muted">compiler/parser.y</code> & <code className="text-ide-muted">compiler/include/ast.hpp</code>
          </p>
          <p className="text-ide-muted text-xs leading-relaxed">
            The parser implements an unambiguous <strong className="text-white">LALR(1) Context-Free Grammar</strong> without shift/reduce or reduce/reduce conflicts. It produces an Abstract Syntax Tree (AST) rooted at <code className="text-purple-300 font-mono">QueryNode</code>:
          </p>
          <ul className="list-disc list-inside text-ide-muted space-y-1 font-mono text-[11px] pl-2">
            <li><code className="text-white">selectList</code>: Column projections, aliases, and aggregate function calls (<code className="text-token-func">COUNT, AVG, SUM, MIN, MAX</code>)</li>
            <li><code className="text-white">fromTable</code>: Target log stream identifier</li>
            <li><code className="text-white">whereClause</code>: Hierarchical boolean/relational expression tree</li>
            <li><code className="text-white">groupByCols</code>: Grouping column identifiers</li>
            <li><code className="text-white">orderByClause</code>: Sorting expressions and direction (<code className="text-token-keyword">ASC / DESC</code>)</li>
            <li><code className="text-white">limitCount</code>: Row limit pagination integer</li>
          </ul>
        </section>

        <section className="bg-ide-panel border border-ide-border rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-ide-text font-mono font-semibold text-sm">
            <ShieldCheck size={16} className="text-emerald-400" />
            <h2>3. Semantic Analysis & Type System</h2>
          </div>
          <p className="text-ide-subtle font-mono text-[11px]">
            Source: <code className="text-ide-muted">compiler/src/semantic.cpp</code>
          </p>
          <p className="text-ide-muted text-xs leading-relaxed">
            The semantic checker enforces semantic constraints before planning:
          </p>
          <ol className="list-decimal list-inside text-ide-muted space-y-1 font-mono text-[11px] pl-2">
            <li><strong>Schema Verification:</strong> All column identifiers must exist in the normalized schema (<code className="text-slate-300">timestamp, service, level, status, response_time, path, ip, message</code>).</li>
            <li><strong>Type Consistency:</strong> Numeric comparisons are restricted to numeric fields; strings require string literals.</li>
            <li><strong>GROUP BY Invariant:</strong> In aggregated queries, all scalar columns in the SELECT list must appear in the GROUP BY clause.</li>
            <li><strong>Aggregate Validity:</strong> Disallows illegal nesting (e.g. <code className="text-rose-400">COUNT(AVG(x))</code>).</li>
          </ol>
        </section>

        <section className="bg-ide-panel border border-ide-border rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-ide-text font-mono font-semibold text-sm">
            <Zap size={16} className="text-amber-400" />
            <h2>4. Rule-Based Query Optimization Passes</h2>
          </div>
          <p className="text-ide-subtle font-mono text-[11px]">
            Source: <code className="text-ide-muted">compiler/src/optimizer.cpp</code>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
            <div className="bg-ide-bg border border-ide-border rounded p-3 space-y-1">
              <span className="text-white font-semibold">1. Constant Folding</span>
              <p className="text-ide-muted font-sans text-xs">
                Evaluates static expressions at compile time (e.g. <code className="text-amber-300">200 + 300</code> &rarr; <code className="text-emerald-300">500</code>).
              </p>
            </div>
            <div className="bg-ide-bg border border-ide-border rounded p-3 space-y-1">
              <span className="text-white font-semibold">2. Duplicate Predicate Elimination</span>
              <p className="text-ide-muted font-sans text-xs">
                Removes redundant terms in boolean conjunctions (e.g. <code className="text-amber-300">status = 500 AND status = 500</code> &rarr; <code className="text-emerald-300">status = 500</code>).
              </p>
            </div>
            <div className="bg-ide-bg border border-ide-border rounded p-3 space-y-1">
              <span className="text-white font-semibold">3. Predicate Pushdown</span>
              <p className="text-ide-muted font-sans text-xs">
                Schedules filter operators immediately after scan to prune non-matching tuples before aggregation or sorting.
              </p>
            </div>
            <div className="bg-ide-bg border border-ide-border rounded p-3 space-y-1">
              <span className="text-white font-semibold">4. Projection Reduction</span>
              <p className="text-ide-muted font-sans text-xs">
                Prunes unreferenced fields from records during scanning to eliminate unnecessary memory copying.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-ide-panel border border-ide-border rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-ide-text font-mono font-semibold text-sm">
            <Network size={16} className="text-sky-400" />
            <h2>5. Physical Execution Engine (Volcano Iterator Model)</h2>
          </div>
          <p className="text-ide-subtle font-mono text-[11px]">
            Source: <code className="text-ide-muted">compiler/src/executor.cpp</code>
          </p>
          <p className="text-ide-muted text-xs leading-relaxed">
            The physical planner converts the optimized AST into an operator pipeline implementing pull-based <code className="text-white font-mono">open()</code>, <code className="text-white font-mono">next()</code>, and <code className="text-white font-mono">close()</code> contracts:
          </p>
          <div className="bg-ide-bg border border-ide-border rounded p-3 font-mono text-[11px] text-ide-muted space-y-1">
            <div><span className="text-emerald-400 font-semibold">LimitOperator</span> &mdash; early termination once row limit is met</div>
            <div className="pl-4"><span className="text-sky-400 font-semibold">SortOperator</span> &mdash; multi-column in-memory ordering</div>
            <div className="pl-8"><span className="text-purple-400 font-semibold">ProjectOperator</span> &mdash; output column calculation & aliasing</div>
            <div className="pl-12"><span className="text-amber-400 font-semibold">AggregateOperator</span> &mdash; hash aggregation for COUNT, AVG, SUM, MIN, MAX</div>
            <div className="pl-16"><span className="text-rose-400 font-semibold">FilterOperator</span> &mdash; boolean expression evaluation</div>
            <div className="pl-20"><span className="text-blue-400 font-semibold">LogScanOperator</span> &mdash; normalized log record scanner</div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ide-border py-4 text-center text-xs text-ide-subtle font-mono">
        LogQL &bull; Compiler-Based Log Query &amp; Optimization Engine &bull; C++17
      </footer>
    </div>
  );
}
