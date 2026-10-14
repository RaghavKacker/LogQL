import React, { useState } from "react";
import { ChevronRight, ChevronDown, Copy, Check, Code, Network } from "lucide-react";

interface AstViewerProps {
  ast?: any;
}

const TreeNode: React.FC<{ data: any; label?: string; depth?: number }> = ({
  data,
  label,
  depth = 0
}) => {
  const [expanded, setExpanded] = useState<boolean>(depth < 4);

  if (data === null || data === undefined) {
    return (
      <div className="text-slate-400 text-xs font-mono py-1">
        {label ? <span className="text-slate-400">{label}: </span> : ""}<span className="italic text-slate-400">null</span>
      </div>
    );
  }

  if (typeof data !== "object") {
    return (
      <div className="text-xs font-mono py-1 flex items-center gap-2">
        {label && <span className="text-slate-400 font-medium">{label}:</span>}
        <span
          className={
            typeof data === "number"
              ? "text-[#cfa058] font-semibold"
              : typeof data === "boolean"
              ? "text-[#72b192] font-semibold"
              : "text-[#8ea8c9] font-medium"
          }
        >
          {JSON.stringify(data)}
        </span>
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const keys = Object.keys(data);
  const nodeType = data.type || (isArray ? `Array[${data.length}]` : "Object");

  return (
    <div className="text-xs font-mono ml-3.5 border-l-2 border-[#28344b] pl-3 py-1">
      <div
        className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none py-1 group"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
        {label && <span className="text-[#9b8cb8] font-semibold">{label}:</span>}
        <span className="bg-[#182333] border border-[#2c3e59] px-2 py-0.5 rounded text-[11px] font-semibold text-[#7fa1c4] group-hover:border-[#3e567a] transition">
          {nodeType}
        </span>
        {!expanded && (
          <span className="text-slate-400 text-xs">
            ({isArray ? `${data.length} items` : `${keys.length} fields`})
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-1 space-y-1">
          {isArray ? (
            data.map((item: any, i: number) => (
              <TreeNode key={i} data={item} label={`[${i}]`} depth={depth + 1} />
            ))
          ) : (
            keys.map((k) => {
              if (k === "type") return null;
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
  const [copied, setCopied] = useState(false);

  if (!ast) {
    return (
      <div className="p-16 text-center text-slate-400 font-mono text-xs border border-dashed border-ide-border rounded-lg">
        No AST representation available. Compile or run a query to inspect the Bison LALR(1) syntax tree.
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(ast, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-slate-400 border-b border-ide-border pb-2 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span>Parser Engine:</span>
            <strong className="text-slate-100 bg-ide-surface px-2 py-0.5 rounded border border-ide-border">Bison 3.8 (LALR(1))</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span>Root Node:</span>
            <strong className="text-[#7fa1c4] font-semibold">{ast.type || "QueryNode"}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            title="Copy AST JSON to clipboard"
            className="px-2.5 py-1 rounded-md bg-ide-surface hover:bg-ide-hover border border-ide-border text-slate-300 hover:text-white transition flex items-center gap-1 text-xs shadow-sm"
          >
            {copied ? <Check size={12} className="text-[#72b192]" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy JSON"}
          </button>

          <div className="flex items-center bg-ide-bg border border-ide-border rounded-md p-0.5">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-2.5 py-0.5 rounded text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === "tree" ? "bg-ide-panel text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <Network size={12} /> Tree
            </button>
            <button
              onClick={() => setViewMode("json")}
              className={`px-2.5 py-0.5 rounded text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === "json" ? "bg-ide-panel text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <Code size={12} /> JSON IR
            </button>
          </div>
        </div>
      </div>

      {viewMode === "tree" ? (
        <div className="bg-ide-panel border border-ide-border rounded-lg p-3 max-h-[calc(100vh-410px)] min-h-[180px] overflow-y-auto shadow-sm">
          <TreeNode data={ast} />
        </div>
      ) : (
        <pre className="bg-ide-panel border border-ide-border rounded-lg p-3 text-xs font-mono text-slate-100 max-h-[calc(100vh-410px)] min-h-[180px] overflow-y-auto leading-relaxed shadow-sm">
          {JSON.stringify(ast, null, 2)}
        </pre>
      )}
    </div>
  );
};
