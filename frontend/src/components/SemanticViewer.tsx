import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, ShieldCheck, XCircle } from "lucide-react";
import { DiagnosticItem } from "@/lib/api";

interface SemanticViewerProps {
  semantic?: {
    isValid: boolean;
    diagnostics: DiagnosticItem[];
  };
}

export const SemanticViewer: React.FC<SemanticViewerProps> = ({ semantic }) => {
  if (!semantic) {
    return (
      <div className="p-16 text-center text-ide-muted font-mono text-xs border border-dashed border-ide-border rounded-lg">
        <p className="text-sm font-semibold text-ide-text mb-1">No semantic analysis report available</p>
        <p className="text-ide-subtle text-xs">Run or compile a query to validate schema attributes and type compatibility.</p>
      </div>
    );
  }

  const { isValid, diagnostics } = semantic;
  const errors = diagnostics.filter((d) => d.severity === "ERROR");

  return (
    <div className="space-y-4 text-xs">
      {/* Header status */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-ide-muted border-b border-ide-border pb-3 font-mono text-xs">
        <span className="flex items-center gap-2">
          <span className="text-ide-subtle">Semantic Analyzer:</span>
          <strong className="text-ide-text bg-ide-surface px-2 py-0.5 rounded border border-ide-border font-medium">compiler/src/semantic.cpp (C++17)</strong>
        </span>
        <div>
          {isValid ? (
            <span className="px-3 py-1 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 font-medium flex items-center gap-1.5 shadow-sm text-xs">
              <CheckCircle2 size={13} className="text-status-success" /> All Semantic Checks Passed
            </span>
          ) : (
            <span className="px-3 py-1 rounded bg-red-950/60 border border-red-800/80 text-red-300 font-medium flex items-center gap-1.5 shadow-sm text-xs">
              <XCircle size={13} className="text-status-error" /> {errors.length} Semantic Error{errors.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* 3 Core Invariant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-ide-panel border border-ide-border rounded-lg p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-ide-text">
            <ShieldCheck size={15} className={errors.length === 0 ? "text-status-success" : "text-status-error"} />
            <span>Schema Verification</span>
          </div>
          <p className="text-xs text-ide-muted leading-relaxed font-sans">
            Validates referenced fields against the canonical schema: <code className="text-ide-text font-mono text-[11px]">timestamp, service, level, status, response_time, path, ip, message</code>.
          </p>
        </div>

        <div className="bg-ide-panel border border-ide-border rounded-lg p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-ide-text">
            <CheckCircle2 size={15} className="text-status-success" />
            <span>Type System</span>
          </div>
          <p className="text-xs text-ide-muted leading-relaxed font-sans">
            Arithmetic and relational comparisons require numeric or timestamp operands. Implicit float promotion is strictly checked.
          </p>
        </div>

        <div className="bg-ide-panel border border-ide-border rounded-lg p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-ide-text">
            <CheckCircle2 size={15} className="text-status-success" />
            <span>Aggregation Invariants</span>
          </div>
          <p className="text-xs text-ide-muted leading-relaxed font-sans">
            When aggregate functions (<code className="text-ide-text font-mono text-[11px]">COUNT, AVG</code>) are used, all scalar columns in <code className="text-ide-text font-mono text-[11px]">SELECT</code> must appear in <code className="text-ide-text font-mono text-[11px]">GROUP BY</code>.
          </p>
        </div>
      </div>

      {/* Diagnostic Log */}
      <div className="space-y-2 pt-1">
        <div className="text-xs font-semibold text-ide-text uppercase tracking-wider font-mono">
          Diagnostic Log ({diagnostics.length})
        </div>

        {diagnostics.length === 0 ? (
          <div className="p-3.5 rounded-lg bg-ide-surface/60 border border-ide-border text-xs font-mono text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 size={15} className="text-status-success flex-shrink-0" />
            <span>Zero semantic errors or warnings. Query AST conforms to all schema and type invariants.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {diagnostics.map((d, i) => {
              const isError = d.severity === "ERROR";
              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-lg border text-xs font-mono flex items-start gap-3 ${
                    isError
                      ? "bg-red-950/40 border-red-800/60 text-red-200"
                      : "bg-amber-950/40 border-amber-800/60 text-amber-200"
                  }`}
                >
                  {isError ? (
                    <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-400" />
                  ) : (
                    <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-amber-400" />
                  )}
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span className={isError ? "text-red-300" : "text-amber-300"}>[{d.severity}]</span>
                      {d.line ? <span className="text-ide-subtle text-[11px]">Line {d.line}, Col {d.col}</span> : null}
                    </div>
                    <div className="text-slate-100 font-sans leading-relaxed text-xs">{d.message}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
