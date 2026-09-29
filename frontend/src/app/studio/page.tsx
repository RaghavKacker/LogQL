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
  CheckCircle2
} from "lucide-react";

export default function StudioPage() {
  const [query, setQuery] = useState(
    `SELECT service, COUNT(*)\nFROM logs\nWHERE status >= 500\nGROUP BY service\nORDER BY COUNT(*) DESC;`
  );
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDataset, setSelectedDataset] = useState("app_events");
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<"execute" | "compile" | null>(null);
  const [activeTab, setActiveTab] = useState<
    "results" | "tokens" | "ast" | "semantic" | "optimizer" | "plan" | "charts"
  >("results");
  const [response, setResponse] = useState<CompilerResponse | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

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

  const handleExecute = useCallback(async (queryText = query, datasetId = selectedDataset) => {
    if (!queryText.trim()) return;
    setLoading(true);
    setActionType("execute");
    try {
      const res = await executeQuery(queryText, datasetId);
      setResponse(res);
      if (res.results && res.results.rows) {
        setActiveTab("results");
      } else if (!res.success) {
        if (res.stage === "Parser" || res.stage === "Lexer") setActiveTab("tokens");
        else if (res.stage === "SemanticAnalysis") setActiveTab("semantic");
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
  }, [query, selectedDataset]);

  const handleCompile = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setActionType("compile");
    try {
      const res = await compileQuery(query);
      setResponse(res);
      if (res.success) {
        setActiveTab("ast");
      } else {
        if (res.stage === "Parser" || res.stage === "Lexer") setActiveTab("tokens");
        else if (res.stage === "SemanticAnalysis") setActiveTab("semantic");
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
  }, [query]);

  useEffect(() => {
    loadDatasets();
    handleExecute(
      `SELECT service, COUNT(*)\nFROM logs\nWHERE status >= 500\nGROUP BY service\nORDER BY COUNT(*) DESC;`,
      "app_events"
    );
  }, []);

  const handleInsertField = (fieldName: string) => {
    setQuery((prev) => {
      // Append field or insert intelligently
      if (prev.endsWith(" ") || prev.endsWith(",")) {
        return prev + fieldName;
      }
      return prev + ` ${fieldName}`;
    });
  };

  const handleSelectPreset = (presetQuery: string) => {
    setQuery(presetQuery);
    handleExecute(presetQuery, selectedDataset);
  };

  const tabs = [
    {
      id: "results",
      label: "Results",
      icon: <TableIcon size={13} />,
      badge: response?.results?.rows ? `${response.results.rows.length}` : null,
      color: "text-ide-text"
    },
    {
      id: "tokens",
      label: "Tokens",
      icon: <Code2 size={13} />,
      badge: response?.tokens ? `${response.tokens.length}` : null,
      color: "text-status-info"
    },
    {
      id: "ast",
      label: "AST IR",
      icon: <GitBranch size={13} />,
      badge: response?.ast ? "LALR(1)" : null,
      color: "text-indigo-400"
    },
    {
      id: "semantic",
      label: "Semantics",
      icon: <ShieldCheck size={13} />,
      badge: response?.semantic?.isValid ? "Pass" : response?.semantic ? "Error" : null,
      color: response?.semantic?.isValid ? "text-status-success" : "text-status-error"
    },
    {
      id: "optimizer",
      label: "Optimizer",
      icon: <Zap size={13} />,
      badge: response?.optimizations ? `${response.optimizations.length}` : null,
      color: "text-amber-400"
    },
    {
      id: "plan",
      label: "Physical Plan",
      icon: <Network size={13} />,
      badge: response?.physicalPlan ? "Volcano" : null,
      color: "text-purple-400"
    },
    {
      id: "charts",
      label: "Visual Charts",
      icon: <BarChart2 size={13} />,
      badge: null,
      color: "text-emerald-400"
    },
  ];

  const activeDatasetObj = datasets.find((d) => d.id === selectedDataset);

  return (
    <div className="min-h-screen bg-ide-bg text-ide-text flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="h-10 bg-ide-sidebar border-b border-ide-border px-3 flex items-center justify-between select-none text-xs flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Datasets & Schema Sidebar"
            className="p-1 hover:bg-ide-hover rounded text-ide-muted hover:text-ide-text transition"
          >
            {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
          </button>

          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono tracking-tight flex items-center gap-1.5">
              <span className="text-status-info font-black">&lt;/&gt;</span> LogQL
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-ide-panel text-ide-subtle border border-ide-border">
              Compiler Workbench
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-ide-border text-[11px] text-ide-muted">
            <span>Target:</span>
            <span className="font-mono text-white bg-ide-bg px-1.5 py-0.5 rounded border border-ide-border">
              {activeDatasetObj ? activeDatasetObj.name.split(" ")[0] : selectedDataset}
            </span>
            {activeDatasetObj && (
              <span className="text-ide-subtle text-[10px] font-mono">
                ({activeDatasetObj.recordCount} records &bull; {activeDatasetObj.format.toUpperCase()})
              </span>
            )}
          </div>
        </div>

        {/* Engine Pipeline Status Pills */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-ide-subtle bg-ide-panel px-2 py-0.5 rounded border border-ide-border">
            <Cpu size={12} className="text-status-info" />
            <span>Flex 2.6 &bull; Bison 3.8 &bull; GCC C++17</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1 text-[11px] text-ide-muted hover:text-white px-2 py-1 rounded hover:bg-ide-hover transition"
            >
              <BookOpen size={12} />
              <span>Specs & Architecture</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Studio Area (Sidebar + Workbench) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        {isSidebarOpen && (
          <Sidebar
            datasets={datasets}
            selectedDataset={selectedDataset}
            onSelectDataset={(id) => {
              setSelectedDataset(id);
              handleExecute(query, id);
            }}
            onOpenUpload={() => setIsUploadOpen(true)}
            onSelectPreset={handleSelectPreset}
            onInsertField={handleInsertField}
          />
        )}

        {/* Central Workbench */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="p-3 sm:p-4 space-y-3">
            {/* Query Editor Pane */}
            <QueryEditor
              query={query}
              setQuery={setQuery}
              onExecute={() => handleExecute()}
              onCompile={handleCompile}
              onClear={() => setQuery("")}
              loading={loading}
            />

            {/* Error Diagnostics Banner */}
            {response && !response.success && (
              <div className="bg-status-error/10 border border-status-error/40 rounded p-3 text-xs font-mono text-rose-300 flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-status-error mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="font-bold text-status-error uppercase tracking-wide flex items-center gap-2">
                    <span>Compilation Error [{response.stage || "Pipeline"}]</span>
                    {response.line ? (
                      <span className="text-[10px] font-normal text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800">
                        Line {response.line}:{response.col}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-ide-text leading-relaxed whitespace-pre-wrap">{response.error}</div>
                </div>
              </div>
            )}

            {/* Inspector Tabbed Container */}
            <div className="bg-ide-panel border border-ide-border rounded flex flex-col min-h-[480px]">
              {/* Tab Header Bar */}
              <div className="bg-ide-sidebar border-b border-ide-border px-2 flex items-center justify-between overflow-x-auto flex-shrink-0">
                <div className="flex items-center">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition select-none ${
                          isActive
                            ? "border-status-info text-white bg-ide-panel font-semibold"
                            : "border-transparent text-ide-muted hover:text-ide-text hover:bg-ide-hover/50"
                        }`}
                      >
                        <span className={isActive ? tab.color : "text-ide-subtle"}>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.badge && (
                          <span
                            className={`text-[10px] px-1 py-0.2 rounded ${
                              isActive
                                ? "bg-ide-bg text-status-info border border-ide-borderLight"
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

                {/* Right Tab Status Summary */}
                {response && response.success && response.results && (
                  <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-ide-subtle pr-2">
                    <span className="flex items-center gap-1 text-status-success">
                      <CheckCircle2 size={12} /> Ready
                    </span>
                    <span>{response.results.rows.length} rows</span>
                    <span>&bull;</span>
                    <span>{response.results.metrics?.executionTimeMs?.toFixed(2) || "0.20"}ms</span>
                  </div>
                )}
              </div>

              {/* Tab Viewport */}
              <div className="p-3 sm:p-4 flex-1">
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

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          loadDatasets();
        }}
      />
    </div>
  );
}
