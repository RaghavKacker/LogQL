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
  Plus
} from "lucide-react";

interface SidebarProps {
  datasets: DatasetInfo[];
  selectedDataset: string;
  onSelectDataset: (id: string) => void;
  onOpenUpload: () => void;
  onSelectPreset: (query: string) => void;
  onInsertField: (field: string) => void;
}

const SCHEMA_FIELDS = [
  { name: "timestamp", type: "STRING", desc: "ISO-8601 event timestamp" },
  { name: "service", type: "STRING", desc: "Originating service name" },
  { name: "level", type: "STRING", desc: "INFO | WARN | ERROR | FATAL" },
  { name: "status", type: "INTEGER", desc: "HTTP status code (e.g. 200, 500)" },
  { name: "response_time", type: "FLOAT", desc: "Latency duration in ms" },
  { name: "path", type: "STRING", desc: "Request URI / endpoint path" },
  { name: "ip", type: "STRING", desc: "Client IPv4 address" },
  { name: "message", type: "STRING", desc: "Event message payload" },
];

const PRESET_QUERIES = [
  {
    name: "5xx Errors by Service",
    desc: "Aggregation + GroupBy + OrderBy",
    query: `SELECT service, COUNT(*)\nFROM logs\nWHERE status >= 500\nGROUP BY service\nORDER BY COUNT(*) DESC;`
  },
  {
    name: "High Latency Requests",
    desc: "Latency > 200ms + Limit",
    query: `SELECT timestamp, service, path, response_time\nFROM logs\nWHERE response_time > 200.0\nORDER BY response_time DESC\nLIMIT 15;`
  },
  {
    name: "Optimizer Pass Demo",
    desc: "Constant folding & deduplication",
    query: `SELECT path, AVG(response_time)\nFROM logs\nWHERE status = 200 + 300 AND status >= 500\nGROUP BY path\nORDER BY AVG(response_time) DESC;`
  },
  {
    name: "Full Schema Scan",
    desc: "SELECT * wildcard",
    query: `SELECT *\nFROM logs\nLIMIT 10;`
  },
  {
    name: "Semantic Error Check",
    desc: "Unknown schema attribute",
    query: `SELECT non_existent_column\nFROM logs;`
  },
  {
    name: "Group By Invariant Check",
    desc: "Ungrouped scalar column error",
    query: `SELECT service, path, COUNT(*)\nFROM logs\nGROUP BY service;`
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  onOpenUpload,
  onSelectPreset,
  onInsertField
}) => {
  const [schemaOpen, setSchemaOpen] = useState(true);
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [grammarOpen, setGrammarOpen] = useState(false);

  return (
    <aside className="w-64 bg-ide-sidebar border-r border-ide-border flex flex-col h-full select-none text-xs">
      {/* Top Header */}
      <div className="p-3 border-b border-ide-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-ide-subtle" />
          <span className="font-semibold text-ide-text tracking-wide uppercase text-[11px]">Datasets</span>
        </div>
        <button
          onClick={onOpenUpload}
          title="Upload or paste custom log file"
          className="p-1 hover:bg-ide-hover rounded text-ide-muted hover:text-ide-text transition"
        >
          <Upload size={13} />
        </button>
      </div>

      {/* Dataset List */}
      <div className="p-2 space-y-1 border-b border-ide-border">
        {datasets.map((d) => {
          const isSelected = d.id === selectedDataset;
          return (
            <button
              key={d.id}
              onClick={() => onSelectDataset(d.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition ${
                isSelected
                  ? "bg-ide-active text-white font-medium border border-ide-borderLight"
                  : "text-ide-muted hover:bg-ide-hover hover:text-ide-text"
              }`}
            >
              <div className="truncate font-mono text-[11px]">
                {d.name.split(" ")[0]}
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-ide-panel text-ide-subtle">
                {d.recordCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Explorer Sections */}
      <div className="flex-1 overflow-y-auto divide-y divide-ide-border">
        {/* Schema Attributes */}
        <div>
          <button
            onClick={() => setSchemaOpen(!schemaOpen)}
            className="w-full px-3 py-2 flex items-center justify-between text-ide-muted hover:text-ide-text uppercase tracking-wider font-semibold text-[10px]"
          >
            <span className="flex items-center gap-1.5">
              <Table size={12} /> Log Schema Fields ({SCHEMA_FIELDS.length})
            </span>
            {schemaOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {schemaOpen && (
            <div className="px-2 pb-2 space-y-0.5">
              {SCHEMA_FIELDS.map((f) => (
                <div
                  key={f.name}
                  onClick={() => onInsertField(f.name)}
                  title={`Click to insert '${f.name}' into query\n${f.desc}`}
                  className="group flex items-center justify-between px-2 py-1 rounded hover:bg-ide-hover cursor-pointer text-ide-text transition"
                >
                  <span className="font-mono text-[11px] group-hover:text-status-info flex items-center gap-1">
                    <Plus size={10} className="opacity-0 group-hover:opacity-100 text-status-info" />
                    {f.name}
                  </span>
                  <span className="text-[9px] font-mono px-1 rounded bg-ide-panel text-ide-subtle">
                    {f.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Query Presets */}
        <div>
          <button
            onClick={() => setPresetsOpen(!presetsOpen)}
            className="w-full px-3 py-2 flex items-center justify-between text-ide-muted hover:text-ide-text uppercase tracking-wider font-semibold text-[10px]"
          >
            <span className="flex items-center gap-1.5">
              <FileCode size={12} /> Query Templates
            </span>
            {presetsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {presetsOpen && (
            <div className="px-2 pb-2 space-y-1">
              {PRESET_QUERIES.map((p, i) => (
                <button
                  key={i}
                  onClick={() => onSelectPreset(p.query)}
                  className="w-full text-left p-1.5 rounded hover:bg-ide-hover text-ide-muted hover:text-ide-text transition group"
                >
                  <div className="font-medium text-[11px] text-ide-text group-hover:text-status-info truncate">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-ide-subtle truncate">
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grammar Reference */}
        <div>
          <button
            onClick={() => setGrammarOpen(!grammarOpen)}
            className="w-full px-3 py-2 flex items-center justify-between text-ide-muted hover:text-ide-text uppercase tracking-wider font-semibold text-[10px]"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle size={12} /> Grammar Cheatsheet
            </span>
            {grammarOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {grammarOpen && (
            <div className="p-3 text-[10px] font-mono text-ide-muted space-y-2 bg-ide-bg/50">
              <div>
                <span className="text-token-keyword">SELECT</span> col, <span className="text-token-func">COUNT</span>(*)
              </div>
              <div>
                <span className="text-token-keyword">FROM</span> logs
              </div>
              <div>
                <span className="text-token-keyword">WHERE</span> status &gt;= <span className="text-token-number">500</span>
              </div>
              <div>
                <span className="text-token-keyword">GROUP BY</span> col
              </div>
              <div>
                <span className="text-token-keyword">ORDER BY</span> expr [<span className="text-token-keyword">ASC</span>|<span className="text-token-keyword">DESC</span>]
              </div>
              <div>
                <span className="text-token-keyword">LIMIT</span> n;
              </div>
              <div className="pt-1 text-ide-subtle text-[9px] border-t border-ide-border">
                Aggregates: COUNT, AVG, SUM, MIN, MAX
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-2.5 border-t border-ide-border text-[10px] font-mono text-ide-subtle flex items-center justify-between">
        <span>B.Tech Compiler Project</span>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
};
