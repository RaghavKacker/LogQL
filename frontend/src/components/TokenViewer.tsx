import React, { useState } from "react";
import { TokenItem } from "@/lib/api";
import { Search, X } from "lucide-react";

interface TokenViewerProps {
  tokens?: TokenItem[];
}

export const TokenViewer: React.FC<TokenViewerProps> = ({ tokens }) => {
  const [filterText, setFilterText] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("ALL");

  if (!tokens || tokens.length === 0) {
    return (
      <div className="py-16 text-center text-ide-muted font-sans border border-dashed border-ide-border rounded-lg bg-ide-surface/20">
        <p className="text-sm font-semibold text-ide-text mb-1">No tokens generated yet</p>
        <p className="text-ide-subtle text-xs">Execute or compile a query to inspect the lexical token stream emitted by Flex.</p>
      </div>
    );
  }

  const getTokenCategory = (type: string) => {
    if (type.startsWith("KEYWORD")) return { key: "KEYWORD", label: "Keyword", color: "text-blue-300 bg-blue-950/40 border-blue-800/60" };
    if (type === "IDENTIFIER") return { key: "IDENTIFIER", label: "Identifier", color: "text-purple-300 bg-purple-950/40 border-purple-800/60" };
    if (type.includes("LITERAL")) return { key: "LITERAL", label: "Literal", color: "text-amber-300 bg-amber-950/40 border-amber-800/60" };
    if (type.startsWith("OP_")) return { key: "OPERATOR", label: "Operator", color: "text-teal-300 bg-teal-950/40 border-teal-800/60" };
    if (type === "LEXICAL_ERROR") return { key: "ERROR", label: "Error", color: "text-red-300 bg-red-950/50 border-red-800/70" };
    return { key: "SYMBOL", label: "Symbol", color: "text-slate-400 bg-ide-surface border-ide-border" };
  };

  const filteredTokens = tokens.filter((t) => {
    const cat = getTokenCategory(t.token);
    if (selectedCat !== "ALL" && cat.key !== selectedCat) return false;
    if (!filterText) return true;
    return (
      t.token.toLowerCase().includes(filterText.toLowerCase()) ||
      t.lexeme.toLowerCase().includes(filterText.toLowerCase())
    );
  });

  const categories = [
    { key: "ALL", label: `All (${tokens.length})` },
    { key: "KEYWORD", label: "Keywords" },
    { key: "IDENTIFIER", label: "Identifiers" },
    { key: "LITERAL", label: "Literals" },
    { key: "OPERATOR", label: "Operators" },
  ];

  return (
    <div className="space-y-3 font-sans text-xs">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCat(c.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                selectedCat === c.key
                  ? "bg-ide-surface text-white border border-ide-borderLight"
                  : "text-ide-muted hover:text-white bg-transparent"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2.5 text-ide-subtle" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="bg-ide-bg border border-ide-border rounded-md pl-8 pr-7 py-1 text-xs text-ide-text placeholder-ide-subtle focus:outline-none focus:border-ide-borderLight w-44 font-mono transition"
          />
          {filterText && (
            <button
              onClick={() => setFilterText("")}
              className="absolute right-2 top-1.5 text-ide-subtle hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-ide-border rounded-lg overflow-hidden bg-ide-panel shadow-sm">
        <div className="max-h-[460px] min-h-[160px] overflow-y-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="bg-ide-surface/80 text-ide-muted uppercase tracking-wider text-[11px] sticky top-0 border-b border-ide-border z-10 select-none">
              <tr>
                <th className="py-2.5 px-3.5 w-12 text-center text-ide-subtle border-r border-ide-border">#</th>
                <th className="py-2.5 px-3.5 border-r border-ide-border w-28">Category</th>
                <th className="py-2.5 px-3.5 border-r border-ide-border">Lexeme</th>
                <th className="py-2.5 px-3.5 border-r border-ide-border">Token Constant</th>
                <th className="py-2.5 px-3.5 text-right w-32">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ide-border text-slate-200">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-ide-subtle italic font-sans text-xs">
                    No tokens found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((tok, idx) => {
                  const cat = getTokenCategory(tok.token);
                  return (
                    <tr key={idx} className="hover:bg-ide-surface/40 transition-colors">
                      <td className="py-2 px-3.5 text-center text-ide-subtle border-r border-ide-border select-none text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3.5 border-r border-ide-border">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${cat.color}`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="py-2 px-3.5 border-r border-ide-border font-medium text-white text-xs">
                        <code className="bg-ide-bg px-2 py-0.5 rounded border border-ide-border font-mono">{tok.lexeme}</code>
                      </td>
                      <td className="py-2 px-3.5 border-r border-ide-border text-slate-300 font-mono text-xs">
                        {tok.token}
                      </td>
                      <td className="py-2 px-3.5 text-right text-ide-muted text-[11px] font-mono">
                        Line {tok.line}, Col {tok.col}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
