export interface TokenItem {
  token: string;
  lexeme: string;
  line: number;
  col: number;
}

export interface DiagnosticItem {
  severity: "ERROR" | "WARNING";
  message: string;
  line?: number;
  col?: number;
}

export interface OptimizationItem {
  rule: string;
  description: string;
  before: string;
  after: string;
}

export interface ExecutionMetrics {
  recordsScanned: number;
  recordsFiltered: number;
  recordsGrouped: number;
  recordsReturned: number;
  executionTimeMs: number;
}

export interface ResultsData {
  success: boolean;
  errorMessage?: string;
  columns: string[];
  rows: Record<string, any>[];
  metrics: ExecutionMetrics;
}

export interface CompilerResponse {
  success: boolean;
  stage?: string;
  error?: string;
  line?: number;
  col?: number;
  tokens?: TokenItem[];
  ast?: any;
  optimizedAst?: any;
  semantic?: {
    isValid: boolean;
    diagnostics: DiagnosticItem[];
  };
  optimizations?: OptimizationItem[];
  physicalPlan?: any;
  results?: ResultsData;
}

export interface DatasetInfo {
  id: string;
  name: string;
  format: string;
  recordCount: number;
  path: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchDatasets(): Promise<DatasetInfo[]> {
  try {
    const res = await fetch(`${API_BASE}/api/datasets`);
    if (!res.ok) throw new Error("Failed to fetch datasets");
    return await res.json();
  } catch (err) {
    console.error("fetchDatasets error:", err);
    return [
      { id: "app_events", name: "Microservice Application Logs", format: "JSON Lines (.jsonl)", recordCount: 1000, path: "" },
      { id: "web_access", name: "Nginx / Apache Web Access Logs", format: "Combined Log Format (CLF)", recordCount: 1000, path: "" },
      { id: "system", name: "Operating System Daemons", format: "Syslog (RFC 3164)", recordCount: 1000, path: "" }
    ];
  }
}

export async function compileQuery(query: string): Promise<CompilerResponse> {
  const res = await fetch(`${API_BASE}/api/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  return await res.json();
}

export async function executeQuery(query: string, datasetId: string): Promise<CompilerResponse> {
  const res = await fetch(`${API_BASE}/api/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, datasetId })
  });
  return await res.json();
}

export async function uploadDataset(file: File | null, rawText: string | null): Promise<any> {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  } else if (rawText) {
    formData.append("rawText", rawText);
  }
  const res = await fetch(`${API_BASE}/api/datasets/upload`, {
    method: "POST",
    body: formData
  });
  return await res.json();
}
