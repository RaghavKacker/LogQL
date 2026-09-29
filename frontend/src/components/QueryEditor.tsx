import React from "react";
import { Play, RotateCcw, Wrench, Sparkles, Terminal } from "lucide-react";

interface QueryEditorProps {
  query: string;
  setQuery: (q: string) => void;
  onExecute: () => void;
  onCompile: () => void;
  onClear: () => void;
  loading: boolean;
}

const PRESET_QUERIES = [
  {
    name: "5xx Errors by Service",
    description: "Aggregation + GROUP BY + Sorting",
    query: `SELECT service, COUNT(*)\nFROM logs\nWHERE status >= 500\nGROUP BY service\nORDER BY COUNT(*) DESC;`
  },
  {
    name: "High Latency (>200ms)",
    description: "Projection + Float Filter + Limit",
    query: `SELECT timestamp, service, path, response_time\nFROM logs\nWHERE response_time > 200.0\nORDER BY response_time DESC\nLIMIT 15;`
  },
  {
    name: "Optimizer Demonstration",
    description: "Constant Folding & Deduplication",
    query: `SELECT path, AVG(response_time)\nFROM logs\nWHERE status = 200 + 300 AND status >= 500\nGROUP BY path\nORDER BY AVG(response_time) DESC;`
  },
  {
    name: "Full Schema Scan",
    description: "SELECT * wildcard",
    query: `SELECT *\nFROM logs\nLIMIT 10;`
  },
  {
    name: "Semantic Error: Unknown Col",
    description: "Fails schema validation",
    query: `SELECT non_existent_column\nFROM logs;`
  },
  {
    name: "Semantic Error: Ungrouped Scalar",
    description: "Fails GROUP BY validation",
    query: `SELECT service, path, COUNT(*)\nFROM logs\nGROUP BY service;`
  }
];

export const QueryEditor: React.FC<QueryEditorProps> = ({
  query,
  setQuery,
  onExecute,
  onCompile,
  onClear,
  loading
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onExecute();
    }
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Editor Header */}
      <div className="bg-dark-input/90 border-b border-dark-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-brand-cyan" />
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider font-mono">
            LogQL Query Editor
          </span>
          <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
            (Press Ctrl+Enter to execute)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white bg-dark-bg hover:bg-dark-border border border-dark-border transition"
          >
            <RotateCcw size={13} /> Clear
          </button>
          <button
            onClick={onCompile}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 transition disabled:opacity-50"
          >
            <Wrench size={13} /> Compile Only
          </button>
          <button
            onClick={onExecute}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-gray-950 bg-gradient-to-r from-cyan-400 to-brand-cyan hover:from-cyan-300 hover:to-cyan-400 shadow-md shadow-cyan-900/30 transition disabled:opacity-50"
          >
            <Play size={13} fill="currentColor" /> {loading ? "Running..." : "Run Query"}
          </button>
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="relative">
        <textarea
          rows={6}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a declarative LogQL query (e.g., SELECT service, COUNT(*) FROM logs WHERE status >= 500 GROUP BY service;)"
          className="w-full bg-[#080d1a] text-gray-100 font-mono text-sm p-4 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-y leading-relaxed selection:bg-indigo-600 selection:text-white"
          spellCheck={false}
        />
      </div>

      {/* Preset Query Shortcuts */}
      <div className="bg-dark-input/60 border-t border-dark-border/80 px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 whitespace-nowrap">
          <Sparkles size={13} className="text-amber-400" /> Query Presets:
        </span>
        <div className="flex items-center gap-2">
          {PRESET_QUERIES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(p.query)}
              title={p.description}
              className="text-[11px] font-mono whitespace-nowrap px-2.5 py-1 rounded-md bg-dark-bg hover:bg-dark-border border border-dark-border text-gray-300 hover:text-cyan-300 transition"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
