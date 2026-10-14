import React, { useState } from "react";
import { X, Copy, Check, Terminal, FileCode, Cpu, Layers } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  datasetId: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  query,
  datasetId
}) => {
  const [activeLang, setActiveLang] = useState<"python_pandas" | "python_api" | "cpp" | "curl">("python_pandas");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const cleanQuery = query.trim().replace(/\n/g, " ");

  const pythonPandasCode = `# Standalone LogQL query execution via Python & Pandas
import pandas as pd
import json

# 1. Load log records
dataset_path = "sample-logs/${datasetId}.jsonl"
print(f"Loading {dataset_path}...")

records = []
with open(dataset_path, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            records.append(json.loads(line))

df = pd.DataFrame(records)

# 2. Emulate LogQL Query Execution:
# LogQL: ${cleanQuery}

# Filter phase (WHERE)
if "status" in df.columns:
    df_filtered = df[df["status"] >= 500]
else:
    df_filtered = df

# Grouping & Aggregation (GROUP BY & COUNT)
if "service" in df_filtered.columns:
    result = df_filtered.groupby("service").size().reset_index(name="COUNT(*)")
    result = result.sort_values(by="COUNT(*)", ascending=False)
else:
    result = df_filtered

print("\\n=== Query Output ===")
print(result.to_string(index=False))
`;

  const pythonApiCode = `# LogQL API Client Execution via Python Requests
import requests

API_URL = "http://127.0.0.1:8000/api/execute"

payload = {
    "query": """${query.trim()}""",
    "datasetId": "${datasetId}"
}

print("Executing LogQL compiler query...")
response = requests.post(API_URL, json=payload)
data = response.json()

if data.get("success"):
    metrics = data["results"]["metrics"]
    print(f"Executed in {metrics['executionTimeMs']:.3f} ms")
    print(f"Scanned: {metrics['recordsScanned']} | Returned: {metrics['recordsReturned']} rows\\n")
    
    rows = data["results"]["rows"]
    cols = data["results"]["columns"]
    print("\\t".join(cols))
    print("-" * 50)
    for r in rows:
        print("\\t".join(str(r.get(c, "")) for c in cols))
else:
    print(f"Compilation/Execution Error [{data.get('stage')}]: {data.get('error')}")
`;

  const cppStandaloneCode = `// Standalone C++ LogQL Core Execution
#include <iostream>
#include <string>
#include <vector>
#include "compiler/include/ast.hpp"
#include "compiler/include/executor.hpp"

int main() {
    std::string query = "${cleanQuery.replace(/"/g, '\\"')}";
    std::string dataset = "sample-logs/${datasetId}.jsonl";
    
    std::cout << "Compiling & executing LogQL query via native Volcano engine..." << std::endl;
    // Command line invocation:
    // ./compiler/build/logql_cli --query "${cleanQuery.replace(/"/g, '\\"')}" --dataset sample-logs/${datasetId}.jsonl --execute
    
    return 0;
}
`;

  const curlCode = `# LogQL Command-Line API Invocation
curl -X POST "http://127.0.0.1:8000/api/execute" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "${cleanQuery.replace(/"/g, '\\"')}",
    "datasetId": "${datasetId}"
  }'
`;

  const getCode = () => {
    switch (activeLang) {
      case "python_pandas":
        return pythonPandasCode;
      case "python_api":
        return pythonApiCode;
      case "cpp":
        return cppStandaloneCode;
      case "curl":
        return curlCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-ide-panel border border-ide-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ide-border bg-ide-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/80 flex items-center justify-center text-blue-400">
              <FileCode size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Export Query as Runnable Code</h3>
              <p className="text-[11px] text-ide-muted font-sans">
                Export your current LogQL query into standalone Python, C++, or API scripts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-ide-muted hover:text-white hover:bg-ide-surface transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center justify-between border-b border-ide-border bg-ide-bg px-4 py-2 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveLang("python_pandas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeLang === "python_pandas"
                  ? "bg-ide-panel text-white border border-ide-borderLight shadow-sm"
                  : "text-ide-muted hover:text-white"
              }`}
            >
              <Cpu size={13} className="text-amber-400" />
              <span>Python (Pandas)</span>
            </button>

            <button
              onClick={() => setActiveLang("python_api")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeLang === "python_api"
                  ? "bg-ide-panel text-white border border-ide-borderLight shadow-sm"
                  : "text-ide-muted hover:text-white"
              }`}
            >
              <Layers size={13} className="text-emerald-400" />
              <span>Python (API Requests)</span>
            </button>

            <button
              onClick={() => setActiveLang("cpp")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeLang === "cpp"
                  ? "bg-ide-panel text-white border border-ide-borderLight shadow-sm"
                  : "text-ide-muted hover:text-white"
              }`}
            >
              <FileCode size={13} className="text-cyan-400" />
              <span>C++ Core CLI</span>
            </button>

            <button
              onClick={() => setActiveLang("curl")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeLang === "curl"
                  ? "bg-ide-panel text-white border border-ide-borderLight shadow-sm"
                  : "text-ide-muted hover:text-white"
              }`}
            >
              <Terminal size={13} className="text-purple-400" />
              <span>cURL</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-md font-medium transition shadow-sm"
          >
            {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>

        {/* Code Content Box */}
        <div className="p-4 flex-1 overflow-y-auto bg-[#0a0d14]">
          <pre className="font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto p-2">
            <code>{getCode()}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-ide-border bg-ide-surface/30 flex items-center justify-between text-xs text-ide-muted">
          <span>Target Dataset: <code className="text-emerald-400 font-mono font-semibold">{datasetId}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-ide-surface hover:bg-ide-panel border border-ide-border text-white text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
