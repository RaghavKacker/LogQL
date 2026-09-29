import React from "react";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Terminal,
  Zap,
  GitBranch,
  ShieldCheck,
  Cpu,
  Database,
  BarChart2,
  CheckCircle2
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col selection:bg-brand-indigo selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-dark-border bg-dark-panel/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-cyan text-white shadow-lg shadow-indigo-900/30">
            <Layers size={20} />
          </span>
          <div>
            <span className="font-mono text-lg font-bold tracking-tight text-white">LogQL</span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-brand-cyan ml-2 border border-brand-cyan/40 px-2 py-0.5 rounded-full">
              Compiler Core
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/studio"
            className="flex items-center gap-2 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-90 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-indigo-900/40 transition"
          >
            Launch Query Studio <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-card border border-dark-border text-xs font-mono text-gray-400">
          <Cpu size={14} className="text-brand-cyan" />
          <span>B.Tech Computer Science Compiler Design Mini Project</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          A Compiler-Based Log Query <br />
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-indigo-500 bg-clip-text text-transparent">
            & Rule-Based Optimization System
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-gray-400 text-sm sm:text-base leading-relaxed">
          LogQL implements a complete classical compiler pipeline from scratch using{" "}
          <strong className="text-gray-200">Flex (Lexer)</strong>,{" "}
          <strong className="text-gray-200">Bison (LALR Parser)</strong>, and{" "}
          <strong className="text-gray-200">C++17</strong> for AST construction, semantic type checking,
          algebraic AST optimizations, and Volcano-style query execution over server logs.
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <Link
            href="/studio"
            className="flex items-center gap-2 bg-brand-cyan hover:bg-cyan-400 text-gray-950 font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-cyan-900/30 transition"
          >
            Open Interactive Studio <ArrowRight size={16} />
          </Link>
          <a
            href="https://github.com/RaghavKacker/LogScan"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-dark-card hover:bg-dark-border border border-dark-border text-gray-300 hover:text-white font-medium text-sm px-5 py-3 rounded-xl transition"
          >
            <Terminal size={16} /> View GitHub Repository
          </a>
        </div>
      </header>

      {/* Compiler Stages Architecture Flow */}
      <section className="max-w-6xl mx-auto px-6 py-12 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-widest text-brand-cyan font-bold">
            The Compiler Pipeline
          </h2>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Transparent Multi-Stage Execution
          </h3>
          <p className="text-xs text-gray-400">
            Every query undergoes strict compilation through verified textbook compiler phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-6">
          <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex flex-col justify-between space-y-3">
            <div className="p-2 rounded-lg bg-dark-bg border border-dark-border w-fit text-brand-cyan">
              <Terminal size={18} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-gray-500 font-bold">Stage 1</div>
              <h4 className="text-sm font-bold text-white mt-0.5">Flex Lexer</h4>
              <p className="text-[11px] text-gray-400 mt-1">DFA pattern matching & line/col tracking</p>
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex flex-col justify-between space-y-3">
            <div className="p-2 rounded-lg bg-dark-bg border border-dark-border w-fit text-indigo-400">
              <GitBranch size={18} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-gray-500 font-bold">Stage 2</div>
              <h4 className="text-sm font-bold text-white mt-0.5">Bison Parser</h4>
              <p className="text-[11px] text-gray-400 mt-1">LALR(1) context-free grammar & AST construction</p>
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex flex-col justify-between space-y-3">
            <div className="p-2 rounded-lg bg-dark-bg border border-dark-border w-fit text-purple-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-gray-500 font-bold">Stage 3</div>
              <h4 className="text-sm font-bold text-white mt-0.5">Semantic Check</h4>
              <p className="text-[11px] text-gray-400 mt-1">Symbol table, type system & aggregation rules</p>
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex flex-col justify-between space-y-3">
            <div className="p-2 rounded-lg bg-dark-bg border border-dark-border w-fit text-amber-400">
              <Zap size={18} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-gray-500 font-bold">Stage 4</div>
              <h4 className="text-sm font-bold text-white mt-0.5">Optimizer</h4>
              <p className="text-[11px] text-gray-400 mt-1">Constant folding, pushdown & pruning</p>
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex flex-col justify-between space-y-3">
            <div className="p-2 rounded-lg bg-dark-bg border border-dark-border w-fit text-rose-400">
              <Cpu size={18} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-gray-500 font-bold">Stage 5</div>
              <h4 className="text-sm font-bold text-white mt-0.5">Physical Plan</h4>
              <p className="text-[11px] text-gray-400 mt-1">Volcano iterator operator pipeline</p>
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex flex-col justify-between space-y-3">
            <div className="p-2 rounded-lg bg-dark-bg border border-dark-border w-fit text-emerald-400">
              <BarChart2 size={18} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-gray-500 font-bold">Stage 6</div>
              <h4 className="text-sm font-bold text-white mt-0.5">Results & Charts</h4>
              <p className="text-[11px] text-gray-400 mt-1">Sub-millisecond rows and Recharts analytics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Code Example Preview */}
      <section className="max-w-4xl mx-auto px-6 py-8 w-full">
        <div className="bg-[#080d1a] border border-dark-border rounded-2xl p-6 font-mono text-xs shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-dark-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-gray-400 ml-2">demo_query.sql</span>
            </div>
            <span className="text-gray-500">LogQL Declarative Query</span>
          </div>

          <pre className="text-gray-300 leading-relaxed overflow-x-auto">
            <span className="text-indigo-400 font-bold">SELECT</span> service, <span className="text-amber-300">AVG</span>(response_time), <span className="text-amber-300">COUNT</span>(*){"\n"}
            <span className="text-indigo-400 font-bold">FROM</span> logs{"\n"}
            <span className="text-indigo-400 font-bold">WHERE</span> status = <span className="text-cyan-300">200 + 300</span> <span className="text-indigo-400 font-bold">AND</span> status &gt;= <span className="text-cyan-300">500</span>{"\n"}
            <span className="text-indigo-400 font-bold">GROUP BY</span> service{"\n"}
            <span className="text-indigo-400 font-bold">ORDER BY COUNT</span>(*) <span className="text-indigo-400 font-bold">DESC</span>{"\n"}
            <span className="text-indigo-400 font-bold">LIMIT</span> <span className="text-cyan-300">5</span>;
          </pre>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-dark-border py-6 text-center text-xs text-gray-500 font-mono">
        LogQL &bull; A Compiler-Based Log Query and Optimization System &bull; B.Tech Computer Science Compiler Design Project
      </footer>
    </div>
  );
}
