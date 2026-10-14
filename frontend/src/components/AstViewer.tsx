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
  const [expanded, setExpanded] = useState<boolean>(depth < 3);

  if (data === null || data === undefined) {
    return (
      <div className="text-ide-subtle text-xs font-mono py-1">
        {label ? <span className="text-ide-muted">{label}: </span> : ""}<span className="italic">null</span>
      </div>
    );
  }

  if (typeof data !== "object") {
    return (
      <div className="text-xs font-mono py-1 flex items-center gap-2">
        {label && <span className="text-ide-muted font-medium">{label}:</span>}
        <span
          className={
            typeof data === "number"
              ? "text-amber-400 font-semibold"
              : typeof data === "boolean"
              ? "text-emerald-400 font-semibold"
              : "text-ide-text font-medium"
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
    <div className="text-xs font-mono ml-3 border-l border-ide-border pl-3 py-0.5">
      <div
        className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none py-1 group"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={13} className="text-ide-subtle" /> : <ChevronRight size={13} className="text-ide-subtle" />}
        {label && <span className="text-purple-300 font-medium">{label}:</span>}
        <span className="bg-ide-surface border border-ide-border px-2 py-0.5 rounded text-[11px] font-semibold text-ide-text group-hover:border-ide-borderLight transition">
          {nodeType}
        </span>
        {!expanded && (
          <span className="text-ide-subtle text-[11px]">
            ({isArray ? `${data.length} items` : `${keys.length} fields`})
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-0.5 space-y-0.5">
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
      <div className="p-16 text-center text-ide-muted font-mono text-xs border border-dashed border-ide-border rounded-lg">
        <p className="text-sm font-semibold text-ide-text mb-1">No AST representation available</p>
        <p className="text-ide-subtle text-xs">Run or compile a query to inspect the Bison LALR(1) syntax tree.</p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(ast, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-ide-muted border-b border-ide-border pb-2.5 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="text-ide-subtle">Parser:</span>
            <strong className="text-ide-text bg-ide-surface px-2 py-0.5 rounded border border-ide-border font-medium">Bison 3.8 (LALR(1))</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-ide-subtle">Root:</span>
            <strong className="text-ide-text font-semibold">{ast.type || "QueryNode"}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            title="Copy AST JSON to clipboard"
            className="px-2.5 py-1 rounded bg-ide-bg hover:bg-ide-surface border border-ide-border text-ide-muted hover:text-white transition flex items-center gap-1 text-xs shadow-sm"
          >
            {copied ? <Check size={12} className="text-status-success" /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy JSON"}</span>
          </button>

          <div className="flex items-center bg-ide-bg border border-ide-border rounded p-0.5">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-2.5 py-0.5 rounded text-xs font-medium flex items-center gap-1 transition ${
                viewMode === "tree" ? "bg-ide-surface text-ide-text shadow-sm" : "text-ide-subtle hover:text-white"
              }`}
            >
              <Network size={12} />
              <span>Tree</span>
            </button>
            <button
              onClick={() => setViewMode("json")}
              className={`px-2.5 py-0.5 rounded text-xs font-medium flex items-center gap-1 transition ${
                viewMode === "json" ? "bg-ide-surface text-ide-text shadow-sm" : "text-ide-subtle hover:text-white"
              }`}
            >
              <Code size={12} />
              <span>JSON IR</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === "tree" ? (
        <div className="bg-ide-panel border border-ide-border rounded-lg p-3 max-h-[calc(100vh-390px)] min-h-[180px] overflow-y-auto shadow-sm">
          <TreeNode data={ast} />
        </div>
      ) : (
        <pre className="bg-ide-panel border border-ide-border rounded-lg p-3 text-xs font-mono text-slate-100 max-h-[calc(100vh-390px)] min-h-[180px] overflow-y-auto leading-relaxed shadow-sm">
          {JSON.stringify(ast, null, 2)}
        </pre>
      )}
    </div>
  );
};
