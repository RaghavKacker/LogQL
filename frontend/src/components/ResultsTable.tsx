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
      <div className="p-16 text-center text-slate-400 font-mono text-xs border border-dashed border-ide-border rounded-lg m-4">
        No execution output available yet. Run a query using <kbd className="px-1.5 py-0.5 rounded bg-ide-surface text-slate-200 border border-ide-border">Ctrl+Enter</kbd> to inspect output rows.
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
    <div className="space-y-2.5">
      <div className="bg-ide-surface border border-ide-border rounded-lg p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ide-bg border border-ide-border">
            <Clock size={13} className="text-[#7fa1c4]" />
            <span className="text-slate-400">Execution Time:</span>
            <span className="text-slate-100 font-bold">{metrics.executionTimeMs.toFixed(3)} ms</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ide-bg border border-ide-border">
            <Layers size={13} className="text-[#8ea8c9]" />
            <span className="text-slate-400">Scanned:</span>
            <span className="text-slate-200 font-semibold">{metrics.recordsScanned.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ide-bg border border-ide-border">
            <Filter size={13} className="text-[#cfa058]" />
            <span className="text-slate-400">Filtered:</span>
            <span className="text-slate-200 font-semibold">{metrics.recordsFiltered.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#182620] border border-[#284236]">
            <ListOrdered size={13} className="text-[#72b192]" />
            <span className="text-[#85c4a5]">Returned:</span>
            <span className="text-[#72b192] font-bold">
              {metrics.recordsReturned.toLocaleString()} rows ({columns.length} cols)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search returned rows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-ide-bg border border-ide-border rounded-md pl-7 pr-7 py-1 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#4f6b94] w-48 font-mono transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-200"
                title="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={copyJSON}
            disabled={rows.length === 0}
            title="Copy all results to clipboard as JSON"
            className="px-2.5 py-1 rounded-md bg-ide-panel hover:bg-ide-surface border border-ide-border text-xs text-slate-200 hover:text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
          >
            {copiedJSON ? <Check size={12} className="text-[#72b192]" /> : <Copy size={12} className="text-[#8ea8c9]" />}
            <span>{copiedJSON ? "Copied" : "Copy JSON"}</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={rows.length === 0}
            title="Download results as CSV"
            className="px-2.5 py-1 rounded-md bg-ide-panel hover:bg-ide-surface border border-ide-border text-xs text-slate-200 hover:text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
          >
            <Download size={12} className="text-[#7fa1c4]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {searchTerm && (
        <div className="flex items-center justify-between px-3 py-1 bg-ide-surface/60 border border-ide-border rounded-md text-xs font-mono text-slate-300">
          <span>
            Filtering by <strong className="text-white">"{searchTerm}"</strong>: showing {filteredRows.length} of {rows.length} rows
          </span>
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs text-[#7fa1c4] hover:underline"
          >
            Clear Filter
          </button>
        </div>
      )}

      {copiedCellVal !== null && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c2738] border border-[#3e567a] text-slate-100 text-xs font-mono px-3 py-2 rounded-lg shadow-xl flex items-center gap-2">
          <Check size={14} className="text-[#72b192]" />
          <span>Copied to clipboard: <strong>{copiedCellVal.slice(0, 30)}{copiedCellVal.length > 30 ? "..." : ""}</strong></span>
        </div>
      )}

      <div className="border border-ide-border rounded-lg overflow-hidden bg-ide-panel shadow-sm">
        <div className="max-h-[calc(100vh-410px)] min-h-[180px] overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-ide-surface text-slate-300 uppercase tracking-wider sticky top-0 border-b border-ide-border select-none z-10 text-[11px]">
              <tr>
                <th className="py-2 px-3 w-10 text-center text-slate-400 border-r border-ide-border font-semibold">#</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="py-2 px-3 font-semibold text-slate-200 border-r border-ide-border last:border-r-0">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ide-border text-slate-200">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 px-4 text-center text-slate-400 italic">
                    {rows.length === 0 ? (
                      "Query returned 0 records."
                    ) : (
                      <div className="space-y-2">
                        <div>No records match "{searchTerm}".</div>
                        <button
                          onClick={() => setSearchTerm("")}
                          className="px-3 py-1 rounded bg-ide-surface border border-ide-border text-xs text-[#7fa1c4] hover:text-white"
                        >
                          Clear Filter
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-ide-hover/60 transition-colors">
                    <td className="py-2.5 px-4 text-center text-slate-400 border-r border-ide-border select-none font-mono">
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
                          badgeEl = <span className="px-2 py-0.5 rounded-full bg-[#26191a] text-[#db8686] border border-[#482b2d] font-bold">{val}</span>;
                        } else if (val >= 400) {
                          badgeEl = <span className="px-2 py-0.5 rounded-full bg-[#251f15] text-[#d6aa65] border border-[#433726] font-bold">{val}</span>;
                        } else {
                          badgeEl = <span className="px-2 py-0.5 rounded-full bg-[#182620] text-[#85c4a5] border border-[#284236] font-semibold">{val}</span>;
                        }
                      } else if (isLevel && typeof val === "string") {
                        if (val === "ERROR" || val === "FATAL") {
                          badgeEl = <span className="px-2 py-0.5 rounded-md bg-[#26191a] text-[#db8686] border border-[#482b2d] font-bold">{val}</span>;
                        } else if (val === "WARN") {
                          badgeEl = <span className="px-2 py-0.5 rounded-md bg-[#251f15] text-[#d6aa65] border border-[#433726] font-semibold">{val}</span>;
                        } else {
                          badgeEl = <span className="px-2 py-0.5 rounded-md bg-[#192230] text-[#86a6cf] border border-[#2b3a52] font-medium">{val}</span>;
                        }
                      }

                      return (
                        <td
                          key={colIdx}
                          onClick={() => copyCell(val)}
                          title="Click to copy value to clipboard"
                          className="py-2.5 px-4 border-r border-ide-border last:border-r-0 truncate max-w-sm text-[13px] cursor-pointer hover:bg-ide-surface/50 transition-colors"
                        >
                          {badgeEl ? (
                            badgeEl
                          ) : val === null || val === undefined ? (
                            <span className="text-slate-400 italic">null</span>
                          ) : isNumber && !Number.isInteger(val) ? (
                            <span className="text-[#9b8cb8]">{val.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-100">{String(val)}</span>
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
