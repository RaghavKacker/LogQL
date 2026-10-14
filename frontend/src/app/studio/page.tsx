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
import { Sidebar } from "@/components/Sidebar";
import { UploadModal } from "@/components/UploadModal";
import { QueryEditor } from "@/components/QueryEditor";
import { TokenViewer } from "@/components/TokenViewer";
import { AstViewer } from "@/components/AstViewer";
import { SemanticViewer } from "@/components/SemanticViewer";
import { OptimizerDiff } from "@/components/OptimizerDiff";
import { PlanViewer } from "@/components/PlanViewer";
import { ResultsTable } from "@/components/ResultsTable";
import { MetricsCharts } from "@/components/MetricsCharts";
import {
  Code2,
  GitBranch,
  ShieldCheck,
  Zap,
  Network,
  Table as TableIcon,
  BarChart2,
  AlertTriangle,
  BookOpen,
  PanelLeftClose,
  PanelLeft,
  CheckCircle2,
  Database
} from "lucide-react";

const VALID_TABS = ["results", "tokens", "ast", "semantic", "optimizer", "plan", "charts"] as const;
type TabType = typeof VALID_TABS[number];

const DEFAULT_QUERY = `SELECT service, COUNT(*)\nFROM logs\nWHERE status >= 500\nGROUP BY service\nORDER BY COUNT(*) DESC;`;

export default function StudioPage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDataset, setSelectedDataset] = useState("app_events");
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<"execute" | "compile" | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("results");
  const [response, setResponse] = useState<CompilerResponse | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const switchActiveTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("logql_active_tab", tab);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.replaceState({}, "", url.pathname + url.search);
      } catch (e) {}
    }
  }, []);

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
    datasetId = selectedDataset,
    switchTabOnSuccess = true
  ) => {
    if (!queryText.trim()) return;
    setLoading(true);
    setActionType("execute");
    try {
      const res = await executeQuery(queryText, datasetId);
      setResponse(res);
      if (switchTabOnSuccess && res.results && res.results.rows) {
        switchActiveTab("results");
      } else if (!res.success) {
        if (res.stage === "Parser" || res.stage === "Lexer") switchActiveTab("tokens");
        else if (res.stage === "SemanticAnalysis") switchActiveTab("semantic");
      }
    } catch (err: any) {
      console.error(err);
      setResponse({
        success: false,
        stage: "Network",
        error: "Failed to connect to the LogQL compiler backend at 127.0.0.1:8000. Ensure the FastAPI server is running."
      });
    } finally {
      setLoading(false);
      setActionType(null);
    }
  }, [query, selectedDataset, switchActiveTab]);

  const handleCompile = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setActionType("compile");
    try {
      const res = await compileQuery(query);
      setResponse(res);
      if (res.ast) {
        switchActiveTab("ast");
      }
    } catch (err: any) {
      console.error(err);
      setResponse({
        success: false,
        stage: "Network",
        error: "Failed to connect to the LogQL compiler backend at 127.0.0.1:8000."
      });
    } finally {
      setLoading(false);
      setActionType(null);
    }
  }, [query, switchActiveTab]);

  useEffect(() => {
    let initialTab: TabType = "results";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab") as TabType;
      const hashTab = window.location.hash.replace("#", "") as TabType;
      const storedTab = localStorage.getItem("logql_active_tab") as TabType;

      if (urlTab && VALID_TABS.includes(urlTab)) {
        initialTab = urlTab;
      } else if (hashTab && VALID_TABS.includes(hashTab)) {
        initialTab = hashTab;
      } else if (storedTab && VALID_TABS.includes(storedTab)) {
        initialTab = storedTab;
      }

      const url = new URL(window.location.href);
      if (url.searchParams.get("tab") !== initialTab) {
        url.searchParams.set("tab", initialTab);
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
    setActiveTab(initialTab);

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
    }

    loadDatasets();
    handleExecute(initialQuery, initialDataset, false);
  }, []);

  const handleInsertField = (fieldName: string) => {
    setQuery((prev) => {
      const updated = (prev.endsWith(" ") || prev.endsWith(",")) ? prev + fieldName : prev + ` ${fieldName}`;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("logql_query", updated);
        } catch (e) {}
      }
      return updated;
    });
  };

  const handleSelectPreset = (presetQuery: string) => {
    handleQueryChange(presetQuery);
    handleExecute(presetQuery, selectedDataset, true);
  };

  const tabs = [
    {
      id: "results" as const,
      label: "Results",
      sublabel: "Execution Output",
      icon: <TableIcon size={14} />,
      badge: response?.results?.rows ? `${response.results.rows.length} rows` : null,
    },
    {
      id: "tokens" as const,
      label: "Tokens",
      sublabel: "Flex Scanner",
      icon: <Code2 size={14} />,
      badge: response?.tokens ? `${response.tokens.length}` : null,
    },
    {
      id: "ast" as const,
      label: "AST Tree",
      sublabel: "Bison Parser",
      icon: <GitBranch size={14} />,
      badge: response?.ast ? "Parsed" : null,
    },
    {
      id: "semantic" as const,
      label: "Semantics",
      sublabel: "Types & Scope",
      icon: <ShieldCheck size={14} />,
      badge: response?.semantic?.isValid ? "Valid" : response?.semantic ? "Error" : null,
    },
    {
      id: "optimizer" as const,
      label: "Optimizer",
      sublabel: "Rule Passes",
      icon: <Zap size={14} />,
      badge: response?.optimizations ? `${response.optimizations.length} passes` : null,
    },
    {
      id: "plan" as const,
      label: "Execution Plan",
      sublabel: "Volcano Pipeline",
      icon: <Network size={14} />,
      badge: response?.physicalPlan ? "Generated" : null,
    },
    {
      id: "charts" as const,
      label: "Charts",
      sublabel: "Visual Analytics",
      icon: <BarChart2 size={14} />,
      badge: null,
    },
  ];

  const activeDatasetObj = datasets.find((d) => d.id === selectedDataset);

  const getCleanTitle = (d?: DatasetInfo) => {
    if (!d) return selectedDataset;
    if (d.id === "app_events") return "Microservice Application Logs";
    if (d.id === "web_access") return "Web Access Logs";
    if (d.id === "system") return "Operating System Daemons";
    return d.name;
  };

  const errorText = response?.error ? response.error.toLowerCase() : "";

  return (
    <div className="h-screen bg-ide-bg text-ide-text flex flex-col font-sans overflow-hidden">
      {/* Top Application Bar */}
      <header className="h-11 bg-ide-sidebar border-b border-ide-border px-3.5 flex items-center justify-between select-none text-xs flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Datasets & Schema Sidebar"
            className="p-1 hover:bg-ide-surface rounded text-ide-muted hover:text-white transition"
          >
            {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
          </button>

          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono tracking-tight text-sm flex items-center gap-1.5">
              <span className="text-emerald-400 font-black">&lt;/&gt;</span> LogQL
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ide-surface text-ide-muted border border-ide-border font-medium">
              Compiler Studio
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-ide-border text-xs text-ide-muted">
            <span className="text-ide-subtle">Active Dataset:</span>
            <span className="font-mono text-slate-200 bg-ide-panel px-2 py-0.5 rounded border border-ide-border font-medium flex items-center gap-1.5">
              <Database size={11} className="text-ide-muted" />
              {getCleanTitle(activeDatasetObj)}
            </span>
            {activeDatasetObj && (
              <span className="text-ide-subtle text-[11px] font-mono">
                ({activeDatasetObj.recordCount.toLocaleString()} records &bull; {activeDatasetObj.format})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-ide-subtle bg-ide-panel px-2.5 py-0.5 rounded border border-ide-border">
            <span>Flex 2.6 &bull; Bison 3.8 &bull; C++17</span>
          </div>

          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-xs text-ide-muted hover:text-white px-2.5 py-1 rounded hover:bg-ide-surface transition border border-transparent hover:border-ide-border font-medium"
          >
            <BookOpen size={12} className="text-ide-muted" />
            <span>Grammar &amp; Docs</span>
          </Link>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {isSidebarOpen && (
          <Sidebar
            datasets={datasets}
            selectedDataset={selectedDataset}
            onSelectDataset={(id) => {
              handleDatasetChange(id);
              handleExecute(query, id);
            }}
            onOpenUpload={() => setIsUploadOpen(true)}
            onSelectPreset={handleSelectPreset}
            onLoadPreset={(presetQuery) => handleQueryChange(presetQuery)}
            onInsertField={handleInsertField}
          />
        )}

        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-ide-bg">
          <div className="p-3 sm:p-4 space-y-3 w-full flex-1 flex flex-col max-w-7xl mx-auto">
            {/* Query Editor Box */}
            <div className="flex-shrink-0">
              <QueryEditor
                query={query}
                setQuery={handleQueryChange}
                onExecute={() => handleExecute(query, selectedDataset, true)}
                onCompile={handleCompile}
                onClear={() => handleQueryChange("")}
                loading={loading}
                datasets={datasets}
                selectedDataset={selectedDataset}
                onSelectDataset={(id) => {
                  handleDatasetChange(id);
                  handleExecute(query, id);
                }}
              />
            </div>

            {/* Error Banner (Clean, actionable diagnostic card) */}
            {response && !response.success && (
              <div className="bg-red-950/30 border border-red-800/60 rounded-lg p-3.5 text-xs font-mono text-red-200 flex items-start gap-3 shadow-sm flex-shrink-0">
                <AlertTriangle size={16} className="text-status-error mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
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
                  <div className="bg-ide-panel/80 border border-ide-border rounded p-2.5 text-slate-300 text-xs font-sans">
                    <div className="font-semibold text-white flex items-center gap-1.5 mb-1 text-[11px]">
                      <span>How to resolve:</span>
                    </div>
                    <p className="text-ide-muted leading-relaxed">
                      {errorText.includes("group by") || errorText.includes("ungrouped")
                        ? "In aggregate queries with GROUP BY, every column in the SELECT list that is not inside an aggregate function (COUNT, AVG, SUM, MIN, MAX) must be explicitly listed in the GROUP BY clause."
                        : errorText.includes("unknown column") || errorText.includes("not found")
                        ? "The requested column does not exist. Click on any field name in the left sidebar to insert valid schema attributes (e.g. timestamp, service, level, status, response_time, path, ip, message)."
                        : errorText.includes("syntax") || errorText.includes("unexpected")
                        ? "Check that all columns are separated by commas, string literals are enclosed in quotes (e.g. 'auth-service'), clauses follow standard order (SELECT ... FROM ... WHERE ... GROUP BY ... ORDER BY ... LIMIT ...), and the statement ends with a semicolon."
                        : "Check the Syntax Cheatsheet in the left sidebar or the Documentation page for grammar specifications and valid query examples."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Results & Compiler Stages Tabbed Container */}
            <div className="bg-ide-panel border border-ide-border rounded-lg flex flex-col flex-1 min-h-[340px] shadow-sm overflow-hidden">
              {/* Unified Tab Navigation Bar */}
              <div className="bg-ide-surface/70 border-b border-ide-border px-3 flex items-center justify-between overflow-x-auto flex-shrink-0">
                <div className="flex items-center gap-1 py-1">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => switchActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition select-none ${
                          isActive
                            ? "bg-ide-panel text-white shadow-sm font-semibold border border-ide-border"
                            : "text-ide-muted hover:text-white hover:bg-ide-surface"
                        }`}
                      >
                        <span className={isActive ? "text-emerald-400" : "text-ide-subtle"}>
                          {tab.icon}
                        </span>
                        <span>{tab.label}</span>
                        {tab.badge && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
                              isActive
                                ? "bg-ide-surface text-ide-text border border-ide-borderLight"
                                : "bg-ide-bg text-ide-subtle"
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Status indicator on the right of tabs */}
                {response && response.success && response.results && (
                  <div className="hidden sm:flex items-center gap-2.5 text-xs font-mono text-ide-muted pr-1">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                      <CheckCircle2 size={12} /> Success
                    </span>
                    <span className="text-ide-subtle">&bull;</span>
                    <span className="text-[11px] text-ide-text">{response.results.rows.length} rows</span>
                    <span className="text-ide-subtle">&bull;</span>
                    <span className="text-ide-text font-medium text-[11px]">
                      {response.results.metrics?.executionTimeMs?.toFixed(3) || "0.200"} ms
                    </span>
                  </div>
                )}
              </div>

              {/* Active Tab Content Pane */}
              <div className="p-3 sm:p-4 flex-1 min-h-0 overflow-y-auto bg-ide-panel">
                {activeTab === "results" && <ResultsTable results={response?.results} />}
                {activeTab === "tokens" && <TokenViewer tokens={response?.tokens} />}
                {activeTab === "ast" && <AstViewer ast={response?.ast} />}
                {activeTab === "semantic" && <SemanticViewer semantic={response?.semantic} />}
                {activeTab === "optimizer" && (
                  <OptimizerDiff
                    optimizations={response?.optimizations}
                    originalAst={response?.ast}
                    optimizedAst={response?.optimizedAst}
                  />
                )}
                {activeTab === "plan" && <PlanViewer plan={response?.physicalPlan} />}
                {activeTab === "charts" && <MetricsCharts results={response?.results} />}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Dataset Ingestion Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={async (newId) => {
          await loadDatasets();
          if (newId) {
            setSelectedDataset(newId);
          }
        }}
      />
    </div>
  );
}
