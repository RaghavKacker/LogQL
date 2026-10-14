import React, { useState } from "react";
import { ResultsData } from "@/lib/api";
import { Clock, Download, Filter, Search, Layers, ListOrdered, Check, Copy, X } from "lucide-react";

interface ResultsTableProps {
  results?: ResultsData;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [copiedCellVal, setCopiedCellVal] = useState<string | null>(null);

  if (!results) {
    return (
      <div className="p-16 text-center text-ide-muted font-mono text-xs border border-dashed border-ide-border rounded-lg m-2">
        <p className="text-sm font-semibold text-ide-text mb-1">No execution output yet</p>
        <p className="text-ide-subtle text-xs">
          Write a query and click <strong className="text-emerald-400">Run Query</strong> or press <kbd className="px-1.5 py-0.5 rounded bg-ide-surface text-slate-200 border border-ide-border">Ctrl+Enter</kbd> to inspect output rows.
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
    <div className="space-y-3">
      {/* Execution Metrics Bar */}
      <div className="bg-ide-surface/80 border border-ide-border rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-ide-bg border border-ide-border">
            <Clock size={13} className="text-ide-muted" />
            <span className="text-ide-subtle">Runtime:</span>
            <span className="text-ide-text font-semibold">{metrics.executionTimeMs.toFixed(3)} ms</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-ide-bg border border-ide-border">
            <Layers size={13} className="text-ide-muted" />
            <span className="text-ide-subtle">Scanned:</span>
            <span className="text-ide-text font-medium">{metrics.recordsScanned.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-ide-bg border border-ide-border">
            <Filter size={13} className="text-ide-muted" />
            <span className="text-ide-subtle">Filtered:</span>
            <span className="text-ide-text font-medium">{metrics.recordsFiltered.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-ide-bg border border-ide-border">
            <ListOrdered size={13} className="text-status-success" />
            <span className="text-ide-subtle">Returned:</span>
            <span className="text-emerald-400 font-semibold">
              {metrics.recordsReturned.toLocaleString()} rows ({columns.length} cols)
            </span>
          </div>
        </div>

        {/* Search & Export Buttons */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2 text-ide-subtle" />
            <input
              type="text"
              placeholder="Filter results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-ide-bg border border-ide-border rounded pl-7 pr-7 py-1 text-xs text-ide-text placeholder-ide-subtle focus:outline-none focus:border-ide-borderLight w-44 font-mono transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1.5 text-ide-subtle hover:text-white"
                title="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={copyJSON}
            disabled={rows.length === 0}
            title="Copy all results as JSON"
            className="px-2.5 py-1 rounded bg-ide-bg hover:bg-ide-surface border border-ide-border text-xs text-ide-muted hover:text-white transition flex items-center gap-1.5 disabled:opacity-40"
          >
            {copiedJSON ? <Check size={12} className="text-status-success" /> : <Copy size={12} />}
            <span>{copiedJSON ? "Copied" : "JSON"}</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={rows.length === 0}
            title="Download results as CSV"
            className="px-2.5 py-1 rounded bg-ide-bg hover:bg-ide-surface border border-ide-border text-xs text-ide-muted hover:text-white transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download size={12} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {searchTerm && (
        <div className="flex items-center justify-between px-3 py-1 bg-ide-surface border border-ide-border rounded text-xs font-mono text-ide-muted">
          <span>
            Filtering by <strong className="text-white">"{searchTerm}"</strong>: showing {filteredRows.length} of {rows.length} rows
          </span>
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs text-ide-text hover:underline"
          >
            Clear Filter
          </button>
        </div>
      )}

      {copiedCellVal !== null && (
        <div className="fixed bottom-6 right-6 z-50 bg-ide-surface border border-ide-borderLight text-ide-text text-xs font-mono px-3 py-2 rounded-lg shadow-xl flex items-center gap-2">
          <Check size={14} className="text-status-success" />
          <span>Copied: <strong>{copiedCellVal.slice(0, 30)}{copiedCellVal.length > 30 ? "..." : ""}</strong></span>
        </div>
      )}

      {/* Main Results Table */}
      <div className="border border-ide-border rounded-lg overflow-hidden bg-ide-panel shadow-sm">
        <div className="max-h-[calc(100vh-390px)] min-h-[180px] overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-ide-surface/90 text-ide-muted uppercase tracking-wider sticky top-0 border-b border-ide-border select-none z-10 text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center text-ide-subtle border-r border-ide-border font-medium">#</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="py-2.5 px-3 font-semibold text-slate-200 border-r border-ide-border last:border-r-0">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ide-border text-slate-200">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 px-4 text-center text-ide-muted italic">
                    {rows.length === 0 ? (
                      "Query returned 0 records."
                    ) : (
                      <div className="space-y-2">
                        <div>No records match "{searchTerm}".</div>
                        <button
                          onClick={() => setSearchTerm("")}
                          className="px-3 py-1 rounded bg-ide-surface border border-ide-border text-xs text-ide-text hover:bg-ide-hover"
                        >
                          Clear Filter
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-ide-hover/50 transition-colors">
                    <td className="py-2 px-3 text-center text-ide-subtle border-r border-ide-border select-none font-mono text-[11px]">
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
                          badgeEl = <span className="px-2 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-800/80 font-bold text-[11px]">{val}</span>;
                        } else if (val >= 400) {
                          badgeEl = <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80 font-bold text-[11px]">{val}</span>;
                        } else {
                          badgeEl = <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 font-medium text-[11px]">{val}</span>;
                        }
                      } else if (isLevel && typeof val === "string") {
                        if (val === "ERROR" || val === "FATAL") {
                          badgeEl = <span className="px-2 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-800/80 font-bold text-[11px]">{val}</span>;
                        } else if (val === "WARN") {
                          badgeEl = <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80 font-semibold text-[11px]">{val}</span>;
                        } else {
                          badgeEl = <span className="px-2 py-0.5 rounded bg-ide-surface text-slate-300 border border-ide-border font-medium text-[11px]">{val}</span>;
                        }
                      }

                      return (
                        <td
                          key={colIdx}
                          onClick={() => copyCell(val)}
                          title="Click to copy value"
                          className="py-2 px-3 border-r border-ide-border last:border-r-0 truncate max-w-sm text-xs cursor-pointer hover:bg-ide-surface/60 transition-colors"
                        >
                          {badgeEl ? (
                            badgeEl
                          ) : val === null || val === undefined ? (
                            <span className="text-ide-subtle italic">null</span>
                          ) : isNumber && !Number.isInteger(val) ? (
                            <span className="text-purple-300 font-mono">{val.toFixed(2)}</span>
                          ) : (
                            <span className="text-ide-text font-mono">{String(val)}</span>
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
