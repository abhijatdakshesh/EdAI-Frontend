"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { VTUNotificationsPanel } from "@/features/vtu/notifications-panel";
import { Button } from "@/components/ui/button";
import { RAYCRAFT_CHART } from "@/lib/chart-theme";
import { cn } from "@/lib/utils";

import { getDashboard } from "./repository";
import type { KpiCard } from "./types";

const trendIcon = { up: "↑", down: "↓", flat: "→" };

const kpiStatusStyle: Record<string, string> = {
  healthy: "border-[#3D6B4F]",
  warning: "border-[#8B6914]",
  critical: "border-[#8B2F2F]"
};

const trendColor: Record<string, string> = {
  up: "text-[#3D6B4F]",
  down: "text-[#8B2F2F]",
  flat: "text-[#6B6358]"
};

const alertSeverityStyle: Record<string, string> = {
  critical: "border-l-[#8B2F2F] bg-[#F5E6E6]",
  warning: "border-l-[#8B6914] bg-[#F5EDDB]",
  info: "border-l-[#2F567A] bg-[#E6EEF5]"
};

function KpiTile({ kpi }: { kpi: KpiCard }) {
  return (
    <div className={cn("rounded border-l-4 bg-surface p-4 shadow-sm", kpiStatusStyle[kpi.status])}>
      <p className="label-track">{kpi.label}</p>
      <p className="mt-1 text-3xl font-light text-text-primary">
        {kpi.value}
        {kpi.unit ? <span className="ml-1 text-base text-text-muted">{kpi.unit}</span> : null}
      </p>
      <p className={cn("mt-1 text-xs", trendColor[kpi.trend])}>
        {trendIcon[kpi.trend]} {kpi.trendValue}
      </p>
    </div>
  );
}

export function AdminDashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dashboard", "analytics"],
    queryFn: getDashboard,
  });

  const campusChartData = useMemo(
    () =>
      (data?.campusHealth ?? []).map((c) => ({
        shortName: c.campusName.replace(" Campus", "").replace("Raycraft ", "Raycraft\n"),
        attendance: c.attendanceRate,
        fees: c.feeCollectionRate,
        health: c.healthScore,
      })),
    [data],
  );

  return (
    <AppShell title="Dashboard">
      <div className="grid gap-5">
        {/* KPI row */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="label-track">
              {data ? `Trust-Level KPIs — ${new Date(data.generatedAt).toLocaleString()}` : "Loading..."}
            </p>
            <Button size="sm" variant="ghost" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data?.kpis.map((kpi) => <KpiTile key={kpi.label} kpi={kpi} />) ??
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded bg-surface" />
              ))}
          </div>
        </div>

        {/* Campus health */}
        {data ? (
          <>
            <p className="label-track">Campus comparison (Recharts)</p>
            <div className="h-[300px] w-full rounded border border-border bg-surface p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campusChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={RAYCRAFT_CHART.border} />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fill: RAYCRAFT_CHART.textSecondary, fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: RAYCRAFT_CHART.textSecondary, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: RAYCRAFT_CHART.cream,
                      border: `1px solid ${RAYCRAFT_CHART.border}`,
                      borderRadius: 4,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="attendance" name="Attendance %" fill={RAYCRAFT_CHART.espresso} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="fees" name="Fee coll. %" fill={RAYCRAFT_CHART.info} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="health" name="Health" fill={RAYCRAFT_CHART.success} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="label-track">Campus Health Matrix</p>
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm">
                <thead className="bg-cream-200">
                  <tr>
                    {["Campus", "Attendance", "Fee Collection", "At-Risk", "Grievances", "Health Score"].map(
                      (h) => (
                        <th key={h} className="px-4 py-2 text-left label-track">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.campusHealth.map((row) => (
                    <tr key={row.campusId} className="border-t border-border even:bg-cream-50">
                      <td className="px-4 py-2 font-medium">{row.campusName}</td>
                      <td className="px-4 py-2">{row.attendanceRate}%</td>
                      <td className="px-4 py-2">{row.feeCollectionRate}%</td>
                      <td className="px-4 py-2">{row.atRiskStudents}</td>
                      <td className="px-4 py-2">{row.openGrievances}</td>
                      <td className="px-4 py-2">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            row.healthScore >= 90
                              ? "bg-[#EBF3EE] text-[#3D6B4F]"
                              : row.healthScore >= 75
                                ? "bg-[#F5EDDB] text-[#8B6914]"
                                : "bg-[#F5E6E6] text-[#8B2F2F]"
                          )}
                        >
                          {row.healthScore} / 100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Alerts feed */}
            <p className="label-track">Live Alert Feed</p>
            <div className="space-y-2">
              {data.recentAlerts.map((alert) => (
                <div
                  key={alert.alertId}
                  className={cn(
                    "rounded border-l-4 p-3",
                    alertSeverityStyle[alert.severity]
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="label-track">{alert.kind}</p>
                      <p className="font-medium">{alert.message}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {new Date(alert.occurredAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded px-2 py-0.5 text-xs font-medium",
                        alert.severity === "critical"
                          ? "bg-[#F5E6E6] text-[#8B2F2F]"
                          : alert.severity === "warning"
                            ? "bg-[#F5EDDB] text-[#8B6914]"
                            : "bg-[#E6EEF5] text-[#2F567A]"
                      )}
                    >
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : isLoading ? (
          <ModuleCard heading="Loading" description="Loading command center…" />
        ) : null}

        <VTUNotificationsPanel limit={10} />
      </div>
    </AppShell>
  );
}
