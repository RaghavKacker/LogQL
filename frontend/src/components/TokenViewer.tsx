import React, { useState } from "react";
import { TokenItem } from "@/lib/api";
import { LayoutGrid, List, Search, X } from "lucide-react";

interface TokenViewerProps {
  tokens?: TokenItem[];
}

export const TokenViewer: React.FC<TokenViewerProps> = ({ tokens }) => {
  const [viewStyle, setViewStyle] = useState<"table" | "badges">("table");
  const [filterText, setFilterText] = useState("");

  if (!tokens || tokens.length === 0) {
    return (
      <div className="p-16 text-center text-ide-muted font-mono text-xs border border-dashed border-ide-border rounded-lg">
        <p className="text-sm font-semibold text-ide-text mb-1">No token stream available</p>
        <p className="text-ide-subtle text-xs">Run or compile a query to inspect the lexical tokens emitted by Flex.</p>
      </div>
    );
  }

  const filteredTokens = tokens.filter(
    (t) =>
      t.token.toLowerCase().includes(filterText.toLowerCase()) ||
      t.lexeme.toLowerCase().includes(filterText.toLowerCase())
  );

  const getTokenCategory = (type: string) => {
    if (type.startsWith("KEYWORD")) return { label: "KEYWORD", color: "text-blue-300 bg-blue-950/40 border-blue-800/60" };
    if (type === "IDENTIFIER") return { label: "IDENTIFIER", color: "text-purple-300 bg-purple-950/40 border-purple-800/60" };
    if (type.includes("LITERAL")) return { label: "LITERAL", color: "text-amber-300 bg-amber-950/40 border-amber-800/60" };
    if (type.startsWith("OP_")) return { label: "OPERATOR", color: "text-teal-300 bg-teal-950/40 border-teal-800/60" };
    if (type === "LEXICAL_ERROR") return { label: "ERROR", color: "text-red-300 bg-red-950/50 border-red-800/70" };
    return { label: "SYMBOL", color: "text-slate-400 bg-ide-surface border-ide-border" };
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Subheader */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-ide-muted border-b border-ide-border pb-2.5 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="text-ide-subtle">Lexer:</span>
            <strong className="text-ide-text bg-ide-surface px-2 py-0.5 rounded border border-ide-border font-medium">Flex 2.6 (lexer.l)</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-ide-subtle">Total Tokens:</span>
            <strong className="text-ide-text font-semibold">{tokens.length}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2 text-ide-subtle" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-ide-bg border border-ide-border rounded pl-7 pr-7 py-1 text-xs text-ide-text placeholder-ide-subtle focus:outline-none focus:border-ide-borderLight w-40 font-mono transition"
            />
            {filterText && (
              <button
                onClick={() => setFilterText("")}
                className="absolute right-2 top-1.5 text-ide-subtle hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center bg-ide-bg border border-ide-border rounded p-0.5">
            <button
              onClick={() => setViewStyle("table")}
              title="Table view"
              className={`px-2 py-0.5 rounded flex items-center gap-1 text-xs transition ${viewStyle === "table" ? "bg-ide-surface text-ide-text font-medium shadow-sm" : "text-ide-subtle hover:text-white"}`}
            >
              <List size={12} />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewStyle("badges")}
              title="Grid view"
              className={`px-2 py-0.5 rounded flex items-center gap-1 text-xs transition ${viewStyle === "badges" ? "bg-ide-surface text-ide-text font-medium shadow-sm" : "text-ide-subtle hover:text-white"}`}
            >
              <LayoutGrid size={12} />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </div>

      {viewStyle === "table" ? (
        <div className="border border-ide-border rounded-lg overflow-hidden bg-ide-panel max-h-[calc(100vh-390px)] min-h-[180px] overflow-y-auto shadow-sm">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="bg-ide-surface text-ide-muted uppercase tracking-wider text-[11px] sticky top-0 border-b border-ide-border z-10 select-none">
              <tr>
                <th className="py-2 px-3 w-10 text-center text-ide-subtle border-r border-ide-border">#</th>
                <th className="py-2 px-3 border-r border-ide-border">Category</th>
                <th className="py-2 px-3 border-r border-ide-border">Token Macro</th>
                <th className="py-2 px-3 border-r border-ide-border">Source Lexeme</th>
                <th className="py-2 px-3 text-right">Coordinates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ide-border text-slate-200">
              {filteredTokens.map((tok, idx) => {
                const cat = getTokenCategory(tok.token);
                return (
                  <tr key={idx} className="hover:bg-ide-hover/50 transition-colors">
                    <td className="py-1.5 px-3 text-center text-ide-subtle border-r border-ide-border select-none text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-3 border-r border-ide-border">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${cat.color}`}>
                        {cat.label}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 border-r border-ide-border font-mono text-slate-300">
                      {tok.token}
                    </td>
                    <td className="py-1.5 px-3 border-r border-ide-border font-medium text-ide-text text-xs">
                      <code className="bg-ide-bg px-1.5 py-0.5 rounded border border-ide-border">{tok.lexeme}</code>
                    </td>
                    <td className="py-1.5 px-3 text-right text-ide-muted text-xs">
                      Line {tok.line}, Col {tok.col}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[calc(100vh-390px)] min-h-[180px] overflow-y-auto p-2.5 bg-ide-panel border border-ide-border rounded-lg">
          {filteredTokens.map((tok, idx) => {
            const cat = getTokenCategory(tok.token);
            return (
              <div
                key={idx}
                className="bg-ide-surface border border-ide-border hover:border-ide-borderLight rounded-md p-2.5 text-xs font-mono flex flex-col gap-1 transition"
              >
                <div className="flex items-center justify-between text-[10px] text-ide-subtle">
                  <span className={`font-semibold px-1.5 py-0.2 rounded border text-[9px] ${cat.color}`}>{cat.label}</span>
                  <span>L{tok.line}:{tok.col}</span>
                </div>
                <div className="font-semibold text-ide-text text-xs truncate mt-1">
                  {tok.lexeme}
                </div>
                <div className="text-[10px] text-ide-subtle truncate font-mono">{tok.token}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
