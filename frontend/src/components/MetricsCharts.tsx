import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { ResultsData } from "@/lib/api";

interface MetricsChartsProps {
  results?: ResultsData;
}

const COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899"];

export const MetricsCharts: React.FC<MetricsChartsProps> = ({ results }) => {
  if (!results || !results.rows || results.rows.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        No dataset rows to chart. Run a query returning rows to visualize distributions.
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
  const hasAggCount = columns.some((c) => c.toUpperCase().includes("COUNT") || c.toUpperCase().includes("AVG") || c.toUpperCase().includes("SUM"));
  let genericAggData: any[] = [];
  if (hasAggCount && rows.length > 0) {
    const labelCol = columns[0];
    const valCol = columns[1] || columns[0];
    genericAggData = rows.slice(0, 10).map((r) => ({
      name: String(r[labelCol]),
      value: typeof r[valCol] === "number" ? r[valCol] : 1
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-400 border-b border-dark-border pb-3">
        <span>Visual Analytics Engine: <code className="text-brand-cyan">Recharts 2.12 Declarative Charts</code></span>
        <span>Analyzed Records: <strong className="text-white font-mono">{rows.length} rows</strong></span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aggregated query chart if available */}
        {genericAggData.length > 0 ? (
          <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs uppercase font-semibold text-gray-300 font-mono">
              Query Aggregation Breakdown ({columns[1] || "Count"})
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genericAggData}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : serviceData.length > 0 ? (
          <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs uppercase font-semibold text-gray-300 font-mono">Events by Originating Service</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {/* Status Distribution Pie / Bar */}
        {statusData.length > 0 && (
          <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs uppercase font-semibold text-gray-300 font-mono">Status Code Distribution</h4>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    fontSize={11}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Latency Distribution */}
        {hasNumericMetric && (
          <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm space-y-3 md:col-span-2">
            <h4 className="text-xs uppercase font-semibold text-gray-300 font-mono">Response Time Latency Distribution</h4>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latencyBuckets}>
                  <XAxis dataKey="range" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
