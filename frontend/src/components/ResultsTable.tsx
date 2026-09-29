import React, { useState } from "react";
import { ResultsData } from "@/lib/api";
import { Clock, Filter, Layers, ListOrdered } from "lucide-react";

interface ResultsTableProps {
  results?: ResultsData;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!results) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        No execution results yet. Run a query over a dataset to inspect returned rows.
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

  return (
    <div className="space-y-4">
      {/* Metrics Header Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-dark-card border border-dark-border p-3 rounded-xl text-xs font-mono">
        <div className="flex items-center gap-2 text-gray-300">
          <Clock size={15} className="text-brand-cyan" />
          <span>Execution: <strong className="text-white">{metrics.executionTimeMs.toFixed(3)} ms</strong></span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Layers size={15} className="text-indigo-400" />
          <span>Scanned: <strong className="text-white">{metrics.recordsScanned}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Filter size={15} className="text-rose-400" />
          <span>Filtered: <strong className="text-white">{metrics.recordsFiltered}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <ListOrdered size={15} className="text-emerald-400" />
          <span>Returned: <strong className="text-emerald-400 font-bold">{metrics.recordsReturned}</strong></span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Filter returned rows..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-dark-input border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 max-w-xs w-full font-mono"
        />
        <div className="text-xs text-gray-400 font-mono">
          Showing {filteredRows.length} of {rows.length} rows
        </div>
      </div>

      {/* Table */}
      <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-card shadow-sm">
        <div className="max-h-[500px] overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-dark-input/80 text-gray-400 uppercase tracking-wider sticky top-0 border-b border-dark-border z-10">
              <tr>
                <th className="p-3 w-12 text-center text-gray-500">#</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="p-3 font-semibold text-gray-200">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50 text-gray-300">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-8 text-center text-gray-500 italic">
                    {rows.length === 0 ? "Query returned 0 matching records." : "No records match search filter."}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-dark-bg/60 transition-colors">
                    <td className="p-3 text-center text-gray-500 select-none">{rowIdx + 1}</td>
                    {columns.map((col, colIdx) => {
                      const val = row[col];
                      const isStatus = col === "status";
                      const isLevel = col === "level";
                      const isNumber = typeof val === "number";

                      let badgeClass = "";
                      if (isStatus) {
                        badgeClass = val >= 500 ? "text-rose-400 font-bold" : val >= 400 ? "text-amber-400" : "text-emerald-400";
                      } else if (isLevel) {
                        badgeClass = val === "ERROR" ? "text-rose-400 font-bold" : val === "WARN" ? "text-amber-400" : "text-sky-300";
                      }

                      return (
                        <td key={colIdx} className={`p-3 truncate max-w-xs ${badgeClass}`}>
                          {val === null || val === undefined ? (
                            <span className="text-gray-600 italic">null</span>
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
