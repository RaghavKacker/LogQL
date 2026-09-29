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
      <div className="p-12 text-center text-ide-muted font-mono text-xs">
        No semantic analysis report available. Compile or run a query to validate schema and types.
      </div>
    );
  }

  const { isValid, diagnostics } = semantic;
  const errors = diagnostics.filter((d) => d.severity === "ERROR");
  const warnings = diagnostics.filter((d) => d.severity === "WARNING");

  return (
    <div className="space-y-4 text-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-ide-muted border-b border-ide-border pb-2.5 font-mono text-[11px]">
        <span>Semantic Analyzer: <strong className="text-ide-text">compiler/src/semantic.cpp (C++17)</strong></span>
        <div>
          {isValid ? (
            <span className="px-2 py-0.5 rounded bg-status-success/15 border border-status-success/40 text-status-success font-bold flex items-center gap-1">
              <CheckCircle2 size={12} /> SEMANTICALLY VALID
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-status-error/15 border border-status-error/40 text-status-error font-bold flex items-center gap-1">
              <XCircle size={12} /> {errors.length} SEMANTIC ERROR{errors.length > 1 ? "S" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Verification Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-ide-panel border border-ide-border rounded p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ide-text">
            <ShieldCheck size={14} className={errors.length === 0 ? "text-status-success" : "text-status-error"} />
            <span>Schema Attributes</span>
          </div>
          <p className="text-[10px] text-ide-muted font-mono leading-relaxed">
            All identifiers verified against normalized schema (timestamp, service, level, status, response_time, path, ip, message).
          </p>
        </div>

        <div className="bg-ide-panel border border-ide-border rounded p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ide-text">
            <CheckCircle2 size={14} className="text-status-success" />
            <span>Type System Consistency</span>
          </div>
          <p className="text-[10px] text-ide-muted font-mono leading-relaxed">
            Relational operators (&lt;, &gt;, &lt;=, &gt;=) require numeric types. Implicit float promotion applied.
          </p>
        </div>

        <div className="bg-ide-panel border border-ide-border rounded p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ide-text">
            <CheckCircle2 size={14} className="text-status-success" />
            <span>Aggregation Scope</span>
          </div>
          <p className="text-[10px] text-ide-muted font-mono leading-relaxed">
            Scalar fields in SELECT must appear in GROUP BY clause. Nested aggregates prohibited.
          </p>
        </div>
      </div>

      {/* Diagnostics List */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] font-semibold text-ide-muted uppercase tracking-wider font-mono">
          Diagnostic Log ({diagnostics.length})
        </div>

        {diagnostics.length === 0 ? (
          <div className="p-4 rounded bg-ide-panel border border-ide-border text-[11px] font-mono text-status-success flex items-center gap-2">
            <CheckCircle2 size={14} /> Zero semantic warnings or errors detected. Query is ready for execution.
          </div>
        ) : (
          <div className="space-y-1.5">
            {diagnostics.map((d, i) => {
              const isError = d.severity === "ERROR";
              return (
                <div
                  key={i}
                  className={`p-3 rounded border text-[11px] font-mono flex items-start gap-2.5 ${
                    isError
                      ? "bg-status-error/10 border-status-error/40 text-status-error"
                      : "bg-status-warning/10 border-status-warning/40 text-status-warning"
                  }`}
                >
                  {isError ? <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />}
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-2">
                      <span>[{d.severity}]</span>
                      {d.line ? <span className="opacity-75">Line {d.line}:{d.col}</span> : null}
                    </div>
                    <div className="text-ide-text font-normal">{d.message}</div>
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
