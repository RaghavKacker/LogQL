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
  Terminal,
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
  Cpu,
  Layers,
  Clock,
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
      id: "results",
      label: "Results",
      icon: <TableIcon size={14} />,
      badge: response?.results?.rows ? `${response.results.rows.length}` : null,
      color: "text-[#72b192]"
    },
    {
      id: "tokens",
      label: "Tokens",
      icon: <Code2 size={14} />,
      badge: response?.tokens ? `${response.tokens.length}` : null,
      color: "text-[#6ea8a3]"
    },
    {
      id: "ast",
      label: "AST IR",
      icon: <GitBranch size={14} />,
      badge: response?.ast ? "LALR(1)" : null,
      color: "text-[#9b8cb8]"
    },
    {
      id: "semantic",
      label: "Semantics",
      icon: <ShieldCheck size={14} />,
      badge: response?.semantic?.isValid ? "Pass" : response?.semantic ? "Error" : null,
      color: response?.semantic?.isValid ? "text-[#72b192]" : "text-[#d47878]"
    },
    {
      id: "optimizer",
      label: "Optimizer",
      icon: <Zap size={14} />,
      badge: response?.optimizations ? `${response.optimizations.length}` : null,
      color: "text-[#cfa058]"
    },
    {
      id: "plan",
      label: "Physical Plan",
      icon: <Network size={14} />,
      badge: response?.physicalPlan ? "Volcano" : null,
      color: "text-[#7fa1c4]"
    },
    {
      id: "charts",
      label: "Visual Charts",
      icon: <BarChart2 size={14} />,
      badge: null,
      color: "text-[#8ea8c9]"
    },
  ];

  const activeDatasetObj = datasets.find((d) => d.id === selectedDataset);

  const getCleanTitle = (d?: DatasetInfo) => {
    if (!d) return selectedDataset;
    if (d.id === "app_events") return "Microservice Application Logs";
    if (d.id === "web_access") return "Nginx / Apache Web Access Logs";
    if (d.id === "system") return "Operating System Daemons";
    return d.name;
  };

  return (
    <div className="h-screen bg-ide-bg text-ide-text flex flex-col font-sans overflow-hidden">
      {/* Top Application Bar */}
      <header className="h-11 bg-ide-sidebar border-b border-ide-border px-3.5 flex items-center justify-between select-none text-xs flex-shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Datasets & Schema Sidebar"
            className="p-1 hover:bg-ide-hover rounded-md text-slate-300 hover:text-white transition"
          >
            {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
          </button>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 font-mono tracking-tight text-sm flex items-center gap-1.5">
              <span className="text-[#7fa1c4] font-black">&lt;/&gt;</span> LogQL
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#182232] text-[#8ea8c9] border border-[#2c3d59] font-semibold tracking-wider">
              Compiler Workbench
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-ide-border text-xs text-slate-300">
            <span className="text-slate-400">Target:</span>
            <span className="font-mono text-slate-100 bg-ide-panel px-2 py-0.5 rounded-md border border-ide-border font-medium flex items-center gap-1.5">
              <Database size={12} className="text-[#7fa1c4]" />
              {getCleanTitle(activeDatasetObj)}
            </span>
            {activeDatasetObj && (
              <span className="text-slate-400 text-xs font-mono">
                ({activeDatasetObj.recordCount.toLocaleString()} records &bull; {activeDatasetObj.format})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-300 bg-ide-panel px-2.5 py-0.5 rounded-md border border-ide-border shadow-inner">
            <Cpu size={12} className="text-[#7fa1c4]" />
            <span>Flex 2.6 &bull; Bison 3.8 &bull; GCC C++17</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/docs"
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-md hover:bg-ide-hover transition border border-transparent hover:border-ide-border"
            >
              <BookOpen size={12} className="text-[#7fa1c4]" />
              <span className="font-medium">Grammar & Docs</span>
            </Link>
          </div>
        </div>
      </header>

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
          <div className="p-2.5 sm:p-3.5 space-y-2 w-full flex-1 flex flex-col">
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

            <div className="bg-ide-panel border border-ide-border rounded-lg p-2 sm:p-2.5 shadow-sm flex-shrink-0">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-ide-border text-[11px]">
                <span className="font-mono text-slate-300 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] flex items-center gap-1.5">
                  <Cpu size={12} className="text-[#7fa1c4]" /> Compilation & Execution Pipeline
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                  Click any stage to inspect intermediate representation (IR)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
                {[
                  {
                    id: "tokens",
                    step: "1. Lexer",
                    detail: "Flex Scanner",
                    badge: response?.tokens ? `${response.tokens.length} tokens` : "Idle",
                    active: activeTab === "tokens",
                    accent: "text-[#6ea8a3]",
                    border: "border-[#2b4247]",
                    passed: Boolean(response?.tokens)
                  },
                  {
                    id: "ast",
                    step: "2. Parser",
                    detail: "Bison LALR(1)",
                    badge: response?.ast ? "AST Built" : "Idle",
                    active: activeTab === "ast",
                    accent: "text-[#9b8cb8]",
                    border: "border-[#3d3251]",
                    passed: Boolean(response?.ast)
                  },
                  {
                    id: "semantic",
                    step: "3. Semantics",
                    detail: "Type & Scope",
                    badge: response?.semantic?.isValid ? "Valid" : response?.semantic ? "Error" : "Idle",
                    active: activeTab === "semantic",
                    accent: response?.semantic?.isValid ? "text-[#72b192]" : response?.semantic ? "text-[#d47878]" : "text-slate-400",
                    border: "border-[#2e4236]",
                    passed: Boolean(response?.semantic?.isValid)
                  },
                  {
                    id: "optimizer",
                    step: "4. Optimizer",
                    detail: "AST Rewriter",
                    badge: response?.optimizations ? `${response.optimizations.length} passes` : "Idle",
                    active: activeTab === "optimizer",
                    accent: "text-[#cfa058]",
                    border: "border-[#4a3920]",
                    passed: Boolean(response?.optimizations)
                  },
                  {
                    id: "plan",
                    step: "5. Physical Plan",
                    detail: "Volcano Iterators",
                    badge: response?.physicalPlan ? "Constructed" : "Idle",
                    active: activeTab === "plan",
                    accent: "text-[#7fa1c4]",
                    border: "border-[#2d3f57]",
                    passed: Boolean(response?.physicalPlan)
                  },
                  {
                    id: "results",
                    step: "6. Executor",
                    detail: "Table Output",
                    badge: response?.results?.rows ? `${response.results.rows.length} rows` : "Idle",
                    active: activeTab === "results",
                    accent: "text-[#72b192]",
                    border: "border-[#284236]",
                    passed: Boolean(response?.results?.rows)
                  }
                ].map((s) => {
                  return (
                    <button
                      key={s.id}
                      onClick={() => switchActiveTab(s.id as any)}
                      className={`text-left p-1.5 sm:p-2 rounded-md border transition-all select-none ${
                        s.active
                          ? `bg-[#182333] border-[#415a7d] shadow-sm ring-1 ring-[#415a7d]/50`
                          : "bg-ide-bg/80 border-ide-border hover:bg-ide-surface hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[11px] font-semibold font-mono ${s.active ? s.accent : "text-slate-200"}`}>
                          {s.step}
                        </span>
                        {s.passed && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#72b192] inline-block shadow-sm"></span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mb-0.5">
                        {s.detail}
                      </div>
                      <div className="inline-block text-[9px] font-mono px-1 py-0.1 rounded bg-ide-surface border border-ide-border text-slate-300">
                        {s.badge}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {response && !response.success && (
              <div className="bg-[#241a1c] border border-[#523337] rounded-lg p-3 text-xs font-mono text-[#d49b9b] flex items-start gap-2.5 shadow-md flex-shrink-0">
                <AlertTriangle size={16} className="text-[#d47878] mt-0.5 flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="font-bold text-[#e0a6a6] text-xs tracking-wide flex items-center gap-2">
                    <span>Compilation Error [{response.stage || "Pipeline"}]</span>
                    {response.line ? (
                      <span className="text-[11px] font-normal text-[#d49b9b] bg-[#332023] px-2 py-0.2 rounded-full border border-[#5c373c]">
                        Line {response.line}, Col {response.col}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-xs bg-[#1d1516] p-2.5 rounded border border-[#3f272a]">
                    {response.error}
                  </div>
                  <div className="bg-[#1b1c24] border border-[#333a4c] rounded p-2 text-slate-200 text-xs">
                    <div className="font-semibold text-[#8ea8c9] flex items-center gap-1.5 mb-0.5 font-sans text-[11px]">
                      <span>💡 How to Fix:</span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">
                      {response.error.toLowerCase().includes("group by") || response.error.toLowerCase().includes("ungrouped")
                        ? "In aggregate queries with GROUP BY, every column in the SELECT list that is not part of an aggregate function (COUNT, AVG, SUM, MIN, MAX) must be explicitly included in the GROUP BY clause."
                        : response.error.toLowerCase().includes("unknown column") || response.error.toLowerCase().includes("not found")
                        ? "The requested field does not exist in the logs schema. Click on any field name in the left sidebar to insert valid fields (e.g., timestamp, service, level, status, response_time, path, ip, message)."
                        : response.error.toLowerCase().includes("syntax") || response.error.toLowerCase().includes("unexpected")
                        ? "Verify that all columns are separated by commas, string literals are enclosed in quotes (e.g. 'auth-service'), clauses follow standard order (SELECT ... FROM ... WHERE ... GROUP BY ... ORDER BY ... LIMIT ...), and the statement ends with a semicolon."
                        : "Check the Grammar Cheatsheet in the left sidebar or the Documentation page for valid syntax examples and rules."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-ide-panel border border-ide-border rounded-xl flex flex-col flex-1 min-h-[300px] shadow-lg overflow-hidden">
              <div className="bg-ide-sidebar border-b border-ide-border px-3 flex items-center justify-between overflow-x-auto flex-shrink-0">
                <div className="flex items-center gap-0.5">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => switchActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition select-none ${
                          isActive
                            ? "border-[#577b9f] text-slate-100 bg-ide-panel font-semibold shadow-sm"
                            : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-ide-hover/50"
                        }`}
                      >
                        <span className={isActive ? tab.color : "text-slate-400"}>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                              isActive
                                ? "bg-[#1c2738] text-[#8ea8c9] border border-[#2e405a]"
                                : "bg-ide-surface text-slate-400 border border-ide-border"
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {response && response.success && response.results && (
                  <div className="hidden sm:flex items-center gap-2.5 text-xs font-mono text-slate-400 pr-2">
                    <span className="flex items-center gap-1 text-[#72b192] font-medium text-[11px]">
                      <CheckCircle2 size={12} /> Pipeline Success
                    </span>
                    <span>&bull;</span>
                    <span className="text-[11px]">{response.results.rows.length} rows</span>
                    <span>&bull;</span>
                    <span className="text-slate-300 font-semibold text-[11px]">{response.results.metrics?.executionTimeMs?.toFixed(3) || "0.200"} ms</span>
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-3.5 flex-1 min-h-0 overflow-y-auto bg-ide-panel/80">
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
