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
      <div className="p-16 text-center text-slate-400 font-mono text-xs border border-dashed border-ide-border rounded-lg">
        No query optimizations applied. All expressions are canonical, or query contains no reducible subtrees.
      </div>
    );
  }

  const getRuleIcon = (rule: string) => {
    switch (rule) {
      case "ConstantFolding":
        return <Zap size={15} className="text-[#cfa058]" />;
      case "DuplicatePredicateElimination":
        return <Minimize2 size={15} className="text-[#7fa1c4]" />;
      case "PredicatePushdown":
        return <Filter size={15} className="text-[#9b8cb8]" />;
      case "ProjectionReduction":
        return <Layers size={15} className="text-[#72b192]" />;
      default:
        return <Cpu size={15} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ide-border pb-3 text-slate-400 text-xs">
        <div className="flex items-center gap-2.5">
          <span>Optimization Engine:</span>
          <code className="text-slate-100 bg-ide-surface px-2 py-0.5 rounded border border-ide-border font-bold">
            compiler/src/optimizer.cpp
          </code>
          <span className="text-slate-400">({optimizations.length} rule passes executed)</span>
        </div>
        <div className="flex items-center gap-1.5 bg-ide-bg border border-ide-border rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("passes")}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              viewMode === "passes"
                ? "bg-ide-panel text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Transformation Passes ({optimizations.length})
          </button>
          <button
            onClick={() => setViewMode("astDiff")}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              viewMode === "astDiff"
                ? "bg-ide-panel text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Side-by-Side AST IR
          </button>
        </div>
      </div>

      {viewMode === "passes" ? (
        <div className="space-y-3.5">
          {optimizations.map((opt, idx) => (
            <div
              key={idx}
              className="bg-ide-surface border border-ide-border rounded-xl p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-ide-border/60 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-ide-panel border border-ide-border">
                    {getRuleIcon(opt.rule)}
                  </span>
                  <div>
                    <span className="font-bold text-slate-100 text-sm">{opt.rule}</span>
                    <span className="text-slate-300 text-xs ml-3 font-sans">{opt.description}</span>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-ide-panel border border-ide-border text-slate-300 font-semibold">
                  Pass {idx + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-ide-bg border border-[#482b2f] rounded-lg p-3">
                  <div className="text-[11px] uppercase font-bold text-[#db8686] tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#c97373]" /> Before Transformation
                  </div>
                  <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {opt.before}
                  </pre>
                </div>

                <div className="bg-ide-bg border border-[#273d32] rounded-lg p-3">
                  <div className="text-[11px] uppercase font-bold text-[#85c4a5] tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#6ea88f]" /> After Transformation
                  </div>
                  <pre className="text-xs text-[#9fc7b3] font-semibold overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {opt.after}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Canonical Parser AST</span>
              <span className="text-[11px] text-slate-400 font-normal">Pre-Optimization</span>
            </div>
            <pre className="bg-ide-bg border border-ide-border rounded-lg p-3 text-xs text-slate-300 max-h-[calc(100vh-410px)] min-h-[180px] overflow-y-auto leading-relaxed shadow-sm">
              {JSON.stringify(originalAst, null, 2)}
            </pre>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-[#85c4a5] uppercase tracking-wider flex items-center justify-between">
              <span>Optimized AST IR</span>
              <span className="text-[11px] text-[#85c4a5] font-normal">Post-Transformation</span>
            </div>
            <pre className="bg-ide-bg border border-[#273d32] rounded-lg p-3 text-xs text-[#9fc7b3] max-h-[calc(100vh-410px)] min-h-[180px] overflow-y-auto leading-relaxed shadow-sm">
              {JSON.stringify(optimizedAst, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
