import React from "react";
import { TokenItem } from "@/lib/api";

interface TokenViewerProps {
  tokens?: TokenItem[];
}

export const TokenViewer: React.FC<TokenViewerProps> = ({ tokens }) => {
  if (!tokens || tokens.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        No tokens generated yet. Run a query to inspect the Flex lexical stream.
      </div>
    );
  }

  const getTokenBadgeColor = (type: string) => {
    if (type.startsWith("KEYWORD")) return "bg-indigo-950 text-indigo-300 border-indigo-700/60";
    if (type === "IDENTIFIER") return "bg-sky-950 text-sky-300 border-sky-700/60";
    if (type.includes("LITERAL")) return "bg-amber-950 text-amber-300 border-amber-700/60";
    if (type.startsWith("OP_")) return "bg-purple-950 text-purple-300 border-purple-700/60";
    if (type === "LEXICAL_ERROR") return "bg-rose-950 text-rose-300 border-rose-700/60";
    return "bg-gray-800 text-gray-300 border-gray-700";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-400 border-b border-dark-border pb-3">
        <span>Lexer Source: <code className="text-brand-cyan">compiler/lexer.l (Flex 2.6)</code></span>
        <span>Total Tokens Emitted: <strong className="text-white font-mono">{tokens.length}</strong></span>
      </div>

      <div className="flex flex-wrap gap-2.5 max-h-[500px] overflow-y-auto p-2">
        {tokens.map((tok, idx) => (
          <div
            key={idx}
            className={`border rounded-lg px-3 py-2 text-xs font-mono shadow-sm flex flex-col gap-1 transition-all hover:scale-105 ${getTokenBadgeColor(
              tok.token
            )}`}
          >
            <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
              <span className="font-semibold uppercase tracking-wider">{tok.token}</span>
              <span className="text-gray-400 font-sans">L{tok.line}:{tok.col}</span>
            </div>
            <div className="text-sm font-bold text-white tracking-wide">
              {tok.lexeme}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
