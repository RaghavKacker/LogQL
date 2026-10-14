"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  compileQuery,
  executeQuery,
  fetchDatasets,
  CompilerResponse,
  DatasetInfo
} from "@/lib/api";
import { UploadModal } from "@/components/UploadModal";
import { QueryEditor, PRESET_QUERIES } from "@/components/QueryEditor";
import { TokenViewer } from "@/components/TokenViewer";
import { AstViewer } from "@/components/AstViewer";
import { SemanticViewer } from "@/components/SemanticViewer";
import { OptimizerDiff } from "@/components/OptimizerDiff";
import { PlanViewer } from "@/components/PlanViewer";
import { ResultsTable } from "@/components/ResultsTable";
import {
  Terminal,
  Code2,
  GitBranch,
  ShieldCheck,
  Zap,
  Network,
  Database,
  BookOpen,
  AlertTriangle,
  Upload,
  ArrowRight,
  ExternalLink,
  Layers,
  FileText
} from "lucide-react";

type MainView = "studio" | "compiler" | "plan" | "datasets";
type CompilerTab = "tokens" | "ast" | "semantic" | "optimizer";

const DEFAULT_QUERY = `SELECT service, COUNT(*)\nFROM logs\nWHERE status >= 500\nGROUP BY service\nORDER BY COUNT(*) DESC;`;

const SCHEMA_FIELDS = [
  { name: "timestamp", type: "STRING", sample: '"2026-10-14T10:15:30Z"', desc: "ISO-8601 formatted event timestamp string" },
  { name: "service", type: "STRING", sample: '"auth-service"', desc: "Originating service or process name" },
  { name: "level", type: "STRING", sample: '"INFO", "ERROR"', desc: "Severity level (DEBUG, INFO, WARN, ERROR, FATAL)" },
  { name: "status", type: "INTEGER", sample: "200, 404, 500", desc: "HTTP response code or process exit status" },
  { name: "response_time", type: "FLOAT", sample: "42.5", desc: "Request latency in milliseconds" },
  { name: "path", type: "STRING", sample: '"/api/v1/login"', desc: "Request URL path or endpoint" },
  { name: "ip", type: "STRING", sample: '"192.168.1.10"', desc: "Client IPv4 or IPv6 address" },
  { name: "message", type: "STRING", sample: '"Connection timeout"', desc: "Descriptive event log message" },
];

export default function StudioPage() {
  const [currentView, setCurrentView] = useState<MainView>("studio");
  const [compilerTab, setCompilerTab] = useState<CompilerTab>("tokens");
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDataset, setSelectedDataset] = useState("app_events");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CompilerResponse | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("logql_query", newQuery);
      } catch (e) {}
    }
  };

  const handleDatasetChange = (newDataset: string) => {
    setSelectedDataset(newDataset);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("logql_selected_dataset", newDataset);
      } catch (e) {}
    }
  };

  const loadDatasets = async () => {
    try {
      const list = await fetchDatasets();
      setDatasets(list);
      if (list.length > 0 && !selectedDataset) {
        setSelectedDataset(list[0].id);
      }
    } catch (e) {
      console.error("Failed to load datasets", e);
    }
  };

  const handleExecute = useCallback(async (
    queryText = query,
    datasetId = selectedDataset
  ) => {
    if (!queryText.trim()) return;
    setLoading(true);
    try {
      const res = await executeQuery(queryText, datasetId);
      setResponse(res);
    } catch (err: any) {
      console.error(err);
      setResponse({
        success: false,
        stage: "Network",
        error: "Failed to connect to the LogQL compiler backend at 127.0.0.1:8000. Ensure the FastAPI server is running."
      });
    } finally {
      setLoading(false);
    }
  }, [query, selectedDataset]);

  const handleCompile = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await compileQuery(query);
      setResponse(res);
      setCurrentView("compiler");
      setCompilerTab("ast");
    } catch (err: any) {
      console.error(err);
      setResponse({
        success: false,
        stage: "Network",
        error: "Failed to connect to the LogQL compiler backend at 127.0.0.1:8000."
      });
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    let initialQuery = DEFAULT_QUERY;
    if (typeof window !== "undefined") {
      const storedQuery = localStorage.getItem("logql_query");
      if (storedQuery && storedQuery.trim()) {
        initialQuery = storedQuery;
        setQuery(storedQuery);
      }
    }

    let initialDataset = "app_events";
    if (typeof window !== "undefined") {
      const storedDataset = localStorage.getItem("logql_selected_dataset");
      if (storedDataset) {
        initialDataset = storedDataset;
        setSelectedDataset(storedDataset);
      }

      const params = new URLSearchParams(window.location.search);
      const urlView = params.get("view") as MainView;
      if (urlView && ["studio", "compiler", "plan", "datasets"].includes(urlView)) {
        setCurrentView(urlView);
      }
    }

    loadDatasets();
    handleExecute(initialQuery, initialDataset);
  }, []);

  const handleSelectPreset = (presetQuery: string) => {
    handleQueryChange(presetQuery);
    handleExecute(presetQuery, selectedDataset);
  };

  const activeDatasetObj = datasets.find((d) => d.id === selectedDataset);
  const errorText = response?.error ? response.error.toLowerCase() : "";

  return (
    <div className="min-h-screen bg-ide-bg text-ide-text flex flex-col font-sans">
      {/* Clean Top Navigation Bar */}
      <header className="h-12 bg-ide-sidebar border-b border-ide-border px-4 sm:px-6 flex items-center justify-between select-none sticky top-0 z-30">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link
            href="/"
            onClick={() => setCurrentView("studio")}
            className="flex items-center gap-2 text-white font-mono font-bold text-sm tracking-tight hover:opacity-90 transition"
          >
            <span className="text-emerald-400 font-black text-base">&lt;/&gt;</span>
            <span>LogQL</span>
          </Link>

          {/* Section Navigation */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setCurrentView("studio")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                currentView === "studio"
                  ? "bg-ide-surface text-white shadow-sm"
                  : "text-ide-muted hover:text-white hover:bg-ide-surface/50"
              }`}
            >
              <Terminal size={14} className={currentView === "studio" ? "text-emerald-400" : "text-ide-subtle"} />
              <span>Query Studio</span>
            </button>

            <button
              onClick={() => setCurrentView("compiler")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                currentView === "compiler"
                  ? "bg-ide-surface text-white shadow-sm"
                  : "text-ide-muted hover:text-white hover:bg-ide-surface/50"
              }`}
            >
              <Code2 size={14} className={currentView === "compiler" ? "text-purple-400" : "text-ide-subtle"} />
              <span>Compiler Analysis</span>
              {response?.tokens && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-ide-bg text-ide-subtle">
                  {response.tokens.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentView("plan")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                currentView === "plan"
                  ? "bg-ide-surface text-white shadow-sm"
                  : "text-ide-muted hover:text-white hover:bg-ide-surface/50"
              }`}
            >
              <Network size={14} className={currentView === "plan" ? "text-sky-400" : "text-ide-subtle"} />
              <span>Execution Plan</span>
            </button>

            <button
              onClick={() => setCurrentView("datasets")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                currentView === "datasets"
                  ? "bg-ide-surface text-white shadow-sm"
                  : "text-ide-muted hover:text-white hover:bg-ide-surface/50"
              }`}
            >
              <Database size={14} className={currentView === "datasets" ? "text-amber-400" : "text-ide-subtle"} />
              <span>Datasets</span>
            </button>
          </nav>
        </div>

        {/* Right Info & Documentation Link */}
        <div className="flex items-center gap-3">
          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-xs text-ide-muted hover:text-white px-2.5 py-1.5 rounded-md hover:bg-ide-surface transition font-medium"
          >
            <BookOpen size={13} className="text-ide-subtle" />
            <span>Documentation</span>
          </Link>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {/* ================= VIEW 1: QUERY STUDIO ================= */}
        {currentView === "studio" && (
          <div className="space-y-4 flex-1 flex flex-col">
            {/* Query Editor Component */}
            <QueryEditor
              query={query}
              setQuery={handleQueryChange}
              onExecute={() => handleExecute(query, selectedDataset)}
              onCompile={handleCompile}
              onClear={() => handleQueryChange("")}
              loading={loading}
              datasets={datasets}
              selectedDataset={selectedDataset}
              onSelectDataset={(id) => {
                handleDatasetChange(id);
                handleExecute(query, id);
              }}
              onSelectPreset={handleSelectPreset}
            />

            {/* Error Message Card */}
            {response && !response.success && (
              <div className="bg-red-950/30 border border-red-800/60 rounded-lg p-3.5 text-xs font-mono text-red-200 flex items-start gap-3 shadow-sm">
                <AlertTriangle size={16} className="text-status-error mt-0.5 flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="font-semibold text-red-300 text-xs flex items-center gap-2">
                    <span>Compilation Error [{response.stage || "Pipeline"}]</span>
                    {response.line ? (
                      <span className="text-[11px] font-normal text-red-300 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/70">
                        Line {response.line}, Col {response.col}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-xs bg-ide-bg/80 p-2.5 rounded border border-ide-border">
                    {response.error || "An unknown compilation error occurred."}
                  </div>
                  <p className="text-ide-muted font-sans text-xs">
                    {errorText.includes("group by") || errorText.includes("ungrouped")
                      ? "In aggregate queries with GROUP BY, every column in the SELECT list that is not inside an aggregate function (COUNT, AVG, SUM, MIN, MAX) must be explicitly listed in the GROUP BY clause."
                      : errorText.includes("unknown column") || errorText.includes("not found")
                      ? "The requested column does not exist. Check the Datasets view to see all 8 valid schema fields (timestamp, service, level, status, response_time, path, ip, message)."
                      : errorText.includes("syntax") || errorText.includes("unexpected")
                      ? "Verify that all columns are separated by commas, strings are enclosed in single quotes ('auth-service'), and clauses follow standard SQL order (SELECT ... FROM ... WHERE ... GROUP BY ... ORDER BY ... LIMIT ...)."
                      : "Check the Documentation page for valid syntax specifications and examples."}
                  </p>
                </div>
              </div>
            )}

            {/* Results Section */}
            <div className="flex-1 flex flex-col pt-1">
              <ResultsTable results={response?.results} />

              {/* Discreet Link to Compiler View */}
              {response?.success && (
                <div className="pt-3 pb-2 flex items-center justify-between text-xs text-ide-muted border-t border-ide-border/60 mt-3">
                  <span>Want to see how the compiler parsed and optimized this query?</span>
                  <button
                    onClick={() => setCurrentView("compiler")}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition"
                  >
                    <span>Inspect Compiler Stages</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 2: COMPILER ANALYSIS ================= */}
        {currentView === "compiler" && (
          <div className="space-y-4 flex-1 flex flex-col">
            {/* Header with Query context */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-ide-panel border border-ide-border p-3 rounded-lg text-xs">
              <div className="flex items-center gap-2">
                <span className="text-ide-subtle">Inspecting:</span>
                <code className="text-ide-text font-mono bg-ide-bg px-2 py-0.5 rounded border border-ide-border truncate max-w-md sm:max-w-xl">
                  {query.replace(/\n/g, " ").slice(0, 80)}{query.length > 80 ? "..." : ""}
                </code>
              </div>
              <button
                onClick={() => setCurrentView("studio")}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <span>Edit in Query Studio</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Sub-Tabs for Compiler Stages */}
            <div className="bg-ide-panel border border-ide-border rounded-lg flex flex-col flex-1 overflow-hidden shadow-sm">
              <div className="bg-ide-surface/60 border-b border-ide-border px-3 flex items-center gap-1 overflow-x-auto py-1">
                <button
                  onClick={() => setCompilerTab("tokens")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition ${
                    compilerTab === "tokens"
                      ? "bg-ide-panel text-white shadow-sm border border-ide-border font-semibold"
                      : "text-ide-muted hover:text-white"
                  }`}
                >
                  <Code2 size={13} className="text-blue-400" />
                  <span>1. Tokens (Flex Scanner)</span>
                  {response?.tokens && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-ide-bg text-ide-subtle">
                      {response.tokens.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setCompilerTab("ast")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition ${
                    compilerTab === "ast"
                      ? "bg-ide-panel text-white shadow-sm border border-ide-border font-semibold"
                      : "text-ide-muted hover:text-white"
                  }`}
                >
                  <GitBranch size={13} className="text-purple-400" />
                  <span>2. AST Tree (Bison Parser)</span>
                </button>

                <button
                  onClick={() => setCompilerTab("semantic")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition ${
                    compilerTab === "semantic"
                      ? "bg-ide-panel text-white shadow-sm border border-ide-border font-semibold"
                      : "text-ide-muted hover:text-white"
                  }`}
                >
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>3. Semantic Validation</span>
                  {response?.semantic && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${response.semantic.isValid ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}>
                      {response.semantic.isValid ? "Pass" : "Error"}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setCompilerTab("optimizer")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition ${
                    compilerTab === "optimizer"
                      ? "bg-ide-panel text-white shadow-sm border border-ide-border font-semibold"
                      : "text-ide-muted hover:text-white"
                  }`}
                >
                  <Zap size={13} className="text-amber-400" />
                  <span>4. Optimizer Passes</span>
                  {response?.optimizations && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-ide-bg text-ide-subtle">
                      {response.optimizations.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Content Pane */}
              <div className="p-4 flex-1 overflow-y-auto">
                {compilerTab === "tokens" && <TokenViewer tokens={response?.tokens} />}
                {compilerTab === "ast" && <AstViewer ast={response?.ast} />}
                {compilerTab === "semantic" && <SemanticViewer semantic={response?.semantic} />}
                {compilerTab === "optimizer" && (
                  <OptimizerDiff
                    optimizations={response?.optimizations}
                    originalAst={response?.ast}
                    optimizedAst={response?.optimizedAst}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 3: EXECUTION PLAN ================= */}
        {currentView === "plan" && (
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-ide-panel border border-ide-border p-3 rounded-lg text-xs">
              <div className="flex items-center gap-2">
                <span className="text-ide-subtle">Query Plan:</span>
                <span className="text-ide-text font-mono truncate max-w-md sm:max-w-xl">
                  {query.replace(/\n/g, " ").slice(0, 80)}{query.length > 80 ? "..." : ""}
                </span>
              </div>
              <button
                onClick={() => setCurrentView("studio")}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <span>Run in Studio</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="bg-ide-panel border border-ide-border rounded-lg p-4 flex-1 overflow-y-auto">
              <PlanViewer plan={response?.physicalPlan} />
            </div>
          </div>
        )}

        {/* ================= VIEW 4: DATASETS & SCHEMA ================= */}
        {currentView === "datasets" && (
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-base font-semibold text-white">Log Datasets &amp; Schema</h1>
                <p className="text-xs text-ide-muted mt-0.5">
                  LogQL normalizes JSON Lines, Apache/Nginx CLF, and Syslog formats into a unified in-memory schema.
                </p>
              </div>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-ide-surface hover:bg-ide-hover border border-ide-border rounded-md text-xs font-medium text-white transition shadow-sm"
              >
                <Upload size={13} />
                <span>Upload Custom Log</span>
              </button>
            </div>

            {/* Dataset Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {datasets.map((d) => {
                const isSelected = d.id === selectedDataset;
                return (
                  <div
                    key={d.id}
                    className={`bg-ide-panel border rounded-lg p-4 space-y-3 flex flex-col justify-between transition ${
                      isSelected ? "border-emerald-600/80 shadow-sm" : "border-ide-border hover:border-ide-borderLight"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-semibold text-white text-xs">{d.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-ide-surface text-ide-muted border border-ide-border">
                          {d.format.includes("JSON") ? "JSONL" : d.format.includes("CLF") ? "CLF" : "Syslog"}
                        </span>
                      </div>
                      <p className="text-xs text-ide-muted leading-relaxed font-sans">
                        {d.id === "app_events"
                          ? "Microservice events with status codes, latency in ms, and service names."
                          : d.id === "web_access"
                          ? "Web server access logs capturing HTTP requests, client IPs, and endpoints."
                          : "Linux syslog daemon records containing system service messages."}
                      </p>
                      <div className="text-[11px] font-mono text-ide-subtle mt-2">
                        {d.recordCount.toLocaleString()} total records
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleDatasetChange(d.id);
                        handleExecute(query, d.id);
                        setCurrentView("studio");
                      }}
                      className={`w-full py-1.5 px-3 rounded text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/40"
                          : "bg-ide-surface hover:bg-ide-hover text-slate-200 border border-ide-border"
                      }`}
                    >
                      {isSelected ? "Active Target" : "Select & Query"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Normalized Schema Table */}
            <div className="space-y-2.5">
              <h2 className="text-sm font-semibold text-white">Normalized Schema Attributes</h2>
              <div className="border border-ide-border rounded-lg overflow-hidden bg-ide-panel shadow-sm">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead className="bg-ide-surface/80 text-ide-muted uppercase tracking-wider text-[11px] border-b border-ide-border select-none">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold text-slate-200">Field Name</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-200">Type</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-200">Sample Value</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-200">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ide-border text-slate-200">
                    {SCHEMA_FIELDS.map((f, i) => (
                      <tr key={i} className="hover:bg-ide-surface/30 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-white text-xs">{f.name}</td>
                        <td className="py-2.5 px-4">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ide-bg text-ide-muted border border-ide-border">
                            {f.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-ide-subtle text-xs">{f.sample}</td>
                        <td className="py-2.5 px-4 font-sans text-xs text-ide-muted">{f.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={async (newId) => {
          await loadDatasets();
          if (newId) {
            setSelectedDataset(newId);
            handleExecute(query, newId);
          }
        }}
      />
    </div>
  );
}
