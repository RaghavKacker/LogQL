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
  Sparkles
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
  { name: "timestamp", type: "STRING", sample: '"2026-10-14T10:15:30Z"', desc: "ISO-8601 event timestamp", color: "text-[#7fa1c4] bg-[#1a2333] border-[#2c3d59]" },
  { name: "service", type: "STRING", sample: '"auth-service"', desc: "Originating service name", color: "text-[#7fa1c4] bg-[#1a2333] border-[#2c3d59]" },
  { name: "level", type: "STRING", sample: '"INFO", "ERROR"', desc: "Severity level", color: "text-[#cfa058] bg-[#251f16] border-[#423625]" },
  { name: "status", type: "INTEGER", sample: "200, 500", desc: "HTTP status code", color: "text-[#72b192] bg-[#182620] border-[#294237]" },
  { name: "response_time", type: "FLOAT", sample: "42.5", desc: "Latency duration in ms", color: "text-[#9b8cb8] bg-[#221c2c] border-[#3b304c]" },
  { name: "path", type: "STRING", sample: '"/api/v1/login"', desc: "Request endpoint path", color: "text-[#7fa1c4] bg-[#1a2333] border-[#2c3d59]" },
  { name: "ip", type: "STRING", sample: '"192.168.1.10"', desc: "Client IPv4 address", color: "text-[#7fa1c4] bg-[#1a2333] border-[#2c3d59]" },
  { name: "message", type: "STRING", sample: '"Request processed"', desc: "Event message text payload", color: "text-slate-300 bg-slate-800/60 border-slate-700" },
];

const PRESET_QUERIES = [
  {
    name: "5xx Server Errors by Service",
    tag: "Aggregation",
    desc: "COUNT(*) + GROUP BY + ORDER BY",
    query: `SELECT service, COUNT(*)\nFROM logs\nWHERE status >= 500\nGROUP BY service\nORDER BY COUNT(*) DESC;`
  },
  {
    name: "High Latency Requests",
    tag: "Filter & Sort",
    desc: "response_time > 200ms + LIMIT 15",
    query: `SELECT timestamp, service, path, response_time\nFROM logs\nWHERE response_time > 200.0\nORDER BY response_time DESC\nLIMIT 15;`
  },
  {
    name: "Optimizer Pass Demonstration",
    tag: "Optimization",
    desc: "Constant Folding & Deduplication",
    query: `SELECT path, AVG(response_time)\nFROM logs\nWHERE status = 200 + 300 AND status >= 500\nGROUP BY path\nORDER BY AVG(response_time) DESC;`
  },
  {
    name: "Full Log Scan (Wildcard)",
    tag: "Scan",
    desc: "SELECT * wildcard sample",
    query: `SELECT *\nFROM logs\nLIMIT 10;`
  },
  {
    name: "Semantic Validation Error",
    tag: "Diagnostics",
    desc: "Queries non-existent column to test error handling",
    query: `SELECT non_existent_column\nFROM logs;`
  },
  {
    name: "Group By Invariant Check",
    tag: "Diagnostics",
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

  const getCleanDatasetTitle = (d: DatasetInfo) => {
    if (d.id === "app_events") return "Microservice Logs";
    if (d.id === "web_access") return "Nginx Web Access";
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

  return (
    <aside className="w-64 lg:w-72 bg-ide-sidebar border-r border-ide-border flex flex-col h-full select-none text-xs flex-shrink-0">
      <div className="p-2.5 sm:p-3 border-b border-ide-border flex items-center justify-between bg-ide-sidebar">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-[#7fa1c4]" />
          <span className="font-semibold text-slate-200 tracking-wider uppercase text-[11px]">
            Target Datasets
          </span>
        </div>
        <button
          onClick={onOpenUpload}
          title="Upload custom log dataset (.log, .jsonl)"
          className="flex items-center gap-1 px-2 py-0.5 bg-ide-surface hover:bg-ide-hover border border-ide-border rounded text-[11px] text-slate-300 hover:text-white transition shadow-sm"
        >
          <Upload size={11} className="text-[#7fa1c4]" />
          <span>Upload</span>
        </button>
      </div>

      <div className="p-2 space-y-1 border-b border-ide-border bg-ide-sidebar/50">
        {datasets.map((d) => {
          const isSelected = d.id === selectedDataset;
          return (
            <button
              key={d.id}
              onClick={() => onSelectDataset(d.id)}
              className={`w-full text-left p-2.5 rounded-md transition-all border ${
                isSelected
                  ? "bg-[#182333] border-[#3d5375] shadow-sm"
                  : "bg-ide-panel/60 border-ide-border hover:bg-ide-surface/80 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`font-medium text-xs truncate ${isSelected ? "text-[#8ea8c9] font-semibold" : "text-slate-200"}`}>
                  {getCleanDatasetTitle(d)}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ide-bg text-slate-400 border border-ide-border flex-shrink-0">
                  {d.recordCount.toLocaleString()} rows
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono font-medium">
                  {getFormatBadge(d.format)}
                </span>
                <span className="truncate text-slate-400 font-mono">
                  {d.path.split(/[/\\]/).pop()}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-ide-border">
        <div>
          <button
            onClick={() => setSchemaOpen(!schemaOpen)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-300 hover:text-white uppercase tracking-wider font-semibold text-[11px] bg-ide-sidebar hover:bg-ide-hover/50 transition"
          >
            <span className="flex items-center gap-2">
              <Table size={13} className="text-[#72b192]" /> Log Schema Fields ({SCHEMA_FIELDS.length})
            </span>
            {schemaOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {schemaOpen && (
            <div className="px-2.5 pb-2.5 space-y-1">
              <div className="text-[10px] text-slate-400 px-1.5 py-0.5 italic">
                Click any field to insert into query:
              </div>
              {SCHEMA_FIELDS.map((f) => (
                <div
                  key={f.name}
                  onClick={() => onInsertField(f.name)}
                  title={`Insert '${f.name}'\nType: ${f.type}\nSample: ${f.sample}\n${f.desc}`}
                  className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-ide-surface cursor-pointer border border-transparent hover:border-ide-border transition"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-xs text-slate-200 group-hover:text-[#7fa1c4] flex items-center gap-1.5">
                      <Plus size={11} className="opacity-0 group-hover:opacity-100 text-[#7fa1c4] transition-opacity flex-shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate pl-4">
                      {f.sample}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold flex-shrink-0 ${f.color}`}>
                    {f.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setPresetsOpen(!presetsOpen)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-300 hover:text-white uppercase tracking-wider font-semibold text-[11px] bg-ide-sidebar hover:bg-ide-hover/50 transition"
          >
            <span className="flex items-center gap-2">
              <FileCode size={13} className="text-[#9b8cb8]" /> Query Templates ({PRESET_QUERIES.length})
            </span>
            {presetsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {presetsOpen && (
            <div className="px-2.5 pb-2.5 space-y-1.5">
              <div className="relative mb-2">
                <Search size={11} className="absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter templates..."
                  value={presetFilter}
                  onChange={(e) => setPresetFilter(e.target.value)}
                  className="w-full bg-ide-bg border border-ide-border rounded pl-6 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#4f6b94]"
                />
              </div>

              {filteredPresets.map((p, i) => (
                <div
                  key={i}
                  className="w-full text-left p-2 rounded-md bg-ide-panel/50 hover:bg-ide-surface border border-ide-border hover:border-slate-700 transition group space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-medium text-xs text-slate-200 group-hover:text-[#7fa1c4] truncate">
                      {p.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 flex-shrink-0">
                      {p.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {p.desc}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => onSelectPreset(p.query)}
                      title="Run query immediately"
                      className="flex-1 py-1 px-2 rounded bg-[#1f2b3c] hover:bg-[#28384f] border border-[#394e6d] text-slate-200 hover:text-white text-[10px] font-medium flex items-center justify-center gap-1 transition shadow-sm"
                    >
                      <Play size={10} fill="currentColor" /> Run Now
                    </button>
                    <button
                      onClick={() => onLoadPreset ? onLoadPreset(p.query) : onSelectPreset(p.query)}
                      title="Load into editor without running"
                      className="py-1 px-2 rounded bg-ide-bg hover:bg-ide-panel border border-ide-border text-slate-300 hover:text-white text-[10px] font-medium flex items-center justify-center gap-1 transition"
                    >
                      <Edit3 size={10} /> Load
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setGrammarOpen(!grammarOpen)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-300 hover:text-white uppercase tracking-wider font-semibold text-[11px] bg-ide-sidebar hover:bg-ide-hover/50 transition"
          >
            <span className="flex items-center gap-2">
              <HelpCircle size={13} className="text-[#cfa058]" /> Grammar Cheatsheet
            </span>
            {grammarOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {grammarOpen && (
            <div className="p-3 text-xs font-mono text-slate-300 space-y-2 bg-ide-bg/80 border-t border-ide-border">
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
              <div className="pt-2 text-slate-400 text-[10px] border-t border-ide-border">
                Supported Aggregates: <strong className="text-token-func">COUNT, AVG, SUM, MIN, MAX</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-ide-border text-[11px] font-mono text-slate-400 flex items-center justify-between bg-ide-sidebar">
        <span>Compiler Design Mini Project</span>
        <span className="text-slate-400">B.Tech CS</span>
      </div>
    </aside>
  );
};
