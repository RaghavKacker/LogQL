import React, { useRef, useState } from "react";
import { Play, RotateCcw, ChevronDown, Check, Undo2, AlignLeft, Sparkles, Database, FileCode } from "lucide-react";
import { DatasetInfo } from "@/lib/api";

export const PRESET_QUERIES = [
  {
    name: "Server Errors by Service (5xx)",
    query: `SELECT service, COUNT(*)\nFROM logs\nWHERE status >= 500\nGROUP BY service\nORDER BY COUNT(*) DESC;`
  },
  {
    name: "Slow Requests (> 200ms)",
    query: `SELECT timestamp, service, path, response_time\nFROM logs\nWHERE response_time > 200.0\nORDER BY response_time DESC\nLIMIT 15;`
  },
  {
    name: "Optimizer Pass Demo (Constant Folding & Dedup)",
    query: `SELECT path, AVG(response_time)\nFROM logs\nWHERE status = 200 + 300 AND status >= 500\nGROUP BY path\nORDER BY AVG(response_time) DESC;`
  },
  {
    name: "Scan Recent Logs (SELECT * LIMIT 10)",
    query: `SELECT *\nFROM logs\nLIMIT 10;`
  },
  {
    name: "Semantic Error Demo (Invalid Column)",
    query: `SELECT non_existent_column\nFROM logs;`
  },
  {
    name: "Group By Invariant Demo (Ungrouped Field)",
    query: `SELECT service, path, COUNT(*)\nFROM logs\nGROUP BY service;`
  }
];

interface QueryEditorProps {
  query: string;
  setQuery: (q: string) => void;
  onExecute: () => void;
  onCompile: () => void;
  onClear: () => void;
  loading: boolean;
  datasets?: DatasetInfo[];
  selectedDataset?: string;
  onSelectDataset?: (id: string) => void;
  onSelectPreset?: (q: string) => void;
  onExport?: () => void;
}

export const QueryEditor: React.FC<QueryEditorProps> = ({
  query,
  setQuery,
  onExecute,
  onCompile,
  onClear,
  loading,
  datasets,
  selectedDataset,
  onSelectDataset,
  onSelectPreset,
  onExport
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lastClearedQuery, setLastClearedQuery] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onExecute();
    }
  };

  const handleClearWithUndo = () => {
    if (query.trim()) {
      setLastClearedQuery(query);
      onClear();
    }
  };

  const handleUndoClear = () => {
    if (lastClearedQuery) {
      setQuery(lastClearedQuery);
      setLastClearedQuery(null);
    }
  };

  const formatQuery = () => {
    if (!query.trim()) return;
    let text = query.trim().replace(/;+$/, "");
    
    const keywordMap: Record<string, string> = {
      "\\bselect\\b": "SELECT",
      "\\bfrom\\b": "FROM",
      "\\bwhere\\b": "WHERE",
      "\\bgroup\\s+by\\b": "GROUP BY",
      "\\border\\s+by\\b": "ORDER BY",
      "\\blimit\\b": "LIMIT",
      "\\band\\b": "AND",
      "\\bor\\b": "OR",
      "\\bnot\\b": "NOT",
      "\\basc\\b": "ASC",
      "\\bdesc\\b": "DESC",
      "\\bcount\\b": "COUNT",
      "\\bavg\\b": "AVG",
      "\\bsum\\b": "SUM",
      "\\bmin\\b": "MIN",
      "\\bmax\\b": "MAX",
    };

    for (const [pattern, replacement] of Object.entries(keywordMap)) {
      text = text.replace(new RegExp(pattern, "gi"), replacement);
    }

    const majorClauses = ["FROM", "WHERE", "GROUP BY", "ORDER BY", "LIMIT"];
    for (const clause of majorClauses) {
      const regex = new RegExp(`(?<!\\n)\\s*\\b(${clause})\\b`, "g");
      text = text.replace(regex, "\n$1");
    }

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const formatted = lines.join("\n") + ";";
    setQuery(formatted);
    setCopiedFormat(true);
    setTimeout(() => setCopiedFormat(false), 1200);
  };

  const lineCount = Math.max(query.split("\n").length, 5);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="bg-ide-panel border border-ide-border rounded-lg flex flex-col overflow-hidden shadow-sm">
      {/* Clean, Organized Controls Bar */}
      <div className="bg-ide-surface/60 border-b border-ide-border px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Dataset & Example Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {datasets && datasets.length > 0 && onSelectDataset && (
            <div className="relative inline-block">
              <select
                value={selectedDataset}
                onChange={(e) => onSelectDataset(e.target.value)}
                className="appearance-none bg-ide-bg hover:bg-ide-surface border border-ide-border text-ide-text font-medium text-xs rounded-md pl-7 pr-7 py-1.5 focus:outline-none focus:border-ide-borderLight transition cursor-pointer"
                title="Select target dataset"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.recordCount.toLocaleString()} logs)
                  </option>
                ))}
              </select>
              <Database size={13} className="absolute left-2.5 top-2.5 text-ide-subtle pointer-events-none" />
              <ChevronDown size={13} className="absolute right-2 top-2.5 text-ide-subtle pointer-events-none" />
            </div>
          )}

          {/* Example Queries Dropdown */}
          <div className="relative inline-block">
            <select
              defaultValue=""
              onChange={(e) => {
                const found = PRESET_QUERIES.find(p => p.name === e.target.value);
                if (found) {
                  if (onSelectPreset) onSelectPreset(found.query);
                  else setQuery(found.query);
                }
                e.target.value = "";
              }}
              className="appearance-none bg-ide-bg hover:bg-ide-surface border border-ide-border text-ide-muted hover:text-ide-text text-xs rounded-md pl-7 pr-7 py-1.5 focus:outline-none focus:border-ide-borderLight transition cursor-pointer"
              title="Load an example query"
            >
              <option value="" disabled>Load Example Query...</option>
              {PRESET_QUERIES.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            <Sparkles size={13} className="absolute left-2.5 top-2.5 text-ide-subtle pointer-events-none" />
            <ChevronDown size={13} className="absolute right-2 top-2.5 text-ide-subtle pointer-events-none" />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {lastClearedQuery && (
            <button
              onClick={handleUndoClear}
              title="Restore cleared query"
              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-status-warning hover:bg-ide-surface border border-ide-border transition flex items-center gap-1.5"
            >
              <Undo2 size={13} />
              <span>Undo Clear</span>
            </button>
          )}

          <button
            onClick={formatQuery}
            title="Auto-format and capitalize keywords"
            className="px-2.5 py-1.5 rounded-md text-xs font-medium text-ide-muted hover:text-white bg-ide-bg hover:bg-ide-surface border border-ide-border transition flex items-center gap-1.5"
          >
            {copiedFormat ? <Check size={13} className="text-status-success" /> : <AlignLeft size={13} />}
            <span>Format</span>
          </button>

          <button
            onClick={handleClearWithUndo}
            disabled={loading || !query}
            title="Clear editor"
            className="px-2.5 py-1.5 rounded-md text-xs font-medium text-ide-muted hover:text-white bg-ide-bg hover:bg-ide-surface border border-ide-border transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <RotateCcw size={13} />
            <span>Clear</span>
          </button>

          {onExport && (
            <button
              onClick={onExport}
              title="Export query as runnable Python, C++, or cURL code"
              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 transition flex items-center gap-1.5"
            >
              <FileCode size={13} className="text-cyan-400" />
              <span>Export Code</span>
            </button>
          )}

          {/* Primary Action Button */}
          <button
            onClick={onExecute}
            disabled={loading || !query.trim()}
            title="Execute query over dataset (Ctrl+Enter)"
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={12} fill="currentColor" />
            <span>{loading ? "Running..." : "Run Query"}</span>
            <kbd className="hidden sm:inline-block text-[10px] bg-emerald-700/80 text-emerald-100 px-1.5 py-0.2 rounded font-mono ml-0.5">Ctrl+↵</kbd>
          </button>
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="flex bg-ide-bg font-mono min-h-[120px] max-h-[200px] overflow-hidden">
        {/* Line Numbers */}
        <div className="bg-ide-surface/30 text-ide-subtle py-2.5 px-3 text-right select-none border-r border-ide-border text-xs leading-6 w-10">
          {lineNumbers.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a LogQL query (e.g. SELECT service, COUNT(*) FROM logs WHERE status >= 500 GROUP BY service;)"
          spellCheck={false}
          className="flex-1 bg-transparent text-ide-text p-2.5 pl-3.5 focus:outline-none resize-none leading-6 text-xs sm:text-sm font-mono placeholder:text-ide-subtle/50 selection:bg-slate-700"
        />
      </div>
    </div>
  );
};
