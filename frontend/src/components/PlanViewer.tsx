import React from "react";
import { ArrowDown, Database, Filter, Layers, ListOrdered, Scissors, Split, Play } from "lucide-react";

interface PlanViewerProps {
  plan?: any;
}

export const PlanViewer: React.FC<PlanViewerProps> = ({ plan }) => {
  if (!plan) {
    return (
      <div className="p-16 text-center text-ide-muted font-mono text-xs border border-dashed border-ide-border rounded-lg">
        <p className="text-sm font-semibold text-ide-text mb-1">No physical execution plan available</p>
        <p className="text-ide-subtle text-xs">Run or compile a query to inspect the physical Volcano pull-iterator pipeline.</p>
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
        return <Database className="text-blue-400" size={15} />;
      case "FilterOperator":
        return <Filter className="text-rose-400" size={15} />;
      case "AggregateOperator":
        return <Split className="text-amber-400" size={15} />;
      case "ProjectOperator":
        return <Layers className="text-purple-400" size={15} />;
      case "SortOperator":
        return <ListOrdered className="text-sky-400" size={15} />;
      case "LimitOperator":
        return <Scissors className="text-emerald-400" size={15} />;
      default:
        return <Play className="text-ide-muted" size={15} />;
    }
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ide-border pb-2.5 text-ide-muted text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-ide-subtle">Engine:</span>
          <code className="text-ide-text bg-ide-surface px-2 py-0.5 rounded border border-ide-border font-medium">
            compiler/src/executor.cpp (Volcano Pull-Iterators)
          </code>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-ide-subtle">Pipeline Depth:</span>
          <span className="font-medium text-ide-text px-2 py-0.5 rounded bg-ide-surface border border-ide-border">
            {steps.length} Operators
          </span>
        </div>
      </div>

      {/* Operator Step Pipeline */}
      <div className="max-w-2xl mx-auto py-2 space-y-2">
        {steps.map((op, idx) => (
          <React.Fragment key={idx}>
            <div className="bg-ide-panel border border-ide-border hover:border-ide-borderLight rounded-lg p-3.5 shadow-sm transition">
              <div className="flex items-center justify-between border-b border-ide-border/60 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-ide-surface border border-ide-border">
                    {getOperatorIcon(op.operator)}
                  </span>
                  <span className="font-semibold text-ide-text text-xs">{op.operator}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-ide-subtle uppercase">
                    Step {idx + 1} of {steps.length}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-ide-surface border border-ide-border text-ide-muted uppercase">
                    {idx === 0 ? "Source (Scan)" : idx === steps.length - 1 ? "Sink (Output)" : "Iterator"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-ide-muted mb-2 font-sans leading-relaxed">{op.description}</p>

              <div className="space-y-1 text-xs">
                {op.projectedColumns && (
                  <div className="bg-ide-bg p-2 rounded border border-ide-border flex items-start gap-2">
                    <span className="text-ide-subtle uppercase text-[10px] font-medium w-24 flex-shrink-0 pt-0.5">Projection:</span>
                    <span className="text-ide-text font-mono font-medium">{op.projectedColumns.join(", ")}</span>
                  </div>
                )}

                {op.predicate && (
                  <div className="bg-ide-bg p-2 rounded border border-ide-border flex items-start gap-2">
                    <span className="text-ide-subtle uppercase text-[10px] font-medium w-24 flex-shrink-0 pt-0.5">Filter Pred:</span>
                    <span className="text-rose-300 font-mono break-all">{op.predicate}</span>
                  </div>
                )}

                {op.groupKeys && (
                  <div className="bg-ide-bg p-2 rounded border border-ide-border flex items-start gap-2">
                    <span className="text-ide-subtle uppercase text-[10px] font-medium w-24 flex-shrink-0 pt-0.5">Grouping:</span>
                    <span className="text-amber-300 font-mono">
                      GROUP BY [{op.groupKeys.join(", ")}]
                      {op.aggregates && <span className="text-amber-200 ml-2">| Aggs: {op.aggregates.join(", ")}</span>}
                    </span>
                  </div>
                )}

                {op.orderKeys && (
                  <div className="bg-ide-bg p-2 rounded border border-ide-border flex items-start gap-2">
                    <span className="text-ide-subtle uppercase text-[10px] font-medium w-24 flex-shrink-0 pt-0.5">Sort Order:</span>
                    <span className="text-purple-300 font-mono">{op.orderKeys.join(", ")}</span>
                  </div>
                )}

                {op.limit !== undefined && (
                  <div className="bg-ide-bg p-2 rounded border border-ide-border flex items-start gap-2">
                    <span className="text-ide-subtle uppercase text-[10px] font-medium w-24 flex-shrink-0 pt-0.5">Row Limit:</span>
                    <span className="text-emerald-400 font-mono font-medium">{op.limit} records</span>
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
