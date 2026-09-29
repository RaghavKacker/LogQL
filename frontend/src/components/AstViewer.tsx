import React, { useState } from "react";
import { ChevronRight, ChevronDown, Code, Network } from "lucide-react";

interface AstViewerProps {
  ast?: any;
}

const TreeNode: React.FC<{ data: any; label?: string; depth?: number }> = ({ data, label, depth = 0 }) => {
  const [expanded, setExpanded] = useState<boolean>(depth < 3);

  if (data === null || data === undefined) {
    return (
      <div className="text-gray-500 italic text-xs font-mono py-0.5">
        {label ? `${label}: ` : ""}null
      </div>
    );
  }

  if (typeof data !== "object") {
    return (
      <div className="text-xs font-mono py-0.5 flex items-center gap-1.5">
        {label && <span className="text-indigo-400 font-semibold">{label}:</span>}
        <span className={typeof data === "number" ? "text-amber-400 font-bold" : typeof data === "boolean" ? "text-emerald-400" : "text-sky-300"}>
          {JSON.stringify(data)}
        </span>
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const keys = Object.keys(data);
  const nodeType = data.type || (isArray ? `Array[${data.length}]` : "Object");

  return (
    <div className="text-xs font-mono ml-3 border-l border-dark-border/80 pl-2.5 py-1">
      <div
        className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white group select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        {label && <span className="text-indigo-300 font-medium">{label}:</span>}
        <span className="bg-dark-card border border-dark-border px-2 py-0.5 rounded text-[11px] font-semibold text-brand-cyan group-hover:border-cyan-500/50 transition">
          {nodeType}
        </span>
        {!expanded && (
          <span className="text-gray-500 text-[10px]">
            ({isArray ? `${data.length} items` : `${keys.length} fields`})
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-1 space-y-0.5">
          {isArray ? (
            data.map((item: any, i: number) => (
              <TreeNode key={i} data={item} label={`[${i}]`} depth={depth + 1} />
            ))
          ) : (
            keys.map((k) => {
              if (k === "type") return null; // Already shown in badge
              return <TreeNode key={k} data={data[k]} label={k} depth={depth + 1} />;
            })
          )}
        </div>
      )}
    </div>
  );
};

export const AstViewer: React.FC<AstViewerProps> = ({ ast }) => {
  const [viewMode, setViewMode] = useState<"tree" | "json">("tree");

  if (!ast) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        No AST generated yet. Parse a query to inspect the LALR(1) syntax tree.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-400 border-b border-dark-border pb-3">
        <span>Parser Source: <code className="text-brand-cyan">compiler/parser.y (Bison 3.8 LALR(1))</code></span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("tree")}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === "tree" ? "bg-indigo-600 text-white" : "bg-dark-card text-gray-400 hover:text-white"
            }`}
          >
            <Network size={14} /> Tree Visualizer
          </button>
          <button
            onClick={() => setViewMode("json")}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === "json" ? "bg-indigo-600 text-white" : "bg-dark-card text-gray-400 hover:text-white"
            }`}
          >
            <Code size={14} /> JSON IR
          </button>
        </div>
      </div>

      {viewMode === "tree" ? (
        <div className="bg-dark-input/60 border border-dark-border rounded-xl p-4 max-h-[550px] overflow-y-auto">
          <TreeNode data={ast} />
        </div>
      ) : (
        <pre className="bg-dark-input/80 border border-dark-border rounded-xl p-4 text-xs font-mono text-emerald-400 max-h-[550px] overflow-y-auto">
          {JSON.stringify(ast, null, 2)}
        </pre>
      )}
    </div>
  );
};
