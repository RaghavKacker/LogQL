import React, { useState } from "react";
import { Cpu, ArrowRight, Zap, Minimize2, Filter, Layers, CheckCircle2 } from "lucide-react";
import { OptimizationItem } from "@/lib/api";

interface OptimizerDiffProps {
  optimizations?: OptimizationItem[];
  originalAst?: any;
  optimizedAst?: any;
}

export const OptimizerDiff: React.FC<OptimizerDiffProps> = ({
  optimizations,
  originalAst,
  optimizedAst,
}) => {
  const [viewMode, setViewMode] = useState<"passes" | "astDiff">("passes");

  if (!optimizations || optimizations.length === 0) {
    return (
      <div className="p-12 text-center text-ide-subtle font-mono text-xs border border-dashed border-ide-border rounded">
        No query optimizations applied. All expressions are canonical, or query contains no reducible subtrees.
      </div>
    );
  }

  const getRuleIcon = (rule: string) => {
    switch (rule) {
      case "ConstantFolding":
        return <Zap size={13} className="text-amber-400" />;
      case "DuplicatePredicateElimination":
        return <Minimize2 size={13} className="text-status-info" />;
      case "PredicatePushdown":
        return <Filter size={13} className="text-indigo-400" />;
      case "ProjectionReduction":
        return <Layers size={13} className="text-status-success" />;
      default:
        return <Cpu size={13} className="text-ide-muted" />;
    }
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ide-border pb-3 text-ide-muted text-[11px]">
        <div className="flex items-center gap-2">
          <span>Optimization Engine:</span>
          <code className="text-status-info bg-ide-bg px-1.5 py-0.5 rounded border border-ide-border">
            compiler/src/optimizer.cpp
          </code>
          <span className="text-ide-subtle">({optimizations.length} rule passes executed)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("passes")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
              viewMode === "passes"
                ? "bg-ide-active text-white border border-ide-borderLight"
                : "bg-ide-bg text-ide-muted hover:text-white"
            }`}
          >
            Transformation Passes ({optimizations.length})
          </button>
          <button
            onClick={() => setViewMode("astDiff")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
              viewMode === "astDiff"
                ? "bg-ide-active text-white border border-ide-borderLight"
                : "bg-ide-bg text-ide-muted hover:text-white"
            }`}
          >
            Side-by-Side AST IR
          </button>
        </div>
      </div>

      {viewMode === "passes" ? (
        <div className="space-y-3">
          {optimizations.map((opt, idx) => (
            <div
              key={idx}
              className="bg-ide-card border border-ide-border rounded p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-ide-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-ide-bg border border-ide-border">
                    {getRuleIcon(opt.rule)}
                  </span>
                  <div>
                    <span className="font-semibold text-white text-xs">{opt.rule}</span>
                    <span className="text-ide-subtle text-[11px] ml-2 font-sans">{opt.description}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-ide-bg border border-ide-border text-ide-muted">
                  Pass {idx + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-ide-bg border border-rose-900/30 rounded p-2.5">
                  <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Before Transformation
                  </div>
                  <pre className="text-[11px] text-ide-muted overflow-x-auto whitespace-pre-wrap">
                    {opt.before}
                  </pre>
                </div>

                <div className="bg-ide-bg border border-emerald-900/30 rounded p-2.5">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> After Transformation
                  </div>
                  <pre className="text-[11px] text-emerald-300 font-semibold overflow-x-auto whitespace-pre-wrap">
                    {opt.after}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-ide-muted uppercase tracking-wider flex items-center justify-between">
              <span>Canonical Parser AST</span>
              <span className="text-[10px] text-ide-subtle font-normal">Pre-Optimization</span>
            </div>
            <pre className="bg-ide-bg border border-ide-border rounded p-3 text-[11px] text-ide-muted max-h-[500px] overflow-y-auto leading-relaxed">
              {JSON.stringify(originalAst, null, 2)}
            </pre>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-status-success uppercase tracking-wider flex items-center justify-between">
              <span>Optimized AST IR</span>
              <span className="text-[10px] text-emerald-500/70 font-normal">Post-Transformation</span>
            </div>
            <pre className="bg-ide-bg border border-emerald-900/30 rounded p-3 text-[11px] text-emerald-300 max-h-[500px] overflow-y-auto leading-relaxed">
              {JSON.stringify(optimizedAst, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
