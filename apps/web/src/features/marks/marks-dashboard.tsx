"use client";

import type { ColDef } from "ag-grid-community";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { RaycraftGrid } from "@/components/tables/raycraft-grid";
import { Button } from "@/components/ui/button";

import { getMarksDashboard, verifyAssessment } from "./repository";

export function MarksDashboard() {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["marks", "dashboard"],
    queryFn: getMarksDashboard,
  });

  const cols = useMemo<ColDef[]>(
    () => [
      { field: "courseCode", headerName: "Course", width: 110 },
      { field: "title", headerName: "Assessment", flex: 1.5, minWidth: 180 },
      { field: "maxMarks", headerName: "Max", type: "numericColumn", width: 80 },
      {
        field: "pendingVerification",
        headerName: "Pending verify",
        type: "numericColumn",
        width: 140,
      },
    ],
    [],
  );

  async function onVerify(assessmentId: string) {
    setBusyId(assessmentId);
    try {
      await verifyAssessment(assessmentId);
      await queryClient.invalidateQueries({ queryKey: ["marks", "dashboard"] });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell title="Marks">
      <div className="grid gap-4">
        <ModuleCard
          heading="Assessment Verification Queue"
          description={
            data
              ? `Updated ${new Date(data.updatedAt).toLocaleTimeString()} • ${data.flaggedSubmissions} flagged submissions`
              : "Loading marks dashboard..."
          }
        >
          <Button onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        </ModuleCard>

        {data ? (
          <>
            <div>
              <p className="label-track mb-2">Marks entry & verification (AG Grid)</p>
              <RaycraftGrid
                rowData={data.assessments}
                columnDefs={cols}
                defaultColDef={{ sortable: true, resizable: true }}
                getRowId={(p) => String((p.data as { assessmentId: string }).assessmentId)}
                height={280}
              />
            </div>

            <ModuleCard heading="Quick verify" description="Verify one pending row per assessment.">
              <div className="space-y-2">
                {data.assessments.map((a) => (
                  <div key={a.assessmentId} className="flex items-center justify-between rounded border p-2">
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-text-secondary">
                        {a.courseCode} • Pending {a.pendingVerification}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === a.assessmentId || a.pendingVerification === 0}
                      onClick={() => void onVerify(a.assessmentId)}
                    >
                      {busyId === a.assessmentId ? "…" : "Verify One"}
                    </Button>
                  </div>
                ))}
              </div>
            </ModuleCard>
          </>
        ) : isLoading ? (
          <ModuleCard heading="Loading" description="Fetching assessments..." />
        ) : null}
      </div>
    </AppShell>
  );
}
