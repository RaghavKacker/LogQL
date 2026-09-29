import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";
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
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        No semantic analysis performed yet.
      </div>
    );
  }

  const { isValid, diagnostics } = semantic;
  const errors = diagnostics.filter((d) => d.severity === "ERROR");
  const warnings = diagnostics.filter((d) => d.severity === "WARNING");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-400 border-b border-dark-border pb-3">
        <span>Analyzer Source: <code className="text-brand-cyan">compiler/src/semantic.cpp (C++17)</code></span>
        <span className="flex items-center gap-2">
          Status:{" "}
          {isValid ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded">
              <CheckCircle2 size={13} /> SEMANTICALLY VALID
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-400 font-bold bg-rose-950/80 border border-rose-700/60 px-2 py-0.5 rounded">
              <XCircle size={13} /> SEMANTIC ERRORS DETECTED
            </span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex items-start gap-3">
          <ShieldCheck className="text-brand-cyan mt-1 flex-shrink-0" size={20} />
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Schema Verification</div>
            <div className="text-sm font-medium text-white mt-1">
              {errors.length === 0 ? "Attributes exist in schema" : "Unknown attributes found"}
            </div>
            <div className="text-[11px] text-gray-500 mt-1 font-mono">timestamp, service, level, status, response_time, path, ip, message</div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="text-indigo-400 mt-1 flex-shrink-0" size={20} />
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Type Compatibility</div>
            <div className="text-sm font-medium text-white mt-1">
              Strict numeric & string operator consistency enforced
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="text-amber-400 mt-1 flex-shrink-0" size={20} />
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Aggregation Rules</div>
            <div className="text-sm font-medium text-white mt-1">
              Scalar expressions matched to GROUP BY columns
            </div>
          </div>
        </div>
      </div>

      {diagnostics.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Compiler Diagnostic Log</h4>
          <div className="space-y-2">
            {diagnostics.map((diag, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-3 ${
                  diag.severity === "ERROR"
                    ? "bg-rose-950/40 border-rose-800/60 text-rose-300"
                    : "bg-amber-950/40 border-amber-800/60 text-amber-300"
                }`}
              >
                {diag.severity === "ERROR" ? (
                  <XCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>[{diag.severity}]</span>
                    {diag.line ? <span>Line {diag.line}:{diag.col}</span> : null}
                  </div>
                  <div className="mt-1 text-gray-200">{diag.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
