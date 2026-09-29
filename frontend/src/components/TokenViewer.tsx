import React, { useState } from "react";
import { TokenItem } from "@/lib/api";
import { Code2, LayoutGrid, List } from "lucide-react";

interface TokenViewerProps {
  tokens?: TokenItem[];
}

export const TokenViewer: React.FC<TokenViewerProps> = ({ tokens }) => {
  const [viewStyle, setViewStyle] = useState<"table" | "badges">("table");
  const [filterText, setFilterText] = useState("");

  if (!tokens || tokens.length === 0) {
    return (
      <div className="p-12 text-center text-ide-muted font-mono text-xs">
        No lexical token stream available. Compile or run a query to inspect Flex tokens.
      </div>
    );
  }

  const filteredTokens = tokens.filter(
    (t) =>
      t.token.toLowerCase().includes(filterText.toLowerCase()) ||
      t.lexeme.toLowerCase().includes(filterText.toLowerCase())
  );

  const getTokenCategory = (type: string) => {
    if (type.startsWith("KEYWORD")) return { label: "KEYWORD", color: "text-token-keyword bg-token-keyword/10 border-token-keyword/30" };
    if (type === "IDENTIFIER") return { label: "IDENT", color: "text-token-ident bg-token-ident/10 border-token-ident/20" };
    if (type.includes("LITERAL")) return { label: "LITERAL", color: "text-token-number bg-token-number/10 border-token-number/30" };
    if (type.startsWith("OP_")) return { label: "OPERATOR", color: "text-token-op bg-token-op/10 border-token-op/30" };
    if (type === "LEXICAL_ERROR") return { label: "ERROR", color: "text-status-error bg-status-error/10 border-status-error/30" };
    return { label: "SYMBOL", color: "text-ide-muted bg-ide-surface border-ide-border" };
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-ide-muted border-b border-ide-border pb-2.5 font-mono text-[11px]">
        <div className="flex items-center gap-3">
          <span>Lexer Engine: <strong className="text-ide-text">Flex 2.6 (lexer.l)</strong></span>
          <span>Tokens Emitted: <strong className="text-status-info">{tokens.length}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter tokens..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="bg-ide-bg border border-ide-border rounded px-2.5 py-1 text-[11px] text-ide-text placeholder-ide-subtle focus:outline-none focus:border-status-info w-36 font-mono"
          />

          <div className="flex items-center bg-ide-bg border border-ide-border rounded p-0.5">
            <button
              onClick={() => setViewStyle("table")}
              title="Table view"
              className={`p-1 rounded ${viewStyle === "table" ? "bg-ide-panel text-white" : "text-ide-subtle hover:text-ide-text"}`}
            >
              <List size={13} />
            </button>
            <button
              onClick={() => setViewStyle("badges")}
              title="Badge grid view"
              className={`p-1 rounded ${viewStyle === "badges" ? "bg-ide-panel text-white" : "text-ide-subtle hover:text-ide-text"}`}
            >
              <LayoutGrid size={13} />
            </button>
          </div>
        </div>
      </div>

      {viewStyle === "table" ? (
        /* Structured Token Table */
        <div className="border border-ide-border rounded overflow-hidden bg-ide-panel max-h-[460px] overflow-y-auto">
          <table className="w-full text-left font-mono text-[11px] border-collapse">
            <thead className="bg-ide-surface text-ide-muted uppercase tracking-wider text-[10px] sticky top-0 border-b border-ide-border z-10">
              <tr>
                <th className="py-2 px-3 w-10 text-center text-ide-subtle border-r border-ide-border">#</th>
                <th className="py-2 px-3 border-r border-ide-border">Category</th>
                <th className="py-2 px-3 border-r border-ide-border">Token Constant</th>
                <th className="py-2 px-3 border-r border-ide-border">Lexeme</th>
                <th className="py-2 px-3 text-right">Coordinates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ide-border text-ide-text">
              {filteredTokens.map((tok, idx) => {
                const cat = getTokenCategory(tok.token);
                return (
                  <tr key={idx} className="hover:bg-ide-hover/70 transition-colors">
                    <td className="py-1.5 px-3 text-center text-ide-subtle border-r border-ide-border select-none">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-3 border-r border-ide-border">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${cat.color}`}>
                        {cat.label}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 border-r border-ide-border font-semibold text-ide-text">
                      {tok.token}
                    </td>
                    <td className="py-1.5 px-3 border-r border-ide-border font-bold text-token-keyword">
                      {tok.lexeme}
                    </td>
                    <td className="py-1.5 px-3 text-right text-ide-muted text-[10px]">
                      Line {tok.line} : Col {tok.col}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Badge Grid */
        <div className="flex flex-wrap gap-2 max-h-[460px] overflow-y-auto p-2 bg-ide-panel border border-ide-border rounded">
          {filteredTokens.map((tok, idx) => {
            const cat = getTokenCategory(tok.token);
            return (
              <div
                key={idx}
                className="bg-ide-surface border border-ide-border rounded p-2 text-xs font-mono flex flex-col gap-1 min-w-[120px]"
              >
                <div className="flex items-center justify-between text-[9px] text-ide-subtle">
                  <span className={`font-semibold px-1 rounded border ${cat.color}`}>{cat.label}</span>
                  <span>L{tok.line}:{tok.col}</span>
                </div>
                <div className="font-bold text-ide-text text-[12px] truncate">{tok.lexeme}</div>
                <div className="text-[10px] text-ide-muted truncate">{tok.token}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
