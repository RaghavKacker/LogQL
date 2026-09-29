import React, { useState } from "react";
import { ResultsData } from "@/lib/api";
import { Clock, Download, Filter, Search, Layers, ListOrdered } from "lucide-react";

interface ResultsTableProps {
  results?: ResultsData;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!results) {
    return (
      <div className="p-12 text-center text-ide-muted font-mono text-xs">
        No execution output available. Execute a query to view returned records.
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

  return (
    <div className="space-y-3">
      {/* Execution Metrics Bar */}
      <div className="bg-ide-surface border border-ide-border rounded p-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-4 text-ide-muted">
          <span className="flex items-center gap-1.5 text-ide-text">
            <Clock size={13} className="text-status-info" />
            <span>Time: <strong>{metrics.executionTimeMs.toFixed(3)} ms</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <Layers size={13} />
            <span>Scanned: <strong className="text-ide-text">{metrics.recordsScanned}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <Filter size={13} />
            <span>Filtered: <strong className="text-ide-text">{metrics.recordsFiltered}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <ListOrdered size={13} />
            <span>Returned: <strong className="text-status-success font-bold">{metrics.recordsReturned}</strong></span>
          </span>
        </div>

        {/* Export & Filter Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2 text-ide-subtle" />
            <input
              type="text"
              placeholder="Search table rows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-ide-bg border border-ide-border rounded pl-7 pr-2.5 py-1 text-[11px] text-ide-text placeholder-ide-subtle focus:outline-none focus:border-status-info w-48 font-mono"
            />
          </div>

          <button
            onClick={exportCSV}
            disabled={rows.length === 0}
            title="Export query results to CSV"
            className="px-2.5 py-1 rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-[11px] text-ide-muted hover:text-ide-text transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download size={12} /> CSV
          </button>
        </div>
      </div>

      {/* Structured Table */}
      <div className="border border-ide-border rounded overflow-hidden bg-ide-panel">
        <div className="max-h-[460px] overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-[11px] font-mono border-collapse">
            <thead className="bg-ide-surface text-ide-muted uppercase tracking-wider sticky top-0 border-b border-ide-border select-none z-10 text-[10px]">
              <tr>
                <th className="py-2 px-3 w-10 text-center text-ide-subtle border-r border-ide-border">#</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="py-2 px-3 font-semibold text-ide-text border-r border-ide-border last:border-r-0">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ide-border text-ide-text">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-8 text-center text-ide-muted italic">
                    {rows.length === 0 ? "Query returned 0 records." : "No records match active search filter."}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-ide-hover/70 transition-colors">
                    <td className="py-1.5 px-3 text-center text-ide-subtle border-r border-ide-border select-none">
                      {rowIdx + 1}
                    </td>
                    {columns.map((col, colIdx) => {
                      const val = row[col];
                      const isStatus = col === "status";
                      const isLevel = col === "level";
                      const isNumber = typeof val === "number";

                      let colorClass = "";
                      if (isStatus) {
                        colorClass = val >= 500 ? "text-status-error font-bold" : val >= 400 ? "text-status-warning" : "text-status-success";
                      } else if (isLevel) {
                        colorClass = val === "ERROR" || val === "FATAL" ? "text-status-error font-bold" : val === "WARN" ? "text-status-warning" : "text-token-keyword";
                      }

                      return (
                        <td
                          key={colIdx}
                          className={`py-1.5 px-3 border-r border-ide-border last:border-r-0 truncate max-w-xs ${colorClass}`}
                        >
                          {val === null || val === undefined ? (
                            <span className="text-ide-subtle italic">null</span>
                          ) : isNumber && !Number.isInteger(val) ? (
                            val.toFixed(2)
                          ) : (
                            String(val)
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
