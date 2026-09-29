import React, { useState } from "react";
import { Sparkles, ArrowRight, Zap, Minimize2, Filter, Layers } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"cards" | "astDiff">("cards");

  if (!optimizations || optimizations.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        No query optimizations applied for this query statement.
      </div>
    );
  }

  const getRuleIcon = (rule: string) => {
    switch (rule) {
      case "ConstantFolding":
        return <Zap size={16} className="text-amber-400" />;
      case "DuplicatePredicateElimination":
        return <Minimize2 size={16} className="text-brand-cyan" />;
      case "PredicatePushdown":
        return <Filter size={16} className="text-indigo-400" />;
      case "ProjectionReduction":
        return <Layers size={16} className="text-emerald-400" />;
      default:
        return <Sparkles size={16} className="text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-400 border-b border-dark-border pb-3">
        <span>Optimizer Source: <code className="text-brand-cyan">compiler/src/optimizer.cpp (4 Transformation Passes)</code></span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("cards")}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              activeTab === "cards" ? "bg-indigo-600 text-white" : "bg-dark-card text-gray-400 hover:text-white"
            }`}
          >
            Transformation Rules ({optimizations.length})
          </button>
          <button
            onClick={() => setActiveTab("astDiff")}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              activeTab === "astDiff" ? "bg-indigo-600 text-white" : "bg-dark-card text-gray-400 hover:text-white"
            }`}
          >
            Side-by-Side AST Diff
          </button>
        </div>
      </div>

      {activeTab === "cards" ? (
        <div className="grid grid-cols-1 gap-4">
          {optimizations.map((opt, idx) => (
            <div
              key={idx}
              className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm hover:border-indigo-500/40 transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-dark-bg border border-dark-border">
                    {getRuleIcon(opt.rule)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{opt.rule}</h4>
                    <p className="text-xs text-gray-400">{opt.description}</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-700/50">
                  Pass {idx + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="bg-dark-input/80 border border-rose-900/30 rounded-lg p-3">
                  <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider mb-1">Before Optimization</div>
                  <pre className="text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
                    {opt.before}
                  </pre>
                </div>

                <div className="bg-dark-input/80 border border-emerald-900/30 rounded-lg p-3">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1">After Optimization</div>
                  <pre className="text-xs font-mono text-emerald-300 font-semibold overflow-x-auto whitespace-pre-wrap">
                    {opt.after}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Raw Parser AST</h4>
            <pre className="bg-dark-input/80 border border-dark-border rounded-xl p-4 text-xs font-mono text-gray-300 max-h-[500px] overflow-y-auto">
              {JSON.stringify(originalAst, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Optimized AST (Post-Passes)</h4>
            <pre className="bg-dark-input/80 border border-emerald-900/40 rounded-xl p-4 text-xs font-mono text-emerald-300 max-h-[500px] overflow-y-auto">
              {JSON.stringify(optimizedAst, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
