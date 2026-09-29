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
      <div className="text-ide-subtle text-[11px] font-mono py-0.5">
        {label ? <span className="text-ide-muted">{label}: </span> : ""}null
      </div>
    );
  }

  if (typeof data !== "object") {
    return (
      <div className="text-[11px] font-mono py-0.5 flex items-center gap-1.5">
        {label && <span className="text-ide-muted font-medium">{label}:</span>}
        <span
          className={
            typeof data === "number"
              ? "text-token-number font-bold"
              : typeof data === "boolean"
              ? "text-status-success font-bold"
              : "text-token-string"
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
    <div className="text-[11px] font-mono ml-3 border-l border-ide-border pl-2.5 py-0.5">
      <div
        className="flex items-center gap-1.5 cursor-pointer text-ide-muted hover:text-ide-text select-none py-0.5 group"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {label && <span className="text-token-func font-medium">{label}:</span>}
        <span className="bg-ide-surface border border-ide-border px-1.5 py-0.2 rounded text-[10px] font-bold text-token-keyword group-hover:border-ide-borderLight">
          {nodeType}
        </span>
        {!expanded && (
          <span className="text-ide-subtle text-[10px]">
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
      <div className="p-12 text-center text-ide-muted font-mono text-xs">
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
    <div className="space-y-3 text-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-ide-muted border-b border-ide-border pb-2.5 font-mono text-[11px]">
        <div className="flex items-center gap-3">
          <span>Parser Engine: <strong className="text-ide-text">Bison 3.8 (parser.y LALR(1))</strong></span>
          <span>Root: <strong className="text-token-keyword">{ast.type || "QueryNode"}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            title="Copy AST JSON to clipboard"
            className="px-2 py-1 rounded bg-ide-surface hover:bg-ide-hover border border-ide-border text-ide-muted hover:text-ide-text transition flex items-center gap-1 text-[11px]"
          >
            {copied ? <Check size={12} className="text-status-success" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy JSON"}
          </button>

          <div className="flex items-center bg-ide-bg border border-ide-border rounded p-0.5">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                viewMode === "tree" ? "bg-ide-panel text-white" : "text-ide-subtle hover:text-ide-text"
              }`}
            >
              <Network size={12} /> Tree
            </button>
            <button
              onClick={() => setViewMode("json")}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                viewMode === "json" ? "bg-ide-panel text-white" : "text-ide-subtle hover:text-ide-text"
              }`}
            >
              <Code size={12} /> JSON IR
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "tree" ? (
        <div className="bg-ide-panel border border-ide-border rounded p-3 max-h-[460px] overflow-y-auto">
          <TreeNode data={ast} />
        </div>
      ) : (
        <pre className="bg-ide-panel border border-ide-border rounded p-3 text-[11px] font-mono text-ide-text max-h-[460px] overflow-y-auto leading-relaxed">
          {JSON.stringify(ast, null, 2)}
        </pre>
      )}
    </div>
  );
};
