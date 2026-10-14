import React, { useRef, useState } from "react";
import { Play, Wrench, RotateCcw, Terminal, Database, ChevronDown, Check, Undo2, AlignLeft } from "lucide-react";
import { DatasetInfo } from "@/lib/api";

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
  onSelectDataset
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
    
    // Standardize keywords to uppercase
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

    // Line break before major clauses if on same line
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

  const addQuickClause = (clauseStr: string) => {
    let current = query.trim().replace(/;+$/, "");
    if (!current) {
      current = "SELECT *\nFROM logs";
    }
    const keyword = clauseStr.split(" ")[0].toUpperCase();
    if (current.toUpperCase().includes(keyword)) {
      setQuery(current + "\n" + clauseStr + ";");
    } else {
      setQuery(current + "\n" + clauseStr + ";");
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const lineCount = Math.max(query.split("\n").length, 5);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="bg-ide-panel border border-ide-border rounded-lg flex flex-col overflow-hidden shadow-sm">
      {/* Editor Top Bar */}
      <div className="bg-ide-surface/80 border-b border-ide-border px-3 sm:px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-ide-text font-semibold font-mono text-[11px] uppercase tracking-wider">
            <Terminal size={14} className="text-ide-muted" />
            <span>Query Editor</span>
          </div>

          {datasets && datasets.length > 0 && onSelectDataset && (
            <div className="flex items-center gap-1.5">
              <span className="text-ide-subtle text-[11px] hidden sm:inline">Dataset:</span>
              <div className="relative inline-block">
                <select
                  value={selectedDataset}
                  onChange={(e) => onSelectDataset(e.target.value)}
                  className="appearance-none bg-ide-bg hover:bg-ide-hover border border-ide-border text-ide-text font-mono text-[11px] rounded pl-6 pr-6 py-1 focus:outline-none focus:border-ide-borderLight transition cursor-pointer"
                  title="Select dataset to query"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.recordCount.toLocaleString()} logs)
                    </option>
                  ))}
                </select>
                <Database size={11} className="absolute left-2 top-2 text-ide-muted pointer-events-none" />
                <ChevronDown size={11} className="absolute right-1.5 top-2 text-ide-subtle pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {lastClearedQuery && (
            <button
              onClick={handleUndoClear}
              title="Restore recently cleared query"
              className="px-2 py-1 rounded text-[11px] font-medium text-status-warning hover:bg-ide-hover border border-ide-border transition flex items-center gap-1"
            >
              <Undo2 size={11} /> Undo Clear
            </button>
          )}

          <button
            onClick={formatQuery}
            title="Auto-format and capitalize SQL keywords"
            className="px-2.5 py-1 rounded text-[11px] font-medium text-ide-muted hover:text-white bg-ide-bg hover:bg-ide-hover border border-ide-border transition flex items-center gap-1"
          >
            {copiedFormat ? <Check size={11} className="text-status-success" /> : <AlignLeft size={11} />}
            <span>Format</span>
          </button>

          <button
            onClick={handleClearWithUndo}
            disabled={loading || !query}
            title="Clear query editor"
            className="px-2.5 py-1 rounded text-[11px] font-medium text-ide-muted hover:text-white bg-ide-bg hover:bg-ide-hover border border-ide-border transition flex items-center gap-1 disabled:opacity-40"
          >
            <RotateCcw size={11} />
            <span>Clear</span>
          </button>

          <button
            onClick={onCompile}
            disabled={loading || !query.trim()}
            title="Run compiler stages (Lexer, Parser, Semantics, Optimizer) without running against logs"
            className="px-2.5 py-1 rounded text-[11px] font-medium text-slate-200 hover:text-white bg-ide-surface hover:bg-ide-hover border border-ide-border transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
          >
            <Wrench size={11} className="text-ide-muted" />
            <span>Compile Only</span>
          </button>

          {/* Primary Action Button: RUN QUERY */}
          <button
            onClick={onExecute}
            disabled={loading || !query.trim()}
            title="Compile and execute query against dataset (Ctrl+Enter)"
            className="px-3.5 py-1 rounded text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={11} fill="currentColor" />
            <span>{loading ? "Executing..." : "Run Query"}</span>
            <kbd className="hidden sm:inline-block text-[9px] bg-emerald-700/80 text-emerald-100 px-1 py-0.2 rounded font-mono ml-0.5">Ctrl+↵</kbd>
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex bg-ide-bg font-mono min-h-[105px] max-h-[160px] overflow-hidden">
        {/* Line Numbers */}
        <div className="bg-ide-sidebar/80 text-ide-subtle py-2 px-2.5 text-right select-none border-r border-ide-border text-xs leading-5 w-9">
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
          placeholder="SELECT service, COUNT(*)&#10;FROM logs&#10;WHERE status >= 500&#10;GROUP BY service&#10;ORDER BY COUNT(*) DESC;"
          spellCheck={false}
          className="flex-1 bg-transparent text-ide-text p-2 pl-3 focus:outline-none resize-none leading-5 text-xs sm:text-[13px] font-mono placeholder:text-ide-subtle/60 selection:bg-slate-700"
        />
      </div>

      {/* Helper Footer */}
      <div className="bg-ide-surface/50 border-t border-ide-border px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono select-none">
        <div className="flex items-center gap-1.5 text-ide-muted overflow-x-auto py-0.5">
          <span className="text-ide-subtle text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap">Quick Clauses:</span>
          <button
            onClick={() => addQuickClause("WHERE status >= 500")}
            className="px-1.5 py-0.5 rounded bg-ide-bg hover:bg-ide-hover border border-ide-border text-ide-muted hover:text-white transition whitespace-nowrap text-[10px]"
            title="Add filter: status >= 500"
          >
            + WHERE status &gt;= 500
          </button>
          <button
            onClick={() => addQuickClause("GROUP BY service")}
            className="px-1.5 py-0.5 rounded bg-ide-bg hover:bg-ide-hover border border-ide-border text-ide-muted hover:text-white transition whitespace-nowrap text-[10px]"
            title="Group results by service"
          >
            + GROUP BY service
          </button>
          <button
            onClick={() => addQuickClause("ORDER BY response_time DESC")}
            className="px-1.5 py-0.5 rounded bg-ide-bg hover:bg-ide-hover border border-ide-border text-ide-muted hover:text-white transition whitespace-nowrap text-[10px]"
            title="Sort results descending"
          >
            + ORDER BY response_time DESC
          </button>
          <button
            onClick={() => addQuickClause("LIMIT 20")}
            className="px-1.5 py-0.5 rounded bg-ide-bg hover:bg-ide-hover border border-ide-border text-ide-muted hover:text-white transition whitespace-nowrap text-[10px]"
            title="Limit output rows to 20"
          >
            + LIMIT 20
          </button>
        </div>

        <div className="text-[10px] text-ide-subtle hidden sm:block whitespace-nowrap">
          Tip: Press <kbd className="px-1 py-0.2 rounded bg-ide-bg border border-ide-border text-ide-muted">Ctrl+Enter</kbd> to execute
        </div>
      </div>
    </div>
  );
};
