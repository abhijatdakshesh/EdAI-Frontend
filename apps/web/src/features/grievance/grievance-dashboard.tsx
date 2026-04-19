"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getGrievanceDashboard, updateGrievanceStatus } from "./repository";
import type { GrievanceDashboardResponse, GrievanceStatus } from "./types";

const priorityStyle: Record<string, string> = {
  critical: "text-[#8B2F2F] bg-[#F5E6E6]",
  high: "text-[#8B6914] bg-[#F5EDDB]",
  medium: "text-[#2F567A] bg-[#E6EEF5]",
  low: "text-[#6B6358] bg-[#EAE6DE]"
};

const statusStyle: Record<string, string> = {
  open: "text-[#8B2F2F] bg-[#F5E6E6]",
  assigned: "text-[#8B6914] bg-[#F5EDDB]",
  in_review: "text-[#2F567A] bg-[#E6EEF5]",
  resolved: "text-[#3D6B4F] bg-[#EBF3EE]",
  closed: "text-[#9B9489] bg-[#EAE6DE]"
};

const nextStatus: Partial<Record<GrievanceStatus, GrievanceStatus>> = {
  open: "assigned",
  assigned: "in_review",
  in_review: "resolved",
  resolved: "closed"
};

export function GrievanceDashboard() {
  const [data, setData] = useState<GrievanceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getGrievanceDashboard());
    } finally {
      setLoading(false);
    }
  }

  async function onAdvance(caseId: string, current: GrievanceStatus) {
    const next = nextStatus[current];
    if (!next) return;
    setBusyId(caseId);
    try {
      await updateGrievanceStatus(caseId, next);
      setData((prev) =>
        prev
          ? {
              ...prev,
              openCount: next === "resolved" ? Math.max(0, prev.openCount - 1) : prev.openCount,
              cases: prev.cases.map((c) =>
                c.caseId === caseId ? { ...c, status: next } : c
              )
            }
          : prev
      );
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AppShell title="Grievance">
      <div className="grid gap-4">
        {/* KPI strip */}
        <div className="grid gap-4 lg:grid-cols-3">
          <ModuleCard
            heading="Case Dashboard"
            description={
              data
                ? `${data.openCount} open • ${data.slaBreachCount} SLA breaches • ${data.resolvedThisWeek} resolved this week`
                : "Loading grievance data..."
            }
          >
            <Button onClick={() => void load()}>{loading ? "Refreshing..." : "Refresh"}</Button>
          </ModuleCard>
          <ModuleCard
            heading="SLA Watchlist"
            description={
              data
                ? data.cases
                    .filter((c) => c.slaBreach)
                    .map((c) => `${c.caseId} — ${c.studentName}`)
                    .join(" • ") || "No SLA breaches"
                : "—"
            }
          />
          <ModuleCard
            heading="Critical Cases"
            description={
              data
                ? data.cases
                    .filter((c) => c.priority === "critical" && c.status !== "closed")
                    .map((c) => `${c.caseId}: ${c.summary.slice(0, 40)}...`)
                    .join(" • ") || "None active"
                : "—"
            }
          />
        </div>

        {/* Case list */}
        {data ? (
          <>
            <p className="label-track">All Cases</p>
            <div className="space-y-2">
              {data.cases.map((c) => {
                const advance = nextStatus[c.status];
                return (
                  <div
                    key={c.caseId}
                    className={cn(
                      "rounded border p-3",
                      c.slaBreach ? "border-[#8B2F2F] bg-[#F5E6E6]" : "border-border bg-surface"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-text-muted">{c.caseId}</span>
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", priorityStyle[c.priority] ?? "")}>
                            {c.priority}
                          </span>
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusStyle[c.status] ?? "")}>
                            {c.status.replace("_", " ")}
                          </span>
                          {c.slaBreach && (
                            <span className="rounded bg-[#F5E6E6] px-2 py-0.5 text-xs font-medium text-[#8B2F2F]">
                              SLA breached
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-medium">{c.studentName} — {c.summary}</p>
                        <p className="text-sm text-text-secondary">
                          {c.program} • {c.category.replace("_", " ")} •{" "}
                          {c.assignedOfficer ? `Officer: ${c.assignedOfficer}` : "Unassigned"} •{" "}
                          SLA: {new Date(c.slaDeadline).toLocaleString()}
                        </p>
                      </div>
                      {advance ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === c.caseId}
                          onClick={() => void onAdvance(c.caseId, c.status)}
                        >
                          → {advance.replace("_", " ")}
                        </Button>
                      ) : (
                        <span className="text-xs text-text-muted">Closed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
