import React, { useState } from "react";
import { TokenItem } from "@/lib/api";
import { Code2, LayoutGrid, List, Search } from "lucide-react";

interface TokenViewerProps {
  tokens?: TokenItem[];
}

export const TokenViewer: React.FC<TokenViewerProps> = ({ tokens }) => {
  const [viewStyle, setViewStyle] = useState<"table" | "badges">("table");
  const [filterText, setFilterText] = useState("");

  if (!tokens || tokens.length === 0) {
    return (
      <div className="p-16 text-center text-slate-400 font-mono text-xs border border-dashed border-ide-border rounded-lg">
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
    if (type.startsWith("KEYWORD")) return { label: "KEYWORD", color: "text-[#7fa1c4] bg-[#1a2333] border-[#2c3d59]" };
    if (type === "IDENTIFIER") return { label: "IDENTIFIER", color: "text-[#9b8cb8] bg-[#221c2c] border-[#3b304c]" };
    if (type.includes("LITERAL")) return { label: "LITERAL", color: "text-[#cfa058] bg-[#251f16] border-[#423625]" };
    if (type.startsWith("OP_")) return { label: "OPERATOR", color: "text-[#72b192] bg-[#182620] border-[#294237]" };
    if (type === "LEXICAL_ERROR") return { label: "ERROR", color: "text-[#db8686] bg-[#26191a] border-[#482b2d]" };
    return { label: "SYMBOL", color: "text-slate-300 bg-ide-surface border-ide-border" };
  };

  return (
    <div className="space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-slate-400 border-b border-ide-border pb-2 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span>Scanner:</span>
            <strong className="text-slate-100 font-mono bg-ide-surface px-2 py-0.5 rounded border border-ide-border">Flex 2.6 (lexer.l)</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span>Total Tokens:</span>
            <strong className="text-[#7fa1c4] font-bold">{tokens.length}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-ide-bg border border-ide-border rounded-md pl-7 pr-3 py-1 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#4f6b94] w-40 font-mono transition"
            />
          </div>

          <div className="flex items-center bg-ide-bg border border-ide-border rounded-md p-0.5">
            <button
              onClick={() => setViewStyle("table")}
              title="Table view"
              className={`px-2 py-0.5 rounded flex items-center gap-1 text-xs transition ${viewStyle === "table" ? "bg-ide-panel text-white font-semibold shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              <List size={12} />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewStyle("badges")}
              title="Badge grid view"
              className={`px-2 py-0.5 rounded flex items-center gap-1 text-xs transition ${viewStyle === "badges" ? "bg-ide-panel text-white font-semibold shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              <LayoutGrid size={12} />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </div>

      {viewStyle === "table" ? (
        <div className="border border-ide-border rounded-lg overflow-hidden bg-ide-panel max-h-[calc(100vh-410px)] min-h-[180px] overflow-y-auto shadow-sm">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="bg-ide-surface text-slate-300 uppercase tracking-wider text-[11px] sticky top-0 border-b border-ide-border z-10 select-none">
              <tr>
                <th className="py-2 px-3 w-10 text-center text-slate-400 border-r border-ide-border">#</th>
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
                  <tr key={idx} className="hover:bg-ide-hover/60 transition-colors">
                    <td className="py-1.5 px-3 text-center text-slate-400 border-r border-ide-border select-none text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-3 border-r border-ide-border">
                      <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${cat.color}`}>
                        {cat.label}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 border-r border-ide-border font-mono text-slate-200">
                      {tok.token}
                    </td>
                    <td className="py-1.5 px-3 border-r border-ide-border font-bold text-sky-400 text-xs sm:text-sm">
                      {tok.lexeme}
                    </td>
                    <td className="py-1.5 px-3 text-right text-slate-400 text-xs">
                      Line {tok.line}, Col {tok.col}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[calc(100vh-410px)] min-h-[180px] overflow-y-auto p-2.5 bg-ide-panel border border-ide-border rounded-lg">
          {filteredTokens.map((tok, idx) => {
            const cat = getTokenCategory(tok.token);
            return (
              <div
                key={idx}
                className="bg-ide-surface border border-ide-border hover:border-slate-700 rounded-md p-2 text-xs font-mono flex flex-col gap-1 transition"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className={`font-semibold px-1.5 py-0.2 rounded-full border text-[9px] ${cat.color}`}>{cat.label}</span>
                  <span>L{tok.line}:{tok.col}</span>
                </div>
                <div className="font-bold text-white text-xs sm:text-sm truncate">{tok.lexeme}</div>
                <div className="text-[10px] text-slate-400 truncate font-mono">{tok.token}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
