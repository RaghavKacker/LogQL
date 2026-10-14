import React, { useState } from "react";
import { ResultsData } from "@/lib/api";
import { Download, Search, Check, Copy, X } from "lucide-react";

interface ResultsTableProps {
  results?: ResultsData;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [copiedCellVal, setCopiedCellVal] = useState<string | null>(null);

  if (!results) {
    return (
      <div className="py-20 px-4 text-center text-ide-muted font-sans border border-dashed border-ide-border rounded-lg bg-ide-surface/20">
        <p className="text-base font-semibold text-ide-text mb-1.5">No query execution results yet</p>
        <p className="text-ide-subtle text-sm max-w-md mx-auto">
          Write a query above and click <span className="text-emerald-400 font-semibold">Run Query</span> or press <kbd className="px-1.5 py-0.5 rounded bg-ide-surface text-slate-200 border border-ide-border font-mono text-xs">Ctrl+Enter</kbd> to inspect matching logs.
        </p>
      </div>
    );
  }

  const { columns, rows, metrics } = results;

  const filteredRows = rows.filter((r) =>
    columns.some((col) => {
      const val = r[col];
      return val !== undefined && String(val).toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  const exportCSV = () => {
    if (rows.length === 0) return;
    const header = columns.join(",");
    const csvRows = rows.map((r) =>
      columns.map((c) => JSON.stringify(r[c] ?? "")).join(",")
    );
    const blob = new Blob([[header, ...csvRows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logql_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJSON = () => {
    if (rows.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 1500);
  };

  const copyCell = (val: any) => {
    const text = val === null || val === undefined ? "null" : String(val);
    navigator.clipboard.writeText(text);
    setCopiedCellVal(text);
    setTimeout(() => setCopiedCellVal(null), 1200);
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Clean, Unified Header & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm pb-1">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white">
            {metrics.recordsReturned.toLocaleString()} {metrics.recordsReturned === 1 ? "row" : "rows"} returned
          </span>
          <span className="text-ide-subtle text-xs font-mono">
            ({metrics.recordsScanned.toLocaleString()} scanned &bull; {metrics.recordsFiltered.toLocaleString()} filtered &bull; {metrics.executionTimeMs.toFixed(2)} ms)
          </span>
        </div>

        {/* Search & Export Buttons */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-ide-subtle" />
            <input
              type="text"
              placeholder="Filter output..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-ide-bg border border-ide-border rounded-md pl-8 pr-7 py-1 text-xs text-ide-text placeholder-ide-subtle focus:outline-none focus:border-ide-borderLight w-44 font-mono transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1.5 text-ide-subtle hover:text-white"
                title="Clear filter"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={copyJSON}
            disabled={rows.length === 0}
            title="Copy all results as JSON"
            className="px-2.5 py-1 rounded-md bg-ide-surface hover:bg-ide-hover border border-ide-border text-xs text-ide-muted hover:text-white transition flex items-center gap-1.5 disabled:opacity-40"
          >
            {copiedJSON ? <Check size={12} className="text-status-success" /> : <Copy size={12} />}
            <span>{copiedJSON ? "Copied" : "JSON"}</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={rows.length === 0}
            title="Download results as CSV"
            className="px-2.5 py-1 rounded-md bg-ide-surface hover:bg-ide-hover border border-ide-border text-xs text-ide-muted hover:text-white transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download size={12} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {copiedCellVal !== null && (
        <div className="fixed bottom-6 right-6 z-50 bg-ide-surface border border-ide-borderLight text-ide-text text-xs font-mono px-3.5 py-2 rounded-lg shadow-xl flex items-center gap-2">
          <Check size={14} className="text-status-success" />
          <span>Copied: <strong>{copiedCellVal.slice(0, 30)}{copiedCellVal.length > 30 ? "..." : ""}</strong></span>
        </div>
      )}

      {/* Main Table */}
      <div className="border border-ide-border rounded-lg overflow-hidden bg-ide-panel shadow-sm">
        <div className="max-h-[500px] min-h-[160px] overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-sm border-collapse font-mono">
            <thead className="bg-ide-surface/80 text-ide-muted uppercase tracking-wider sticky top-0 border-b border-ide-border select-none z-10 text-xs">
              <tr>
                <th className="py-2.5 px-3.5 w-12 text-center text-ide-subtle border-r border-ide-border font-medium">#</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="py-2.5 px-3.5 font-semibold text-slate-200 border-r border-ide-border last:border-r-0">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ide-border text-slate-200">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 px-4 text-center text-ide-muted italic font-sans text-sm">
                    {rows.length === 0 ? "No records returned for this query." : `No rows matching "${searchTerm}".`}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-ide-surface/40 transition-colors">
                    <td className="py-2.5 px-3.5 text-center text-ide-subtle border-r border-ide-border select-none text-xs">
                      {rowIdx + 1}
                    </td>
                    {columns.map((col, colIdx) => {
                      const val = row[col];
                      const isStatus = col.toLowerCase() === "status";
                      const isLevel = col.toLowerCase() === "level";
                      const isNumber = typeof val === "number";

                      let badgeEl = null;
                      if (isStatus && typeof val === "number") {
                        if (val >= 500) {
                          badgeEl = <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/80 font-bold text-xs">{val}</span>;
                        } else if (val >= 400) {
                          badgeEl = <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/80 font-bold text-xs">{val}</span>;
                        } else {
                          badgeEl = <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 font-medium text-xs">{val}</span>;
                        }
                      } else if (isLevel && typeof val === "string") {
                        if (val === "ERROR" || val === "FATAL") {
                          badgeEl = <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/80 font-bold text-xs">{val}</span>;
                        } else if (val === "WARN") {
                          badgeEl = <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/80 font-semibold text-xs">{val}</span>;
                        } else {
                          badgeEl = <span className="px-2 py-0.5 rounded bg-ide-surface text-slate-300 border border-ide-border font-medium text-xs">{val}</span>;
                        }
                      }

                      return (
                        <td
                          key={colIdx}
                          onClick={() => copyCell(val)}
                          title="Click to copy value"
                          className="py-2.5 px-3.5 border-r border-ide-border last:border-r-0 truncate max-w-sm text-sm cursor-pointer hover:bg-ide-surface/60 transition-colors"
                        >
                          {badgeEl ? (
                            badgeEl
                          ) : val === null || val === undefined ? (
                            <span className="text-ide-subtle italic">null</span>
                          ) : isNumber && !Number.isInteger(val) ? (
                            <span className="text-purple-300">{val.toFixed(2)}</span>
                          ) : (
                            <span className="text-ide-text">{String(val)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
