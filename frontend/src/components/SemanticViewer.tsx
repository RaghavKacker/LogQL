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
      <div className="p-16 text-center text-slate-400 font-mono text-xs border border-dashed border-ide-border rounded-lg">
        No semantic analysis report available. Compile or run a query to validate schema and types.
      </div>
    );
  }

  const { isValid, diagnostics } = semantic;
  const errors = diagnostics.filter((d) => d.severity === "ERROR");
  const warnings = diagnostics.filter((d) => d.severity === "WARNING");

  return (
    <div className="space-y-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 text-slate-400 border-b border-ide-border pb-3 font-mono text-xs">
        <span className="flex items-center gap-2">
          <span>Semantic Analyzer:</span>
          <strong className="text-slate-100 bg-ide-surface px-2 py-0.5 rounded border border-ide-border">compiler/src/semantic.cpp (C++17)</strong>
        </span>
        <div>
          {isValid ? (
            <span className="px-3 py-1 rounded-full bg-[#182620] border border-[#294237] text-[#85c4a5] font-semibold flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 size={14} className="text-[#72b192]" /> SEMANTICALLY VALID
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-[#26191a] border border-[#482b2d] text-[#db8686] font-semibold flex items-center gap-1.5 shadow-sm">
              <XCircle size={14} className="text-[#db8686]" /> {errors.length} SEMANTIC ERROR{errors.length > 1 ? "S" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-ide-panel border border-ide-border rounded-xl p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
            <ShieldCheck size={16} className={errors.length === 0 ? "text-[#72b192]" : "text-[#db8686]"} />
            <span>Schema Attributes</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Validates referenced identifiers against canonical schema (<code className="text-[#7fa1c4] font-mono">timestamp, service, level, status, response_time, path, ip, message</code>).
          </p>
        </div>

        <div className="bg-ide-panel border border-ide-border rounded-xl p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
            <CheckCircle2 size={16} className="text-[#72b192]" />
            <span>Type System Consistency</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Relational operators (&lt;, &gt;, &lt;=, &gt;=) require numeric or timestamp types. Implicit float promotion is validated.
          </p>
        </div>

        <div className="bg-ide-panel border border-ide-border rounded-xl p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
            <CheckCircle2 size={16} className="text-[#72b192]" />
            <span>Aggregation Scope Invariant</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            All scalar attributes in <code className="text-[#7fa1c4] font-mono">SELECT</code> must be declared in <code className="text-[#7fa1c4] font-mono">GROUP BY</code> when aggregate functions exist.
          </p>
        </div>
      </div>

      <div className="space-y-2.5 pt-2">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
          Diagnostic Log ({diagnostics.length})
        </div>

        {diagnostics.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#16221c] border border-[#273d32] text-xs font-mono text-[#85c4a5] flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-[#72b192] flex-shrink-0" />
            <span>Zero semantic warnings or errors detected. Query AST passes all type and schema invariants.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {diagnostics.map((d, i) => {
              const isError = d.severity === "ERROR";
              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border text-xs font-mono flex items-start gap-3 ${
                    isError
                      ? "bg-[#241a1c] border-[#4a2b2f] text-[#db8686]"
                      : "bg-[#251f15] border-[#433726] text-[#d6aa65]"
                  }`}
                >
                  {isError ? <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-[#db8686]" /> : <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-[#d6aa65]" />}
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <span>[{d.severity}]</span>
                      {d.line ? <span className="opacity-80">Line {d.line}, Col {d.col}</span> : null}
                    </div>
                    <div className="text-slate-200 font-normal leading-relaxed text-sm">{d.message}</div>
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
