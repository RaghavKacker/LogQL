import React from "react";
import { ArrowDown, Database, Filter, Layers, ListOrdered, Scissors, Split } from "lucide-react";

interface PlanViewerProps {
  plan?: any;
}

export const PlanViewer: React.FC<PlanViewerProps> = ({ plan }) => {
  if (!plan) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        No physical execution plan available.
      </div>
    );
  }

  // Flatten the pipeline hierarchy for sequential rendering
  const flattenPlan = (node: any): any[] => {
    const list: any[] = [];
    let curr = node;
    while (curr) {
      list.push(curr);
      curr = curr.child;
    }
    // Reverse so Scan is at the top (data flow direction)
    return list.reverse();
  };

  const steps = flattenPlan(plan);

  const getOperatorIcon = (name: string) => {
    switch (name) {
      case "LogScanOperator":
        return <Database className="text-sky-400" size={18} />;
      case "FilterOperator":
        return <Filter className="text-rose-400" size={18} />;
      case "AggregateOperator":
        return <Split className="text-amber-400" size={18} />;
      case "ProjectOperator":
        return <Layers className="text-indigo-400" size={18} />;
      case "SortOperator":
        return <ListOrdered className="text-purple-400" size={18} />;
      case "LimitOperator":
        return <Scissors className="text-emerald-400" size={18} />;
      default:
        return <Database className="text-gray-400" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-400 border-b border-dark-border pb-3">
        <span>Execution Planner: <code className="text-brand-cyan">compiler/src/execution_plan.cpp (Volcano Pull-Iterators)</code></span>
        <span>Pipeline Depth: <strong className="text-white font-mono">{steps.length} Operators</strong></span>
      </div>

      <div className="flex flex-col items-center max-w-xl mx-auto py-4">
        {steps.map((op, idx) => (
          <React.Fragment key={idx}>
            <div className="w-full bg-dark-card border border-dark-border rounded-xl p-4 shadow-lg hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between border-b border-dark-border/60 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-dark-bg border border-dark-border">
                    {getOperatorIcon(op.operator)}
                  </div>
                  <h4 className="font-mono text-sm font-bold text-white">{op.operator}</h4>
                </div>
                <span className="text-[10px] font-mono uppercase bg-dark-input px-2 py-0.5 rounded text-gray-400">
                  Step {idx + 1}
                </span>
              </div>

              <p className="text-xs text-gray-300 mb-2">{op.description}</p>

              {op.projectedColumns && (
                <div className="text-[11px] font-mono text-sky-300 bg-dark-input/60 p-2 rounded border border-dark-border/50">
                  <span className="text-gray-400 font-semibold">Columns: </span>
                  {op.projectedColumns.join(", ")}
                </div>
              )}

              {op.predicate && (
                <div className="text-[11px] font-mono text-rose-300 bg-dark-input/60 p-2 rounded border border-dark-border/50 truncate">
                  <span className="text-gray-400 font-semibold">Predicate: </span>
                  {op.predicate}
                </div>
              )}

              {op.groupKeys && (
                <div className="text-[11px] font-mono text-amber-300 bg-dark-input/60 p-2 rounded border border-dark-border/50">
                  <span className="text-gray-400 font-semibold">Group Keys: </span>
                  {op.groupKeys.join(", ")}
                  {op.aggregates && <span className="ml-2 text-gray-400">| Aggs: {op.aggregates.join(", ")}</span>}
                </div>
              )}

              {op.orderKeys && (
                <div className="text-[11px] font-mono text-purple-300 bg-dark-input/60 p-2 rounded border border-dark-border/50">
                  <span className="text-gray-400 font-semibold">Sort By: </span>
                  {op.orderKeys.join(", ")}
                </div>
              )}

              {op.limit !== undefined && (
                <div className="text-[11px] font-mono text-emerald-300 bg-dark-input/60 p-2 rounded border border-dark-border/50">
                  <span className="text-gray-400 font-semibold">Row Limit: </span>
                  {op.limit}
                </div>
              )}
            </div>

            {idx < steps.length - 1 && (
              <div className="my-1.5 flex flex-col items-center">
                <ArrowDown size={18} className="text-gray-500 animate-pulse" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
