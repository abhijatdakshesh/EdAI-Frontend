"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { RAYCRAFT_CHART } from "@/lib/chart-theme";
import {
  useAttendanceTrend,
  useFeeCollectionTrend,
  useAdminDashboardStats,
} from "@/lib/api/analytics";

const REPORT_TYPES = [
  "Attendance Summary",
  "Fee Collection",
  "Marks Distribution",
  "Placement Stats",
  "NAAC Compliance",
  "Grievance Report",
];

export function ReportsAnalytics() {
  const [activeTab, setActiveTab] = useState<"attendance" | "fees" | "export">("attendance");

  const { data: stats, isLoading: loadingStats } = useAdminDashboardStats();
  const { data: attendanceTrend = [], isLoading: loadingAtt } = useAttendanceTrend();
  const { data: feeCollection = [], isLoading: loadingFee } = useFeeCollectionTrend();

  const kpis = [
    {
      label: "Avg Attendance",
      value: loadingStats ? "—" : `${stats?.avgAttendance ?? "—"}%`,
      note: "Institution-wide this semester",
    },
    {
      label: "Fee Collection",
      value: loadingStats ? "—" : `${stats?.feeCollectionPct ?? "—"}%`,
      note: "Of total expected fees",
    },
    {
      label: "Total Students",
      value: loadingStats ? "—" : (stats?.totalStudents ?? "—"),
      note: "Enrolled this semester",
    },
    {
      label: "Faculty",
      value: loadingStats ? "—" : (stats?.totalFaculty ?? "—"),
      note: "Active teaching staff",
    },
  ];

  return (
    <AppShell title="Reports & Analytics">
      <div className="grid gap-5">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.map((s) => (
            <div key={s.label} className="rounded border border-border bg-surface p-4">
              <p className="label-track">{s.label}</p>
              <p className="mt-1 text-2xl font-light">{s.value}</p>
              <p className="mt-0.5 text-xs text-text-muted">{s.note}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["attendance", "fees", "export"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-[#1C1810] font-medium"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab === "export"
                ? "Export Reports"
                : tab === "attendance"
                  ? "Attendance Trend"
                  : "Fee Collection"}
            </button>
          ))}
        </div>

        {activeTab === "attendance" && (
          <div className="rounded border border-border bg-surface p-4">
            <p className="label-track mb-3">Monthly Attendance Trend (%)</p>
            {loadingAtt ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-text-muted">
                Loading chart…
              </div>
            ) : attendanceTrend.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={RAYCRAFT_CHART.border} />
                    <XAxis dataKey="month" tick={{ fill: RAYCRAFT_CHART.textSecondary, fontSize: 11 }} />
                    <YAxis domain={[60, 100]} tick={{ fill: RAYCRAFT_CHART.textSecondary, fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: RAYCRAFT_CHART.cream, border: `1px solid ${RAYCRAFT_CHART.border}` }} />
                    <Legend />
                    <Line type="monotone" dataKey="pct" name="Overall" stroke={RAYCRAFT_CHART.espresso} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-text-muted py-4">No trend data available yet.</p>
            )}
          </div>
        )}

        {activeTab === "fees" && (
          <div className="rounded border border-border bg-surface p-4">
            <p className="label-track mb-3">Fee Collection vs Target (₹ Lakhs)</p>
            {loadingFee ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-text-muted">
                Loading chart…
              </div>
            ) : feeCollection.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={feeCollection}>
                    <CartesianGrid strokeDasharray="3 3" stroke={RAYCRAFT_CHART.border} />
                    <XAxis dataKey="month" tick={{ fill: RAYCRAFT_CHART.textSecondary, fontSize: 11 }} />
                    <YAxis tick={{ fill: RAYCRAFT_CHART.textSecondary, fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: RAYCRAFT_CHART.cream, border: `1px solid ${RAYCRAFT_CHART.border}` }} />
                    <Legend />
                    <Bar dataKey="collected" name="Collected" fill={RAYCRAFT_CHART.success} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="target" name="Target" fill="#C8B89A" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-text-muted py-4">No fee data available yet.</p>
            )}
          </div>
        )}

        {activeTab === "export" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REPORT_TYPES.map((r) => (
              <div
                key={r}
                className="rounded border border-border bg-surface p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{r}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Last generated: recently
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `/api/analytics/export?type=${encodeURIComponent(r)}&format=pdf`,
                      )
                    }
                  >
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `/api/analytics/export?type=${encodeURIComponent(r)}&format=xlsx`,
                      )
                    }
                  >
                    Excel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
