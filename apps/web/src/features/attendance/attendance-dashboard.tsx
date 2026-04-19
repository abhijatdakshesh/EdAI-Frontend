"use client";

import type { ColDef } from "ag-grid-community";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
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

import { getAttendanceDashboard } from "./repository";

export function AttendanceDashboard() {
  const { session } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["attendance", "dashboard"],
    queryFn: getAttendanceDashboard,
    refetchInterval: 10_000,
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

  const alertCols = useMemo<ColDef[]>(
    () => [
      { field: "studentName", headerName: "Student", flex: 1 },
      { field: "campusName", headerName: "Campus", flex: 1 },
      { field: "streakAbsentDays", headerName: "Streak (d)", type: "numericColumn", width: 110 },
      {
        field: "guardianNotified",
        headerName: "Guardian",
        width: 110,
        valueFormatter: (p) => (p.value ? "Notified" : "Pending"),
      },
    ],
    [],
  );

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
                <ModuleCard
                  heading="Students"
                  description={`${data.campuses.reduce((s, c) => s + c.totalStudents, 0)}`}
                />
                <ModuleCard
                  heading="Present"
                  description={`${data.campuses.reduce((s, c) => s + c.presentCount, 0)}`}
                />
                <ModuleCard
                  heading="Absent"
                  description={`${data.campuses.reduce((s, c) => s + c.absenteeCount, 0)}`}
                />
                <ModuleCard
                  heading="At Risk"
                  description={`${data.campuses.reduce((s, c) => s + c.atRiskCount, 0)}`}
                />
              </div>

              <div>
                <p className="label-track mb-2">30-day present rate (trust aggregate)</p>
                <div className="h-[280px] w-full rounded border border-border bg-surface p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={RAYCRAFT_CHART.border} />
                      <XAxis dataKey="label" tick={{ fill: RAYCRAFT_CHART.textSecondary, fontSize: 11 }} />
                      <YAxis
                        domain={[80, 100]}
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
                <RaycraftGrid
                  rowData={data.alerts}
                  columnDefs={alertCols}
                  defaultColDef={{ sortable: true, resizable: true }}
                  getRowId={(p) => String((p.data as { studentId: string }).studentId)}
                  height={200}
                />
              </div>
            </>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
