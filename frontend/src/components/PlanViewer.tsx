import React from "react";
import { ArrowDown, Database, Filter, Layers, ListOrdered, Scissors, Split, Play } from "lucide-react";

interface PlanViewerProps {
  plan?: any;
}

export const PlanViewer: React.FC<PlanViewerProps> = ({ plan }) => {
  if (!plan) {
    return (
      <div className="p-16 text-center text-slate-400 font-mono text-xs border border-dashed border-ide-border rounded-lg">
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
        return <Database className="text-[#7fa1c4]" size={16} />;
      case "FilterOperator":
        return <Filter className="text-[#db8686]" size={16} />;
      case "AggregateOperator":
        return <Split className="text-[#cfa058]" size={16} />;
      case "ProjectOperator":
        return <Layers className="text-[#8ea8c9]" size={16} />;
      case "SortOperator":
        return <ListOrdered className="text-[#9b8cb8]" size={16} />;
      case "LimitOperator":
        return <Scissors className="text-[#72b192]" size={16} />;
      default:
        return <Play className="text-slate-400" size={16} />;
    }
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ide-border pb-3 text-slate-400 text-xs">
        <div className="flex items-center gap-2.5">
          <span>Execution Engine:</span>
          <code className="text-slate-100 bg-ide-surface px-2.5 py-0.5 rounded border border-ide-border font-bold">
            compiler/src/executor.cpp (Volcano Pull-Iterators)
          </code>
        </div>
        <div className="flex items-center gap-2">
          <span>Pipeline Depth:</span>
          <span className="font-semibold text-slate-100 px-2 py-0.5 rounded-full bg-ide-surface border border-ide-border">
            {steps.length} Operators
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto py-2 space-y-2.5">
        {steps.map((op, idx) => (
          <React.Fragment key={idx}>
            <div className="bg-ide-surface border border-ide-border hover:border-slate-700 rounded-xl p-4 shadow-sm transition">
              <div className="flex items-center justify-between border-b border-ide-border/60 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-ide-panel border border-ide-border">
                    {getOperatorIcon(op.operator)}
                  </span>
                  <span className="font-bold text-slate-100 text-sm">{op.operator}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 uppercase">
                    Step {idx + 1} of {steps.length}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ide-bg border border-ide-border text-slate-300 uppercase">
                    {idx === 0 ? "Source (Scan)" : idx === steps.length - 1 ? "Sink (Output)" : "Iterator"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-3 font-sans leading-relaxed">{op.description}</p>

              <div className="space-y-1.5 text-xs">
                {op.projectedColumns && (
                  <div className="bg-ide-bg p-2 rounded-lg border border-ide-border flex items-start gap-2.5">
                    <span className="text-slate-400 uppercase text-[10px] font-semibold w-24 flex-shrink-0 pt-0.5">Projection:</span>
                    <span className="text-[#8ea8c9] font-mono font-medium">{op.projectedColumns.join(", ")}</span>
                  </div>
                )}

                {op.predicate && (
                  <div className="bg-ide-bg p-2 rounded-lg border border-ide-border flex items-start gap-2.5">
                    <span className="text-slate-400 uppercase text-[10px] font-semibold w-24 flex-shrink-0 pt-0.5">Filter Pred:</span>
                    <span className="text-[#db8686] font-mono break-all">{op.predicate}</span>
                  </div>
                )}

                {op.groupKeys && (
                  <div className="bg-ide-bg p-2 rounded-lg border border-ide-border flex items-start gap-2.5">
                    <span className="text-slate-400 uppercase text-[10px] font-semibold w-24 flex-shrink-0 pt-0.5">Grouping:</span>
                    <span className="text-[#cfa058] font-mono">
                      GROUP BY [{op.groupKeys.join(", ")}]
                      {op.aggregates && <span className="text-[#d8b072] ml-2">| Aggs: {op.aggregates.join(", ")}</span>}
                    </span>
                  </div>
                )}

                {op.orderKeys && (
                  <div className="bg-ide-bg p-2 rounded-lg border border-ide-border flex items-start gap-2.5">
                    <span className="text-slate-400 uppercase text-[10px] font-semibold w-24 flex-shrink-0 pt-0.5">Sort Order:</span>
                    <span className="text-[#9b8cb8] font-mono">{op.orderKeys.join(", ")}</span>
                  </div>
                )}

                {op.limit !== undefined && (
                  <div className="bg-ide-bg p-2 rounded-lg border border-ide-border flex items-start gap-2.5">
                    <span className="text-slate-400 uppercase text-[10px] font-semibold w-24 flex-shrink-0 pt-0.5">Row Limit:</span>
                    <span className="text-[#72b192] font-mono font-semibold">{op.limit} records</span>
                  </div>
                )}
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div className="flex flex-col items-center justify-center my-1 text-slate-400">
                <ArrowDown size={16} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
