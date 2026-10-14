import React, { useState } from "react";
import { TacInfo } from "@/lib/api";
import { Code, Table as TableIcon, GitFork, Copy, Check, Info } from "lucide-react";

interface TacViewerProps {
  tac?: TacInfo;
}

export const TacViewer: React.FC<TacViewerProps> = ({ tac }) => {
  const [activeSubTab, setActiveSubTab] = useState<"tac" | "quads" | "cfg">("tac");
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  if (!tac || (!tac.instructions.length && !tac.quadruples.length)) {
    return (
      <div className="py-16 text-center text-ide-muted font-sans border border-dashed border-ide-border rounded-lg bg-ide-surface/20">
        <p className="text-sm font-semibold text-ide-text mb-1">No Intermediate Code Generated</p>
        <p className="text-ide-subtle text-xs">Execute or compile a query to inspect the Three-Address Code (TAC) and Quadruples emitted by the ICG phase.</p>
      </div>
    );
  }

  const { instructions, quadruples, basicBlocks, temporaryVariables } = tac;

  const copyTac = () => {
    const raw = instructions.map((i) => i.code).join("\n");
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredQuads = quadruples.filter((q) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      q.op.toLowerCase().includes(term) ||
      q.arg1.toLowerCase().includes(term) ||
      q.arg2.toLowerCase().includes(term) ||
      q.result.toLowerCase().includes(term) ||
      (q.comment && q.comment.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Controls & Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ide-border pb-3">
        <div className="flex items-center gap-1.5 bg-ide-surface p-1 rounded-lg border border-ide-border text-xs">
          <button
            onClick={() => setActiveSubTab("tac")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeSubTab === "tac"
                ? "bg-ide-panel text-white shadow-sm border border-ide-borderLight"
                : "text-ide-muted hover:text-white"
            }`}
          >
            <Code size={13} />
            <span>Three-Address Code (TAC)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ide-border text-slate-300">
              {instructions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("quads")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeSubTab === "quads"
                ? "bg-ide-panel text-white shadow-sm border border-ide-borderLight"
                : "text-ide-muted hover:text-white"
            }`}
          >
            <TableIcon size={13} />
            <span>Quadruples Table</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ide-border text-slate-300">
              {quadruples.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("cfg")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeSubTab === "cfg"
                ? "bg-ide-panel text-white shadow-sm border border-ide-borderLight"
                : "text-ide-muted hover:text-white"
            }`}
          >
            <GitFork size={13} />
            <span>Basic Blocks / CFG</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ide-border text-slate-300">
              {basicBlocks.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono text-ide-muted px-2.5 py-1 bg-ide-surface rounded border border-ide-border">
            Registers: <span className="text-emerald-400 font-semibold">{temporaryVariables.length} temporaries</span>
          </div>
          {activeSubTab === "tac" && (
            <button
              onClick={copyTac}
              className="flex items-center gap-1.5 text-xs text-ide-muted hover:text-white px-2.5 py-1 rounded bg-ide-surface border border-ide-border hover:border-slate-600 transition"
              title="Copy TAC code"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? "Copied!" : "Copy TAC"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtab 1: Three-Address Code listing */}
      {activeSubTab === "tac" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-ide-subtle bg-ide-surface/30 px-3 py-2 rounded border border-ide-border">
            <Info size={14} className="text-blue-400 flex-shrink-0" />
            <span>
              Linearized 3-Address Instructions generated after syntax and semantic analysis. Operands use temporary registers (<code className="text-emerald-400">t0, t1...</code>) and branch labels (<code className="text-purple-400">L_...</code>).
            </span>
          </div>

          <div className="bg-[#0e121a] rounded-lg border border-ide-border p-4 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
            {instructions.map((instr) => {
              const isComment = instr.code.startsWith("//");
              const isLabel = instr.code.endsWith(":");

              return (
                <div
                  key={instr.line}
                  className={`flex items-start gap-4 py-0.5 px-2 rounded hover:bg-ide-surface/40 transition ${
                    isComment ? "text-slate-500 italic mt-2" : isLabel ? "text-purple-300 font-bold mt-1" : "text-slate-200"
                  }`}
                >
                  <span className="w-8 text-right text-slate-600 select-none text-[11px]">
                    {instr.line}
                  </span>

                  <span className="flex-1 font-mono">
                    {isComment ? (
                      instr.code
                    ) : isLabel ? (
                      <span className="text-purple-400 font-semibold">{instr.code}</span>
                    ) : (
                      <span>
                        {instr.code.split(" ").map((token, idx) => {
                          if (token.startsWith("t") && !isNaN(Number(token.slice(1)))) {
                            return <span key={idx} className="text-emerald-400 font-semibold">{token} </span>;
                          }
                          if (token.startsWith("L_")) {
                            return <span key={idx} className="text-purple-300 underline underline-offset-2">{token} </span>;
                          }
                          if (["READ_ROW", "ACCUMULATE", "HASH_KEY", "PROJECT_FIELD", "EMIT", "DISCARD", "HALT"].includes(token)) {
                            return <span key={idx} className="text-blue-300 font-bold">{token} </span>;
                          }
                          if (["ifFalse", "ifEOF", "goto"].includes(token)) {
                            return <span key={idx} className="text-amber-300 font-semibold">{token} </span>;
                          }
                          if (["=", ">=", "<=", ">", "<", "!=", "AND", "OR"].includes(token)) {
                            return <span key={idx} className="text-cyan-300 font-bold">{token} </span>;
                          }
                          return <span key={idx}>{token} </span>;
                        })}
                      </span>
                    )}
                  </span>

                  {instr.block && (
                    <span className="text-[10px] text-slate-500 font-mono select-none px-1.5 py-0.5 rounded bg-ide-surface/80 border border-ide-border/50">
                      {instr.block}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 2: Quadruples Table */}
      {activeSubTab === "quads" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-ide-subtle">
              <Info size={14} className="text-blue-400 flex-shrink-0" />
              <span>Standard Quadruple tuples: <code className="text-slate-200">[Op, Arg1, Arg2, Result]</code>.</span>
            </div>
            <input
              type="text"
              placeholder="Search quadruples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs bg-ide-panel border border-ide-border rounded px-2.5 py-1 text-white placeholder-ide-subtle focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="border border-ide-border rounded-lg overflow-hidden bg-ide-panel/60">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-ide-surface/80 border-b border-ide-border text-left text-slate-300">
                    <th className="py-2.5 px-3 w-12 text-slate-500">#</th>
                    <th className="py-2.5 px-3 text-cyan-400 font-semibold">Operator (Op)</th>
                    <th className="py-2.5 px-3 text-slate-300">Argument 1</th>
                    <th className="py-2.5 px-3 text-slate-300">Argument 2</th>
                    <th className="py-2.5 px-3 text-emerald-400 font-semibold">Result</th>
                    <th className="py-2.5 px-3 text-slate-400 font-sans font-normal">Description / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ide-border/60">
                  {filteredQuads.map((q) => (
                    <tr key={q.index} className="hover:bg-ide-surface/50 transition">
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{q.index}</td>
                      <td className="py-2 px-3 font-bold text-cyan-300">{q.op}</td>
                      <td className="py-2 px-3 text-slate-200">
                        {q.arg1 ? (
                          <span className="px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border text-[11px]">
                            {q.arg1}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-200">
                        {q.arg2 ? (
                          <span className="px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border text-[11px]">
                            {q.arg2}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-semibold text-emerald-400">
                        {q.result ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-[11px]">
                            {q.result}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-400 font-sans text-xs">{q.comment || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Control Flow Graph (CFG) Basic Blocks */}
      {activeSubTab === "cfg" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-ide-subtle bg-ide-surface/30 px-3 py-2 rounded border border-ide-border">
            <Info size={14} className="text-blue-400 flex-shrink-0" />
            <span>
              Partitioned Basic Blocks with single-entry and single-exit edges representing the execution flow through filter, aggregate, and projection.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {basicBlocks.map((bb, idx) => (
              <div
                key={bb.name}
                className="bg-ide-panel border border-ide-border rounded-lg p-3.5 flex flex-col justify-between shadow-sm hover:border-slate-600 transition"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-ide-border pb-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800/80 text-[11px] font-mono flex items-center justify-center font-bold">
                        {idx}
                      </span>
                      <span className="font-mono font-bold text-slate-200 text-xs">{bb.name}</span>
                    </div>
                    {bb.label && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/60">
                        {bb.label}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 font-mono text-[11px] bg-[#0c1017] p-2.5 rounded border border-ide-border/70 mb-3">
                    {bb.instructions.map((code, cIdx) => (
                      <div key={cIdx} className="text-slate-300 truncate">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-ide-border/60 flex items-center justify-between text-[11px] font-mono text-ide-muted">
                  <span>Successor Edges:</span>
                  <div className="flex items-center gap-1">
                    {bb.successors.length > 0 ? (
                      bb.successors.map((succ) => (
                        <span
                          key={succ}
                          className="px-1.5 py-0.5 rounded bg-ide-surface text-cyan-300 border border-ide-border text-[10px]"
                        >
                          &rarr; {succ}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic text-[10px]">None (Terminal)</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
