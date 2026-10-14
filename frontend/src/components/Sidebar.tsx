import React, { useState } from "react";
import { DatasetInfo } from "@/lib/api";
import {
  Database,
  Table,
  FileCode,
  HelpCircle,
  Upload,
  ChevronDown,
  ChevronRight,
  Plus,
  Play,
  Edit3,
  Search,
  Check
} from "lucide-react";

interface SidebarProps {
  datasets: DatasetInfo[];
  selectedDataset: string;
  onSelectDataset: (id: string) => void;
  onOpenUpload: () => void;
  onSelectPreset: (query: string) => void;
  onLoadPreset?: (query: string) => void;
  onInsertField: (field: string) => void;
}

const SCHEMA_FIELDS = [
  { name: "timestamp", type: "STRING", sample: '"2026-10-14T10:15:30Z"', desc: "ISO-8601 event timestamp" },
  { name: "service", type: "STRING", sample: '"auth-service"', desc: "Originating service or process" },
  { name: "level", type: "STRING", sample: '"INFO", "ERROR"', desc: "Severity level (DEBUG, INFO, WARN, ERROR)" },
  { name: "status", type: "INTEGER", sample: "200, 404, 500", desc: "HTTP status or exit code" },
  { name: "response_time", type: "FLOAT", sample: "42.5", desc: "Request duration in milliseconds" },
  { name: "path", type: "STRING", sample: '"/api/v1/login"', desc: "Requested URL endpoint" },
  { name: "ip", type: "STRING", sample: '"192.168.1.10"', desc: "Client IPv4 address" },
  { name: "message", type: "STRING", sample: '"Connection timeout"', desc: "Descriptive event log message" },
];

const PRESET_QUERIES = [
  {
    name: "5xx Server Errors by Service",
    tag: "Aggregation",
    desc: "Count server errors grouped by microservice",
    query: `SELECT service, COUNT(*)\nFROM logs\nWHERE status >= 500\nGROUP BY service\nORDER BY COUNT(*) DESC;`
  },
  {
    name: "Slow Requests (>200ms)",
    tag: "Filter & Sort",
    desc: "Inspect top 15 highest latency requests",
    query: `SELECT timestamp, service, path, response_time\nFROM logs\nWHERE response_time > 200.0\nORDER BY response_time DESC\nLIMIT 15;`
  },
  {
    name: "Optimizer Pass Demo",
    tag: "Compiler",
    desc: "Demonstrates constant folding (200+300) & duplicate filter removal",
    query: `SELECT path, AVG(response_time)\nFROM logs\nWHERE status = 200 + 300 AND status >= 500\nGROUP BY path\nORDER BY AVG(response_time) DESC;`
  },
  {
    name: "Scan All Logs",
    tag: "Scan",
    desc: "Wildcard projection over recent 10 records",
    query: `SELECT *\nFROM logs\nLIMIT 10;`
  },
  {
    name: "Semantic Error Demo",
    tag: "Diagnostic",
    desc: "Queries a non-existent column to test schema validation",
    query: `SELECT non_existent_column\nFROM logs;`
  },
  {
    name: "Group By Invariant Demo",
    tag: "Diagnostic",
    desc: "Ungrouped scalar column in aggregate query",
    query: `SELECT service, path, COUNT(*)\nFROM logs\nGROUP BY service;`
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  onOpenUpload,
  onSelectPreset,
  onLoadPreset,
  onInsertField
}) => {
  const [schemaOpen, setSchemaOpen] = useState(true);
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [grammarOpen, setGrammarOpen] = useState(false);
  const [presetFilter, setPresetFilter] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const getCleanDatasetTitle = (d: DatasetInfo) => {
    if (d.id === "app_events") return "Microservice Logs";
    if (d.id === "web_access") return "Web Access Logs";
    if (d.id === "system") return "System Daemons";
    return d.name;
  };

  const getFormatBadge = (format: string) => {
    if (format.includes("JSON")) return "JSONL";
    if (format.includes("CLF") || format.includes("Combined")) return "CLF";
    if (format.includes("Syslog") || format.includes("3164")) return "Syslog";
    return "LOG";
  };

  const filteredPresets = PRESET_QUERIES.filter(
    (p) =>
      p.name.toLowerCase().includes(presetFilter.toLowerCase()) ||
      p.tag.toLowerCase().includes(presetFilter.toLowerCase()) ||
      p.desc.toLowerCase().includes(presetFilter.toLowerCase())
  );

  const handleFieldClick = (name: string) => {
    onInsertField(name);
    setCopiedField(name);
    setTimeout(() => setCopiedField(null), 1000);
  };

  return (
    <aside className="w-64 lg:w-72 bg-ide-sidebar border-r border-ide-border flex flex-col h-full select-none text-xs flex-shrink-0">
      {/* Header: Datasets */}
      <div className="p-3 border-b border-ide-border flex items-center justify-between bg-ide-sidebar">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-ide-muted" />
          <span className="font-semibold text-ide-text tracking-wide uppercase text-[11px]">
            Target Dataset
          </span>
        </div>
        <button
          onClick={onOpenUpload}
          title="Upload custom log dataset (.log, .jsonl, .txt)"
          className="flex items-center gap-1.5 px-2 py-1 bg-ide-surface hover:bg-ide-hover border border-ide-border rounded text-[11px] text-ide-text transition shadow-sm"
        >
          <Upload size={11} className="text-ide-muted" />
          <span>Upload</span>
        </button>
      </div>

      {/* Dataset List */}
      <div className="p-2 space-y-1.5 border-b border-ide-border bg-ide-bg/40">
        {datasets.map((d) => {
          const isSelected = d.id === selectedDataset;
          return (
            <button
              key={d.id}
              onClick={() => onSelectDataset(d.id)}
              className={`w-full text-left p-2.5 rounded-md transition border ${
                isSelected
                  ? "bg-ide-surface border-ide-borderLight text-ide-text shadow-sm"
                  : "bg-transparent border-transparent hover:bg-ide-surface/60 hover:border-ide-border text-ide-muted"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-xs truncate ${isSelected ? "text-ide-text font-semibold" : "text-slate-300"}`}>
                  {getCleanDatasetTitle(d)}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-ide-bg text-ide-muted border border-ide-border flex-shrink-0">
                  {d.recordCount.toLocaleString()} rows
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-ide-subtle">
                <span className="px-1.5 py-0.2 rounded bg-ide-surface text-slate-300 font-mono font-medium border border-ide-border">
                  {getFormatBadge(d.format)}
                </span>
                <span className="truncate font-mono">
                  {d.path ? d.path.split(/[/\\]/).pop() : d.format}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Scrollable middle section: Schema & Sample Queries */}
      <div className="flex-1 overflow-y-auto divide-y divide-ide-border">
        {/* Schema Fields Section */}
        <div>
          <button
            onClick={() => setSchemaOpen(!schemaOpen)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-300 hover:text-white uppercase tracking-wider font-semibold text-[11px] bg-ide-sidebar hover:bg-ide-hover/50 transition"
          >
            <span className="flex items-center gap-2">
              <Table size={13} className="text-ide-muted" /> Schema Fields ({SCHEMA_FIELDS.length})
            </span>
            {schemaOpen ? <ChevronDown size={14} className="text-ide-subtle" /> : <ChevronRight size={14} className="text-ide-subtle" />}
          </button>

          {schemaOpen && (
            <div className="px-2.5 pb-2.5 space-y-1">
              <div className="text-[10px] text-ide-subtle px-1.5 py-0.5">
                Click any field to insert into query:
              </div>
              {SCHEMA_FIELDS.map((f) => (
                <div
                  key={f.name}
                  onClick={() => handleFieldClick(f.name)}
                  title={`Insert '${f.name}'\nType: ${f.type}\nSample: ${f.sample}\n${f.desc}`}
                  className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-ide-surface cursor-pointer border border-transparent hover:border-ide-border transition"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-xs text-slate-200 group-hover:text-white flex items-center gap-1.5">
                      {copiedField === f.name ? (
                        <Check size={11} className="text-status-success flex-shrink-0" />
                      ) : (
                        <Plus size={11} className="opacity-0 group-hover:opacity-100 text-ide-muted transition-opacity flex-shrink-0" />
                      )}
                      <span className="truncate">{f.name}</span>
                    </span>
                    <span className="text-[10px] text-ide-subtle font-mono truncate pl-4">
                      {f.sample}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-ide-bg text-ide-muted border border-ide-border font-medium flex-shrink-0">
                    {f.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sample Queries Section */}
        <div>
          <button
            onClick={() => setPresetsOpen(!presetsOpen)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-300 hover:text-white uppercase tracking-wider font-semibold text-[11px] bg-ide-sidebar hover:bg-ide-hover/50 transition"
          >
            <span className="flex items-center gap-2">
              <FileCode size={13} className="text-ide-muted" /> Sample Queries ({PRESET_QUERIES.length})
            </span>
            {presetsOpen ? <ChevronDown size={14} className="text-ide-subtle" /> : <ChevronRight size={14} className="text-ide-subtle" />}
          </button>

          {presetsOpen && (
            <div className="px-2.5 pb-2.5 space-y-1.5">
              <div className="relative mb-2">
                <Search size={11} className="absolute left-2.5 top-2.5 text-ide-subtle" />
                <input
                  type="text"
                  placeholder="Filter queries..."
                  value={presetFilter}
                  onChange={(e) => setPresetFilter(e.target.value)}
                  className="w-full bg-ide-bg border border-ide-border rounded pl-6 pr-2 py-1 text-[11px] text-ide-text placeholder-ide-subtle focus:outline-none focus:border-ide-borderLight font-mono"
                />
              </div>

              {filteredPresets.map((p, i) => (
                <div
                  key={i}
                  className="w-full text-left p-2.5 rounded-md bg-ide-bg/60 hover:bg-ide-surface border border-ide-border transition group space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-medium text-xs text-slate-200 group-hover:text-white truncate">
                      {p.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-ide-panel text-ide-muted border border-ide-border flex-shrink-0">
                      {p.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-ide-subtle truncate">
                    {p.desc}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => onSelectPreset(p.query)}
                      title="Run this query immediately"
                      className="flex-1 py-1 px-2 rounded bg-ide-surface hover:bg-ide-hover border border-ide-border text-slate-200 hover:text-white text-[10px] font-medium flex items-center justify-center gap-1 transition shadow-sm"
                    >
                      <Play size={10} className="text-status-success" fill="currentColor" />
                      <span>Run Now</span>
                    </button>
                    <button
                      onClick={() => onLoadPreset ? onLoadPreset(p.query) : onSelectPreset(p.query)}
                      title="Load into editor without running"
                      className="py-1 px-2 rounded bg-ide-bg hover:bg-ide-surface border border-ide-border text-ide-muted hover:text-white text-[10px] font-medium flex items-center justify-center gap-1 transition"
                    >
                      <Edit3 size={10} />
                      <span>Load</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grammar Cheatsheet Section */}
        <div>
          <button
            onClick={() => setGrammarOpen(!grammarOpen)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-300 hover:text-white uppercase tracking-wider font-semibold text-[11px] bg-ide-sidebar hover:bg-ide-hover/50 transition"
          >
            <span className="flex items-center gap-2">
              <HelpCircle size={13} className="text-ide-muted" /> Syntax Cheatsheet
            </span>
            {grammarOpen ? <ChevronDown size={14} className="text-ide-subtle" /> : <ChevronRight size={14} className="text-ide-subtle" />}
          </button>

          {grammarOpen && (
            <div className="p-3 text-xs font-mono text-slate-300 space-y-1.5 bg-ide-bg/80 border-t border-ide-border">
              <div>
                <span className="text-token-keyword font-semibold">SELECT</span> col, <span className="text-token-func font-semibold">COUNT</span>(*)
              </div>
              <div>
                <span className="text-token-keyword font-semibold">FROM</span> logs
              </div>
              <div>
                <span className="text-token-keyword font-semibold">WHERE</span> status &gt;= <span className="text-token-number">500</span>
              </div>
              <div>
                <span className="text-token-keyword font-semibold">GROUP BY</span> col
              </div>
              <div>
                <span className="text-token-keyword font-semibold">ORDER BY</span> expr [<span className="text-token-keyword">ASC</span>|<span className="text-token-keyword">DESC</span>]
              </div>
              <div>
                <span className="text-token-keyword font-semibold">LIMIT</span> n;
              </div>
              <div className="pt-2 text-ide-subtle text-[10px] border-t border-ide-border">
                Aggregates: <strong className="text-slate-300">COUNT, AVG, SUM, MIN, MAX</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-ide-border text-[11px] font-mono text-ide-subtle flex items-center justify-between bg-ide-sidebar">
        <span>Compiler Design Mini Project</span>
        <span className="text-ide-muted">B.Tech CS</span>
      </div>
    </aside>
  );
};
