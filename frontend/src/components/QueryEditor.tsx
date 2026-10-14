import React, { useRef, useState } from "react";
import { Play, Wrench, RotateCcw, Terminal, Database, ChevronDown, Sparkles, Undo2, Check } from "lucide-react";
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
    
    // Replace lowercase keywords with standard uppercase keywords
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
      // Append with newline
      setQuery(current + "\n" + clauseStr + ";");
    } else {
      setQuery(current + "\n" + clauseStr + ";");
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const lineCount = Math.max(query.split("\n").length, 6);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const activeDatasetObj = datasets?.find(d => d.id === selectedDataset);

  return (
    <div className="bg-ide-panel border border-ide-border rounded-lg flex flex-col overflow-hidden shadow-md">
      <div className="bg-ide-surface border-b border-ide-border px-3 sm:px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Terminal size={14} className="text-[#7fa1c4]" />
            <span className="font-semibold font-mono text-[11px] text-slate-200 uppercase tracking-wider">
              Query Editor
            </span>
          </div>

          {datasets && datasets.length > 0 && onSelectDataset && (
            <div className="relative flex items-center">
              <span className="text-slate-400 text-[10px] mr-1 hidden sm:inline">Target:</span>
              <div className="relative inline-block">
                <select
                  value={selectedDataset}
                  onChange={(e) => onSelectDataset(e.target.value)}
                  className="appearance-none bg-ide-bg hover:bg-[#1a2333] border border-ide-border hover:border-[#384d6e] text-slate-100 font-mono text-[11px] rounded pl-6 pr-6 py-0.5 focus:outline-none transition cursor-pointer"
                  title="Switch dataset to execute query against"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.recordCount.toLocaleString()} logs)
                    </option>
                  ))}
                </select>
                <Database size={11} className="absolute left-2 top-1.5 text-[#7fa1c4] pointer-events-none" />
                <ChevronDown size={11} className="absolute right-1.5 top-1.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {lastClearedQuery && (
            <button
              onClick={handleUndoClear}
              title="Restore recently cleared query"
              className="px-2 py-1 rounded text-[11px] font-medium text-[#cfa058] hover:text-[#e4b56c] hover:bg-ide-hover border border-[#4a3920] transition flex items-center gap-1 animate-pulse"
            >
              <Undo2 size={11} /> Undo Clear
            </button>
          )}

          <button
            onClick={formatQuery}
            title="Auto-format and capitalize SQL clauses"
            className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-ide-hover border border-ide-border transition flex items-center gap-1"
          >
            {copiedFormat ? <Check size={11} className="text-[#72b192]" /> : <Sparkles size={11} className="text-[#7fa1c4]" />}
            <span>Format</span>
          </button>

          <button
            onClick={handleClearWithUndo}
            disabled={loading || !query}
            title="Clear editor (with undo option)"
            className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-ide-hover border border-ide-border transition flex items-center gap-1 disabled:opacity-40"
          >
            <RotateCcw size={11} /> Clear
          </button>

          <button
            onClick={onCompile}
            disabled={loading || !query.trim()}
            title="Run through Lexer, Parser, Semantic Analyzer, and Optimizer without querying data"
            className="px-2.5 py-1 rounded text-[11px] font-medium text-[#8ea8c9] hover:text-white bg-[#1a2332] hover:bg-[#202c3e] border border-[#31425d] transition flex items-center gap-1 shadow-sm disabled:opacity-50"
          >
            <Wrench size={11} /> Compile Only
          </button>

          <button
            onClick={onExecute}
            disabled={loading || !query.trim()}
            title="Execute query over selected dataset (Ctrl+Enter / Cmd+Enter)"
            className="px-3 py-1 rounded text-[11px] font-semibold bg-[#486588] hover:bg-[#55769d] text-slate-100 transition flex items-center gap-1.5 shadow-sm hover:shadow-[#486588]/20 disabled:opacity-50"
          >
            <Play size={11} fill="currentColor" />
            {loading ? "Executing..." : "Run Query"}
            <span className="text-[9px] bg-[#3b5472] text-slate-200 px-1 py-0.1 rounded font-mono ml-0.5">Ctrl+↵</span>
          </button>
        </div>
      </div>

      <div className="flex bg-ide-bg font-mono min-h-[105px] max-h-[160px] overflow-hidden">
        <div className="bg-ide-sidebar text-slate-400 py-2 px-2.5 text-right select-none border-r border-ide-border text-xs leading-5">
          {lineNumbers.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="SELECT service, COUNT(*)&#10;FROM logs&#10;WHERE status >= 500&#10;GROUP BY service;"
          spellCheck={false}
          className="flex-1 bg-transparent text-slate-200 p-2 pl-2.5 focus:outline-none resize-none leading-5 text-xs sm:text-[13px] font-mono selection:bg-[#344865]"
        />
      </div>

      <div className="bg-ide-surface/70 border-t border-ide-border px-3 py-1 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono select-none">
        <div className="flex items-center gap-1.5 text-slate-400 overflow-x-auto py-0.5">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap">Quick Insert:</span>
          <button
            onClick={() => addQuickClause("WHERE status >= 500")}
            className="px-1.5 py-0.5 rounded bg-ide-bg hover:bg-ide-panel border border-ide-border hover:border-slate-600 text-slate-300 hover:text-white transition whitespace-nowrap"
            title="Filter by status >= 500"
          >
            + WHERE status &gt;= 500
          </button>
          <button
            onClick={() => addQuickClause("GROUP BY service")}
            className="px-1.5 py-0.5 rounded bg-ide-bg hover:bg-ide-panel border border-ide-border hover:border-slate-600 text-slate-300 hover:text-white transition whitespace-nowrap"
            title="Group results by service"
          >
            + GROUP BY service
          </button>
          <button
            onClick={() => addQuickClause("ORDER BY response_time DESC")}
            className="px-1.5 py-0.5 rounded bg-ide-bg hover:bg-ide-panel border border-ide-border hover:border-slate-600 text-slate-300 hover:text-white transition whitespace-nowrap"
            title="Sort results descending"
          >
            + ORDER BY response_time DESC
          </button>
          <button
            onClick={() => addQuickClause("LIMIT 20")}
            className="px-1.5 py-0.5 rounded bg-ide-bg hover:bg-ide-panel border border-ide-border hover:border-slate-600 text-slate-300 hover:text-white transition whitespace-nowrap"
            title="Limit to 20 rows"
          >
            + LIMIT 20
          </button>
        </div>

        <div className="text-[10px] text-slate-400 hidden sm:block whitespace-nowrap">
          Press <kbd className="px-1 py-0.2 rounded bg-ide-bg border border-ide-border text-slate-300">Ctrl+Enter</kbd> to execute
        </div>
      </div>
    </div>
  );
};

