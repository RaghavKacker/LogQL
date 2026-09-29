"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  compileQuery,
  executeQuery,
  fetchDatasets,
  CompilerResponse,
  DatasetInfo
} from "@/lib/api";
import { QueryEditor } from "@/components/QueryEditor";
import { DatasetSelector } from "@/components/DatasetSelector";
import { TokenViewer } from "@/components/TokenViewer";
import { AstViewer } from "@/components/AstViewer";
import { SemanticViewer } from "@/components/SemanticViewer";
import { OptimizerDiff } from "@/components/OptimizerDiff";
import { PlanViewer } from "@/components/PlanViewer";
import { ResultsTable } from "@/components/ResultsTable";
import { MetricsCharts } from "@/components/MetricsCharts";
import {
  Layers,
  Code2,
  GitBranch,
  ShieldCheck,
  Zap,
  Network,
  Table as TableIcon,
  BarChart2,
  AlertOctagon,
  ArrowLeft
} from "lucide-react";

export default function StudioPage() {
  const [query, setQuery] = useState(
    `SELECT service, COUNT(*)\nFROM logs\nWHERE status >= 500\nGROUP BY service\nORDER BY COUNT(*) DESC;`
  );
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDataset, setSelectedDataset] = useState("app_events");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "results" | "tokens" | "ast" | "semantic" | "optimizer" | "plan" | "charts"
  >("results");
  const [response, setResponse] = useState<CompilerResponse | null>(null);

  const loadDatasets = async () => {
    const list = await fetchDatasets();
    setDatasets(list);
    if (list.length > 0 && !selectedDataset) {
      setSelectedDataset(list[0].id);
    }
  };

  useEffect(() => {
    loadDatasets();
    // Auto execute default query on mount
    handleExecute(
      `SELECT service, COUNT(*)\nFROM logs\nWHERE status >= 500\nGROUP BY service\nORDER BY COUNT(*) DESC;`,
      "app_events"
    );
  }, []);

  const handleExecute = async (queryText = query, datasetId = selectedDataset) => {
    if (!queryText.trim()) return;
    setLoading(true);
    try {
      const res = await executeQuery(queryText, datasetId);
      setResponse(res);
      if (res.results && res.results.rows) {
        setActiveTab("results");
      } else if (!res.success) {
        if (res.stage === "Parser") setActiveTab("tokens");
        else if (res.stage === "SemanticAnalysis") setActiveTab("semantic");
      }
    } catch (err: any) {
      console.error(err);
      setResponse({
        success: false,
        stage: "Network",
        error: "Failed to connect to the LogQL compiler backend."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompile = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await compileQuery(query);
      setResponse(res);
      if (res.success) {
        setActiveTab("ast");
      } else {
        if (res.stage === "Parser") setActiveTab("tokens");
        else if (res.stage === "SemanticAnalysis") setActiveTab("semantic");
      }
    } catch (err: any) {
      console.error(err);
      setResponse({
        success: false,
        stage: "Network",
        error: "Failed to connect to the LogQL compiler backend."
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "results", label: "Query Results", icon: <TableIcon size={14} />, badge: response?.results?.rows ? `${response.results.rows.length}` : null },
    { id: "tokens", label: "Lexer Tokens", icon: <Code2 size={14} />, badge: response?.tokens ? `${response.tokens.length}` : null },
    { id: "ast", label: "Parser AST", icon: <GitBranch size={14} />, badge: response?.ast ? "LALR(1)" : null },
    { id: "semantic", label: "Semantic Diagnostics", icon: <ShieldCheck size={14} />, badge: response?.semantic?.isValid ? "Valid" : response?.semantic ? "Error" : null },
    { id: "optimizer", label: "Optimizer Passes", icon: <Zap size={14} />, badge: response?.optimizations ? `${response.optimizations.length} Passes` : null },
    { id: "plan", label: "Physical Plan", icon: <Network size={14} />, badge: response?.physicalPlan ? "Volcano" : null },
    { id: "charts", label: "Analytics Charts", icon: <BarChart2 size={14} />, badge: null },
  ];

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-dark-border bg-dark-panel/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-xs font-semibold transition"
          >
            <ArrowLeft size={16} /> Overview
          </Link>
          <div className="h-4 w-px bg-dark-border" />
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-gradient-to-tr from-brand-indigo to-brand-cyan text-white shadow-md">
              <Layers size={18} />
            </span>
            <span className="font-mono text-base font-bold tracking-tight text-white">
              LogQL <span className="text-brand-cyan font-normal text-xs uppercase tracking-widest ml-1">Studio</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 hidden sm:inline">
            Flex + Bison + C++17 Core Engine
          </span>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-md flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Local Native Engine
          </span>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Dataset Bar */}
        <DatasetSelector
          datasets={datasets}
          selectedDataset={selectedDataset}
          onSelectDataset={(id) => {
            setSelectedDataset(id);
            handleExecute(query, id);
          }}
          onDatasetUploaded={loadDatasets}
        />

        {/* Query Editor */}
        <QueryEditor
          query={query}
          setQuery={setQuery}
          onExecute={() => handleExecute()}
          onCompile={handleCompile}
          onClear={() => setQuery("")}
          loading={loading}
        />

        {/* Global Error Alert Banner */}
        {response && !response.success && (
          <div className="bg-rose-950/70 border border-rose-800 rounded-xl p-4 text-xs font-mono text-rose-200 flex items-start gap-3 shadow-lg">
            <AlertOctagon size={18} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="font-bold text-rose-300 uppercase tracking-wide">
                Compiler Failure in [{response.stage || "Pipeline"}] Stage
                {response.line ? ` at Line ${response.line}:${response.col}` : ""}
              </div>
              <div>{response.error || "The query could not be compiled or executed."}</div>
            </div>
          </div>
        )}

        {/* Multi-Tab Inspection Panel */}
        <div className="bg-dark-panel border border-dark-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
          {/* Tab Navigation Bar */}
          <div className="bg-dark-input/80 border-b border-dark-border px-3 pt-2 flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-t-2 ${
                  activeTab === tab.id
                    ? "bg-dark-panel text-white border-brand-cyan shadow-sm"
                    : "text-gray-400 hover:text-gray-200 border-transparent hover:bg-dark-bg/50"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60" : "bg-dark-bg text-gray-500"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content Container */}
          <div className="p-4 sm:p-6 min-h-[420px]">
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
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border py-4 text-center text-xs text-gray-500 font-mono">
        LogQL — A Compiler-Based Log Query and Optimization System &bull; B.Tech Computer Science Compiler Design Project
      </footer>
    </div>
  );
}
