import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { ResultsData } from "@/lib/api";

interface MetricsChartsProps {
  results?: ResultsData;
}

const PALETTE = ["#38bdf8", "#818cf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];

export const MetricsCharts: React.FC<MetricsChartsProps> = ({ results }) => {
  if (!results || !results.rows || results.rows.length === 0) {
    return (
      <div className="p-12 text-center text-ide-subtle font-mono text-xs border border-dashed border-ide-border rounded">
        No dataset rows to chart. Execute a query that returns rows to visualize distributions.
      </div>
    );
  }

  const { rows, columns } = results;

  // 1. Group by status if present
  const statusCounts: Record<string, number> = {};
  // 2. Service counts if present
  const serviceCounts: Record<string, number> = {};
  // 3. Numeric response time distribution
  const latencyBuckets: { range: string; count: number }[] = [
    { range: "< 50ms", count: 0 },
    { range: "50-200ms", count: 0 },
    { range: "200-500ms", count: 0 },
    { range: "> 500ms", count: 0 }
  ];

  let hasNumericMetric = false;

  rows.forEach((r) => {
    if (r.status !== undefined) {
      const code = String(r.status);
      statusCounts[code] = (statusCounts[code] || 0) + 1;
    }

    if (r.service !== undefined) {
      const svc = String(r.service);
      serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
    }

    if (r.response_time !== undefined && typeof r.response_time === "number") {
      hasNumericMetric = true;
      const rt = r.response_time;
      if (rt < 50) latencyBuckets[0].count++;
      else if (rt <= 200) latencyBuckets[1].count++;
      else if (rt <= 500) latencyBuckets[2].count++;
      else latencyBuckets[3].count++;
    }
  });

  const statusData = Object.keys(statusCounts).map((k) => ({
    name: `HTTP ${k}`,
    count: statusCounts[k]
  }));

  const serviceData = Object.keys(serviceCounts).map((k) => ({
    name: k,
    count: serviceCounts[k]
  }));

  // If aggregated result (e.g. SELECT service, COUNT(*)), plot that directly!
  const hasAggCount = columns.some((c) =>
    c.toUpperCase().includes("COUNT") || c.toUpperCase().includes("AVG") || c.toUpperCase().includes("SUM")
  );
  let genericAggData: any[] = [];
  if (hasAggCount && rows.length > 0) {
    const labelCol = columns[0];
    const valCol = columns[1] || columns[0];
    genericAggData = rows.slice(0, 10).map((r) => ({
      name: String(r[labelCol]),
      value: typeof r[valCol] === "number" ? r[valCol] : 1
    }));
  }

  const customTooltipStyle = {
    backgroundColor: "#10131c",
    borderColor: "#232b3e",
    borderRadius: "4px",
    fontSize: "11px",
    fontFamily: "monospace",
    color: "#e2e8f0"
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ide-border pb-3 text-ide-muted text-[11px]">
        <div className="flex items-center gap-2">
          <span>Visual Distribution:</span>
          <code className="text-status-info bg-ide-bg px-1.5 py-0.5 rounded border border-ide-border">
            Recharts Quantitative Projection
          </code>
        </div>
        <div className="flex items-center gap-2">
          <span>Analyzed Rows:</span>
          <span className="font-semibold text-white px-1.5 py-0.5 rounded bg-ide-card border border-ide-border">
            {rows.length} rows
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aggregated query chart if available */}
        {genericAggData.length > 0 ? (
          <div className="bg-ide-card border border-ide-border rounded p-3 space-y-2">
            <div className="text-[11px] font-semibold text-ide-muted uppercase tracking-wider">
              Query Aggregation Breakdown ({columns[1] || "Value"})
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genericAggData}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontFamily="monospace" />
                  <YAxis stroke="#475569" fontSize={10} fontFamily="monospace" />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="value" fill="#38bdf8" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : serviceData.length > 0 ? (
          <div className="bg-ide-card border border-ide-border rounded p-3 space-y-2">
            <div className="text-[11px] font-semibold text-ide-muted uppercase tracking-wider">
              Log Events by Originating Service
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontFamily="monospace" />
                  <YAxis stroke="#475569" fontSize={10} fontFamily="monospace" />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="count" fill="#818cf8" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {/* Status Distribution Pie */}
        {statusData.length > 0 && (
          <div className="bg-ide-card border border-ide-border rounded p-3 space-y-2">
            <div className="text-[11px] font-semibold text-ide-muted uppercase tracking-wider">
              HTTP Status Code Proportions
            </div>
            <div className="h-60 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    fontSize={10}
                    fontFamily="monospace"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Latency Distribution */}
        {hasNumericMetric && (
          <div className="bg-ide-card border border-ide-border rounded p-3 space-y-2 md:col-span-2">
            <div className="text-[11px] font-semibold text-ide-muted uppercase tracking-wider">
              Response Time Latency Distribution (ms)
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latencyBuckets}>
                  <XAxis dataKey="range" stroke="#475569" fontSize={10} fontFamily="monospace" />
                  <YAxis stroke="#475569" fontSize={10} fontFamily="monospace" />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="count" fill="#34d399" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
