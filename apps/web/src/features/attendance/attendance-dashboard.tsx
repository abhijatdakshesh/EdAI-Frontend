"use client";

import type { ColDef } from "ag-grid-community";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { RaycraftGrid } from "@/components/tables/raycraft-grid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/use-auth";
import { RAYCRAFT_CHART } from "@/lib/chart-theme";
import { apiPost } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import { getAttendanceDashboard } from "./repository";

export function AttendanceDashboard() {
  const { session } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["attendance", "dashboard"],
    queryFn: getAttendanceDashboard,
    refetchInterval: 10_000,
  });
  const [notified, setNotified] = useState<Set<string>>(new Set());
  const notifyMutation = useMutation({
    mutationFn: (studentId: string) =>
      apiPost<void>("/api/attendance/notify-guardian", { studentId }),
    onSuccess: (_: void, studentId: string) =>
      setNotified((prev) => new Set([...prev, studentId])),
  });

  const campusCols = useMemo<ColDef[]>(
    () => [
      { field: "campusName", headerName: "Campus", flex: 1.6, minWidth: 160 },
      { field: "totalStudents", headerName: "Total", type: "numericColumn", width: 100 },
      { field: "presentCount", headerName: "Present", type: "numericColumn", width: 100 },
      { field: "absenteeCount", headerName: "Absent", type: "numericColumn", width: 100 },
      {
        field: "ratePct",
        headerName: "Present %",
        type: "numericColumn",
        width: 110,
        valueFormatter: (p) => (p.value != null ? `${Number(p.value).toFixed(1)}%` : ""),
      },
    ],
    [],
  );

  const campusRows = useMemo(() => {
    if (!data) return [];
    return data.campuses.map((c) => ({
      campusId: c.campusId,
      campusName: c.campusName,
      totalStudents: c.totalStudents,
      presentCount: c.presentCount,
      absenteeCount: c.absenteeCount,
      ratePct: c.totalStudents ? (c.presentCount / c.totalStudents) * 100 : 0,
    }));
  }, [data]);

  const chartData = useMemo(
    () =>
      (data?.dailyPresentRate ?? []).map((d) => ({
        ...d,
        label: d.date.slice(5),
      })),
    [data],
  );

  return (
    <AppShell title="Attendance">
      {!session ? null : (
        <div className="grid gap-4">
          <ModuleCard
            heading="Daily Sync"
            description={
              data ? `Last synced at ${new Date(data.syncedAt).toLocaleString()}` : "Awaiting first sync."
            }
          >
            <div className="flex items-center gap-3">
              <Button onClick={() => void refetch()} disabled={isFetching}>
                {isFetching ? "Syncing..." : "Sync Attendance"}
              </Button>
              {error ? (
                <span className="text-sm text-[#8B2F2F]">
                  {error instanceof Error ? error.message : "Failed to load"}
                </span>
              ) : null}
            </div>
          </ModuleCard>

          {isLoading ? (
            <ModuleCard heading="Loading" description="Fetching attendance metrics..." />
          ) : data ? (
            <>
              <div className="grid gap-4 lg:grid-cols-4">
                {(() => {
                  const total = data.campuses.reduce((s, c) => s + c.totalStudents, 0);
                  const present = data.campuses.reduce((s, c) => s + c.presentCount, 0);
                  const absent = data.campuses.reduce((s, c) => s + c.absenteeCount, 0);
                  const atRisk = data.campuses.reduce((s, c) => s + c.atRiskCount, 0);
                  return [
                    { label: "Students", value: total, accent: "border-l-[#1C1810]" },
                    { label: "Present", value: present, accent: "border-l-[#3D6B4F]" },
                    { label: "Absent", value: absent, accent: absent > 0 ? "border-l-[#8B6914]" : "border-l-[#3D6B4F]" },
                    { label: "At Risk", value: atRisk, accent: atRisk > 0 ? "border-l-[#8B2F2F]" : "border-l-[#3D6B4F]" },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className={cn("rounded border-l-4 bg-surface p-5 shadow-sm", accent)}>
                      <p className="label-track text-xs">Feature</p>
                      <h3 className="text-2xl mt-1">{value}</h3>
                      <p className="mt-1 text-sm text-text-secondary">{label}</p>
                    </div>
                  ));
                })()}
              </div>

              <div>
                <p className="label-track mb-2">30-day present rate (trust aggregate)</p>
                <div className="h-[280px] w-full rounded border border-border bg-surface p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={RAYCRAFT_CHART.border} />
                      <XAxis dataKey="label" tick={{ fill: RAYCRAFT_CHART.textSecondary, fontSize: 11 }} />
                      <YAxis
                        domain={[60, 100]}
                        tick={{ fill: RAYCRAFT_CHART.textSecondary, fontSize: 11 }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: RAYCRAFT_CHART.cream,
                          border: `1px solid ${RAYCRAFT_CHART.border}`,
                          borderRadius: 4,
                        }}
                        formatter={(value) => [
                          `${Number(value ?? 0).toFixed(1)}%`,
                          "Present rate",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="ratePct"
                        stroke={RAYCRAFT_CHART.espresso}
                        fill={RAYCRAFT_CHART.surface}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <p className="label-track mb-2">Campus snapshot (AG Grid)</p>
                <RaycraftGrid
                  rowData={campusRows}
                  columnDefs={campusCols}
                  defaultColDef={{ sortable: true, resizable: true }}
                  getRowId={(p) => String((p.data as { campusId: string }).campusId)}
                  height={220}
                />
              </div>

              <div>
                <p className="label-track mb-2">Escalation alerts</p>
                {data.alerts.length === 0 ? (
                  <p className="text-sm text-text-muted py-3">No escalation alerts today.</p>
                ) : (
                  <div className="rounded border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-cream-200">
                        <tr>
                          {["Student", "Campus", "Absent streak", "Guardian", ""].map((h) => (
                            <th key={h} className="px-4 py-2 text-left label-track text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.alerts.map((a) => {
                          const isNotified = a.guardianNotified || notified.has(a.studentId);
                          return (
                            <tr key={a.studentId} className="border-t border-border even:bg-cream-50">
                              <td className="px-4 py-2 font-medium">{a.studentName}</td>
                              <td className="px-4 py-2 text-text-muted">{a.campusName}</td>
                              <td className="px-4 py-2">
                                <span className="rounded bg-[#F5E6E6] px-2 py-0.5 text-xs text-[#8B2F2F]">
                                  {a.streakAbsentDays}d
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                {isNotified ? (
                                  <span className="text-xs text-[#3D6B4F]">✓ Notified</span>
                                ) : (
                                  <span className="text-xs text-[#8B6914]">Pending</span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                {!isNotified && (
                                  <button
                                    className="text-xs text-[#2F567A] hover:underline disabled:opacity-50"
                                    disabled={notifyMutation.isPending}
                                    onClick={() => notifyMutation.mutate(a.studentId)}
                                  >
                                    Notify
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
