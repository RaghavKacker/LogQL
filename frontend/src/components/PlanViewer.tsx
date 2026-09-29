import React from "react";
import { ArrowDown, Database, Filter, Layers, ListOrdered, Scissors, Split, Play } from "lucide-react";

interface PlanViewerProps {
  plan?: any;
}

export const PlanViewer: React.FC<PlanViewerProps> = ({ plan }) => {
  if (!plan) {
    return (
      <div className="p-12 text-center text-ide-subtle font-mono text-xs border border-dashed border-ide-border rounded">
        No physical execution plan generated. Compile or execute a valid query to inspect the physical Volcano iterator tree.
      </div>
    );
  }

  // Flatten the pipeline hierarchy for dataflow rendering (Scan at source -> Sink at bottom)
  const flattenPlan = (node: any): any[] => {
    const list: any[] = [];
    let curr = node;
    while (curr) {
      list.push(curr);
      curr = curr.child;
    }
    return list.reverse();
  };

  const steps = flattenPlan(plan);

  const getOperatorIcon = (name: string) => {
    switch (name) {
      case "LogScanOperator":
        return <Database className="text-sky-400" size={14} />;
      case "FilterOperator":
        return <Filter className="text-rose-400" size={14} />;
      case "AggregateOperator":
        return <Split className="text-amber-400" size={14} />;
      case "ProjectOperator":
        return <Layers className="text-indigo-400" size={14} />;
      case "SortOperator":
        return <ListOrdered className="text-purple-400" size={14} />;
      case "LimitOperator":
        return <Scissors className="text-emerald-400" size={14} />;
      default:
        return <Play className="text-ide-muted" size={14} />;
    }
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ide-border pb-3 text-ide-muted text-[11px]">
        <div className="flex items-center gap-2">
          <span>Execution Engine:</span>
          <code className="text-status-info bg-ide-bg px-1.5 py-0.5 rounded border border-ide-border">
            compiler/src/executor.cpp (Volcano Pull-Iterators)
          </code>
        </div>
        <div className="flex items-center gap-2">
          <span>Pipeline Depth:</span>
          <span className="font-semibold text-white px-1.5 py-0.5 rounded bg-ide-card border border-ide-border">
            {steps.length} Operators
          </span>
        </div>
      </div>

      {/* Operator Tree List */}
      <div className="max-w-2xl mx-auto py-2 space-y-2">
        {steps.map((op, idx) => (
          <React.Fragment key={idx}>
            <div className="bg-ide-card border border-ide-border rounded p-3 hover:border-ide-borderLight transition">
              <div className="flex items-center justify-between border-b border-ide-border/50 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-ide-bg border border-ide-border">
                    {getOperatorIcon(op.operator)}
                  </span>
                  <span className="font-bold text-white text-xs">{op.operator}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-ide-subtle uppercase">
                    Step {idx + 1} of {steps.length}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-ide-bg border border-ide-border text-ide-muted uppercase">
                    {idx === 0 ? "Source (Leaf)" : idx === steps.length - 1 ? "Sink (Root)" : "Iterator Node"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-ide-muted mb-2 font-sans">{op.description}</p>

              <div className="space-y-1">
                {op.projectedColumns && (
                  <div className="text-[11px] bg-ide-bg p-1.5 rounded border border-ide-border flex items-start gap-2">
                    <span className="text-ide-subtle uppercase text-[10px] font-semibold w-24 flex-shrink-0">Projection:</span>
                    <span className="text-sky-300 font-mono">{op.projectedColumns.join(", ")}</span>
                  </div>
                )}

                {op.predicate && (
                  <div className="text-[11px] bg-ide-bg p-1.5 rounded border border-ide-border flex items-start gap-2">
                    <span className="text-ide-subtle uppercase text-[10px] font-semibold w-24 flex-shrink-0">Filter Pred:</span>
                    <span className="text-rose-300 font-mono break-all">{op.predicate}</span>
                  </div>
                )}

                {op.groupKeys && (
                  <div className="text-[11px] bg-ide-bg p-1.5 rounded border border-ide-border flex items-start gap-2">
                    <span className="text-ide-subtle uppercase text-[10px] font-semibold w-24 flex-shrink-0">Aggregation:</span>
                    <span className="text-amber-300 font-mono">
                      GROUP BY [{op.groupKeys.join(", ")}]
                      {op.aggregates && <span className="text-amber-400/80 ml-2">| Aggs: {op.aggregates.join(", ")}</span>}
                    </span>
                  </div>
                )}

                {op.orderKeys && (
                  <div className="text-[11px] bg-ide-bg p-1.5 rounded border border-ide-border flex items-start gap-2">
                    <span className="text-ide-subtle uppercase text-[10px] font-semibold w-24 flex-shrink-0">Sort Order:</span>
                    <span className="text-purple-300 font-mono">{op.orderKeys.join(", ")}</span>
                  </div>
                )}

                {op.limit !== undefined && (
                  <div className="text-[11px] bg-ide-bg p-1.5 rounded border border-ide-border flex items-start gap-2">
                    <span className="text-ide-subtle uppercase text-[10px] font-semibold w-24 flex-shrink-0">Row Limit:</span>
                    <span className="text-emerald-300 font-mono">{op.limit} records</span>
                  </div>
                )}
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div className="flex flex-col items-center justify-center my-0.5 text-ide-subtle">
                <ArrowDown size={14} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
