import React, { useRef } from "react";
import { Play, Wrench, RotateCcw, Terminal } from "lucide-react";

interface QueryEditorProps {
  query: string;
  setQuery: (q: string) => void;
  onExecute: () => void;
  onCompile: () => void;
  onClear: () => void;
  loading: boolean;
  selectedDatasetName?: string;
}

export const QueryEditor: React.FC<QueryEditorProps> = ({
  query,
  setQuery,
  onExecute,
  onCompile,
  onClear,
  loading,
  selectedDatasetName
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onExecute();
    }
  };

  const lineCount = Math.max(query.split("\n").length, 5);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="bg-ide-panel border border-ide-border rounded-lg flex flex-col overflow-hidden shadow-sm">
      {/* Editor Action Toolbar */}
      <div className="bg-ide-surface border-b border-ide-border px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-status-info" />
          <span className="font-semibold font-mono text-[11px] text-ide-text uppercase tracking-wider">
            Query Editor
          </span>
          {selectedDatasetName && (
            <span className="text-[10px] font-mono text-ide-muted px-1.5 py-0.2 rounded bg-ide-panel border border-ide-border">
              FROM: {selectedDatasetName}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onClear}
            disabled={loading}
            title="Clear editor (Ctrl+L)"
            className="px-2.5 py-1 rounded text-[11px] font-medium text-ide-muted hover:text-ide-text hover:bg-ide-hover border border-ide-border transition flex items-center gap-1"
          >
            <RotateCcw size={11} /> Clear
          </button>
          <button
            onClick={onCompile}
            disabled={loading}
            title="Compile through Lexer, Parser, Semantic Analyzer, and Optimizer without running execution"
            className="px-2.5 py-1 rounded text-[11px] font-medium text-token-keyword hover:text-white bg-ide-panel hover:bg-ide-hover border border-ide-borderLight transition flex items-center gap-1 disabled:opacity-50"
          >
            <Wrench size={11} /> Compile
          </button>
          <button
            onClick={onExecute}
            disabled={loading}
            title="Execute query over dataset (Ctrl+Enter)"
            className="px-3 py-1 rounded text-[11px] font-semibold bg-status-info text-white hover:bg-blue-600 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Play size={11} fill="currentColor" />
            {loading ? "Executing..." : "Run"}
            <span className="text-[9px] opacity-75 font-mono ml-0.5">Ctrl+↵</span>
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex bg-ide-bg font-mono text-xs min-h-[140px] max-h-[260px] overflow-hidden">
        {/* Line Numbers Gutter */}
        <div className="bg-ide-panel/80 text-ide-subtle py-3 px-2.5 text-right select-none border-r border-ide-border text-[11px] leading-relaxed">
          {lineNumbers.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="-- Write LogQL query here&#10;SELECT service, COUNT(*)&#10;FROM logs&#10;WHERE status >= 500&#10;GROUP BY service;"
          spellCheck={false}
          className="flex-1 bg-transparent text-ide-text p-3 focus:outline-none resize-none leading-relaxed text-[12px] font-mono selection:bg-ide-active"
        />
      </div>
    </div>
  );
};
