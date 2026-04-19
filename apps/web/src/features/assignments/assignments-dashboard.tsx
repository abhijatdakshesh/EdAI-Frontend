"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getAssignmentsDashboard, sendMissedReminders } from "./repository";
import type { AssignmentsDashboardResponse, AssignmentStatus } from "./types";

const statusStyle: Record<AssignmentStatus, string> = {
  open: "bg-[#E6EEF5] text-[#2F567A]",
  submitted: "bg-[#EBF3EE] text-[#3D6B4F]",
  late: "bg-[#F5EDDB] text-[#8B6914]",
  missed: "bg-[#F5E6E6] text-[#8B2F2F]",
  graded: "bg-[#EAE6DE] text-[#6B6358]"
};

export function AssignmentsDashboard() {
  const [data, setData] = useState<AssignmentsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getAssignmentsDashboard());
    } finally {
      setLoading(false);
    }
  }

  async function onRemind(assignmentId: string) {
    setBusyId(assignmentId);
    try {
      await sendMissedReminders(assignmentId);
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <AppShell title="Assignments">
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <ModuleCard
            heading="Assignment Intelligence"
            description={
              data
                ? `${data.openAssignments} open assignments · ${data.overdueCount} overdue`
                : "Loading..."
            }
          >
            <Button onClick={() => void load()}>{loading ? "Refreshing..." : "Refresh"}</Button>
          </ModuleCard>
          <ModuleCard
            heading="Completion Rate"
            description={
              data
                ? `${Math.round((data.assignments.reduce((s, a) => s + a.submittedCount, 0) / data.assignments.reduce((s, a) => s + a.totalStudents, 0)) * 100)}% across all assignments`
                : "—"
            }
          />
          <ModuleCard
            heading="Missed Submissions"
            description={
              data
                ? `${data.assignments.reduce((s, a) => s + a.missedCount, 0)} total · AI reminders enabled`
                : "—"
            }
          />
        </div>

        {data ? (
          <>
            <p className="label-track">Active Assignments</p>
            <div className="space-y-2">
              {data.assignments.map((a) => {
                const completionPct = Math.round((a.submittedCount / a.totalStudents) * 100);
                const dueDate = new Date(a.dueDate);
                const isPast = dueDate < new Date();
                return (
                  <div key={a.assignmentId} className="rounded border border-border bg-surface p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-text-muted">{a.courseCode}</span>
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusStyle[a.status])}>
                            {a.status}
                          </span>
                        </div>
                        <p className="mt-0.5 font-medium">{a.title}</p>
                        <p className="text-sm text-text-secondary">
                          Due {dueDate.toLocaleDateString()} {isPast ? "(past due)" : ""} · {a.submittedCount}/{a.totalStudents} submitted · {a.missedCount} missed · {a.lateCount} late
                        </p>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-cream-300">
                          <div
                            className={cn(
                              "h-1.5 rounded-full",
                              completionPct >= 80 ? "bg-[#3D6B4F]" : completionPct >= 50 ? "bg-[#8B6914]" : "bg-[#8B2F2F]"
                            )}
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                      </div>
                      {a.missedCount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === a.assignmentId}
                          onClick={() => void onRemind(a.assignmentId)}
                        >
                          {busyId === a.assignmentId ? "Sending..." : `Remind ${a.missedCount}`}
                        </Button>
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
