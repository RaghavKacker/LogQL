import React, { useState } from "react";
import { Cpu, Zap, Minimize2, Filter, Layers, CheckCircle2 } from "lucide-react";
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
      <div className="p-16 text-center text-ide-muted font-mono text-xs border border-dashed border-ide-border rounded-lg">
        <p className="text-sm font-semibold text-ide-text mb-1">No optimizer passes applied</p>
        <p className="text-ide-subtle text-xs">
          Query is already in minimal form, or contains no reducible constant expressions or redundant predicates.
        </p>
        <p className="text-ide-subtle text-xs mt-2">
          Tip: Try a query like <code className="bg-ide-surface px-1.5 py-0.5 rounded text-ide-text">WHERE status = 200 + 300 AND status = 500</code> to trigger Constant Folding and Deduplication!
        </p>
      </div>
    );
  }

  const getRuleIcon = (rule: string) => {
    switch (rule) {
      case "ConstantFolding":
        return <Zap size={14} className="text-amber-400" />;
      case "DuplicatePredicateElimination":
        return <Minimize2 size={14} className="text-blue-400" />;
      case "PredicatePushdown":
        return <Filter size={14} className="text-purple-400" />;
      case "ProjectionReduction":
        return <Layers size={14} className="text-emerald-400" />;
      default:
        return <Cpu size={14} className="text-ide-muted" />;
    }
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ide-border pb-2.5 text-ide-muted text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-ide-subtle">Optimizer:</span>
          <code className="text-ide-text bg-ide-surface px-2 py-0.5 rounded border border-ide-border font-medium">
            compiler/src/optimizer.cpp
          </code>
          <span className="text-ide-subtle">({optimizations.length} rule passes applied)</span>
        </div>
        <div className="flex items-center gap-1.5 bg-ide-bg border border-ide-border rounded p-0.5">
          <button
            onClick={() => setViewMode("passes")}
            className={`px-2.5 py-0.5 rounded text-xs font-medium transition ${
              viewMode === "passes"
                ? "bg-ide-surface text-ide-text shadow-sm"
                : "text-ide-subtle hover:text-white"
            }`}
          >
            Transformation Passes ({optimizations.length})
          </button>
          <button
            onClick={() => setViewMode("astDiff")}
            className={`px-2.5 py-0.5 rounded text-xs font-medium transition ${
              viewMode === "astDiff"
                ? "bg-ide-surface text-ide-text shadow-sm"
                : "text-ide-subtle hover:text-white"
            }`}
          >
            Side-by-Side AST
          </button>
        </div>
      </div>

      {viewMode === "passes" ? (
        <div className="space-y-3">
          {optimizations.map((opt, idx) => (
            <div
              key={idx}
              className="bg-ide-panel border border-ide-border rounded-lg p-3.5 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-ide-border/60 pb-2">
                <div className="flex items-center gap-2.5">
                  <span className="p-1 rounded bg-ide-surface border border-ide-border">
                    {getRuleIcon(opt.rule)}
                  </span>
                  <div>
                    <span className="font-semibold text-ide-text text-xs">{opt.rule}</span>
                    <span className="text-ide-muted text-xs ml-2 font-sans">{opt.description}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-ide-surface border border-ide-border text-ide-muted font-medium">
                  Pass {idx + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-ide-bg border border-ide-border rounded-lg p-3">
                  <div className="text-[10px] uppercase font-semibold text-rose-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Before Transformation
                  </div>
                  <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                    {opt.before}
                  </pre>
                </div>

                <div className="bg-ide-bg border border-ide-border rounded-lg p-3">
                  <div className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> After Transformation
                  </div>
                  <pre className="text-xs text-emerald-300 font-medium overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
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
            <div className="text-xs font-medium text-ide-muted uppercase tracking-wider flex items-center justify-between">
              <span>Parser AST (Before)</span>
              <span className="text-[10px] text-ide-subtle font-normal">Pre-Optimization</span>
            </div>
            <pre className="bg-ide-bg border border-ide-border rounded-lg p-3 text-xs text-slate-300 max-h-[calc(100vh-390px)] min-h-[180px] overflow-y-auto leading-relaxed shadow-sm font-mono">
              {JSON.stringify(originalAst, null, 2)}
            </pre>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>Optimized AST (After)</span>
              <span className="text-[10px] text-emerald-400/80 font-normal">Post-Transformation</span>
            </div>
            <pre className="bg-ide-bg border border-emerald-900/50 rounded-lg p-3 text-xs text-emerald-300 max-h-[calc(100vh-390px)] min-h-[180px] overflow-y-auto leading-relaxed shadow-sm font-mono">
              {JSON.stringify(optimizedAst, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
