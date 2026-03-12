import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import {
  fetchReportsKPIs,
  fetchReportsUsers,
  fetchReportsJobs,
  fetchReportsRevenue,
  fetchReportsProvidersTop,
  downloadReport,
} from "@/services/reportsService";
import type { ReportPeriod } from "@/types";

const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

function getReportParams(period: ReportPeriod, from: string, to: string) {
  if (period === "custom" && from && to) {
    return { period: "custom" as const, from, to };
  }
  return { period: period === "custom" ? "month" : period };
}

export function Reports() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const params = getReportParams(period, customFrom, customTo);

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["reports", "kpis", params],
    queryFn: () => fetchReportsKPIs(params),
    staleTime: 60_000,
  });

  const { data: usersData } = useQuery({
    queryKey: ["reports", "users", params],
    queryFn: () => fetchReportsUsers(params),
    staleTime: 60_000,
  });

  const { data: jobsData } = useQuery({
    queryKey: ["reports", "jobs", params],
    queryFn: () => fetchReportsJobs(params),
    staleTime: 60_000,
  });

  const { data: revenueData } = useQuery({
    queryKey: ["reports", "revenue", params],
    queryFn: () => fetchReportsRevenue(params),
    staleTime: 60_000,
  });

  const { data: topProviders = [] } = useQuery({
    queryKey: ["reports", "providers", params],
    queryFn: () => fetchReportsProvidersTop(params),
    staleTime: 60_000,
  });

  const handleExport = useCallback(
    async (format: "csv" | "pdf") => {
      try {
        const blob = await downloadReport(format, params);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reports-${params.period}${params.from ? `-${params.from}` : ""}${params.to ? `-${params.to}` : ""}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Export failed:", e);
      }
    },
    [params]
  );

  const k = kpis ?? {
    newUsers: 0,
    newProviders: 0,
    jobsCompleted: 0,
    revenue: 0,
    avgRating: 0,
  };

  const userSeries = usersData?.series ?? [];
  const jobsByCategory = jobsData?.byCategory ?? [];
  const revenueSeries = revenueData?.series ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-mordobo-text">Reports & Analytics</h1>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            className="rounded-xl border border-mordobo-border bg-mordobo-card px-4 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {period === "custom" && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
              />
              <span className="text-mordobo-textSecondary">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-xl border border-mordobo-border bg-mordobo-card px-3 py-2 text-sm text-mordobo-text focus:border-mordobo-accent focus:outline-none"
              />
            </>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleExport("csv")}
              className="rounded-xl border border-mordobo-border bg-mordobo-card px-4 py-2 text-sm font-medium text-mordobo-text hover:bg-mordobo-surfaceHover"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              className="rounded-xl bg-mordobo-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {kpisLoading ? (
        <p className="text-mordobo-textSecondary">Loading metrics…</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          <StatCard icon="👥" label="New Users" value={k.newUsers} color="accent" />
          <StatCard icon="🔧" label="New Providers" value={k.newProviders} color="info" />
          <StatCard icon="✅" label="Jobs Completed" value={k.jobsCompleted} color="success" />
          <StatCard
            icon="💰"
            label="Revenue"
            value={`$${k.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            color="success"
          />
          <StatCard
            icon="⭐"
            label="Avg Rating"
            value={k.avgRating.toFixed(1)}
            color="warning"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <h3 className="text-base font-semibold text-mordobo-text mb-4">User growth</h3>
          <div className="h-[280px] w-full">
            {userSeries.length === 0 ? (
              <p className="text-sm text-mordobo-textSecondary flex items-center h-full">No data for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userSeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#8B8FA3", fontSize: 11 }}
                    tickFormatter={(v) => (typeof v === "string" ? v.slice(5) : v)}
                  />
                  <YAxis tick={{ fill: "#8B8FA3", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#1A1C28", border: "1px solid #2A2D3A", borderRadius: "8px" }}
                    labelStyle={{ color: "#E8E9ED" }}
                    formatter={(value: number) => [value, "Users"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6C5CE7"
                    strokeWidth={2}
                    dot={{ fill: "#6C5CE7", r: 3 }}
                    name="Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
          <h3 className="text-base font-semibold text-mordobo-text mb-4">{t("reports.jobsPerCategory")}</h3>
          <div className="h-[280px] w-full">
            {jobsByCategory.length === 0 ? (
              <p className="text-sm text-mordobo-textSecondary flex items-center h-full">No data for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={jobsByCategory}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                  <XAxis type="number" tick={{ fill: "#8B8FA3", fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="categoryName"
                    width={100}
                    tick={{ fill: "#8B8FA3", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ background: "#1A1C28", border: "1px solid #2A2D3A", borderRadius: "8px" }}
                    formatter={(value: number) => [value, "Jobs"]}
                  />
                  <Bar dataKey="count" fill="#6C5CE7" radius={[0, 4, 4, 0]} name="Jobs" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
        <h3 className="text-base font-semibold text-mordobo-text mb-4">Revenue trend</h3>
        <div className="h-[280px] w-full">
          {revenueSeries.length === 0 ? (
            <p className="text-sm text-mordobo-textSecondary flex items-center h-full">No data for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#8B8FA3", fontSize: 11 }}
                  tickFormatter={(v) => (typeof v === "string" ? v.slice(5) : v)}
                />
                <YAxis
                  tick={{ fill: "#8B8FA3", fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{ background: "#1A1C28", border: "1px solid #2A2D3A", borderRadius: "8px" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6C5CE7"
                  fill="#6C5CE7"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-mordobo-card border border-mordobo-border rounded-[14px] p-6">
        <h3 className="text-base font-semibold text-mordobo-text mb-4">Top providers by revenue</h3>
        {topProviders.length === 0 ? (
          <p className="text-sm text-mordobo-textSecondary py-4">No data for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mordobo-border text-left text-mordobo-textSecondary">
                  <th className="pb-3 pr-4 font-medium">#</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium text-right">Orders</th>
                  <th className="pb-3 font-medium text-right">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {topProviders.map((p) => (
                  <tr key={p.providerId} className="border-b border-mordobo-border last:border-0">
                    <td className="py-3 pr-4 text-mordobo-textMuted">{p.rank}</td>
                    <td className="py-3 pr-4 text-mordobo-text font-medium">{p.fullName}</td>
                    <td className="py-3 pr-4 text-mordobo-textSecondary">{p.email}</td>
                    <td className="py-3 pr-4 text-right text-mordobo-text">{p.orderCount}</td>
                    <td className="py-3 text-right font-medium text-mordobo-success">
                      ${p.earnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
