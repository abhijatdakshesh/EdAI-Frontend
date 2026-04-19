"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getStudentsDashboard, triggerStudentIntervention } from "./repository";
import type { RiskLevel, StudentsDashboardResponse } from "./types";

const riskStyle: Record<RiskLevel, string> = {
  low: "bg-[#EBF3EE] text-[#3D6B4F]",
  medium: "bg-[#F5EDDB] text-[#8B6914]",
  high: "bg-[#F5E6E6] text-[#8B2F2F]",
  critical: "bg-[#8B2F2F] text-white"
};

export function StudentsDashboard() {
  const [data, setData] = useState<StudentsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RiskLevel | "all">("all");

  async function load() {
    setLoading(true);
    try {
      setData(await getStudentsDashboard());
    } finally {
      setLoading(false);
    }
  }

  async function onIntervene(studentId: string) {
    setBusyId(studentId);
    try {
      await triggerStudentIntervention(studentId);
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = data?.students.filter((s) => filter === "all" || s.riskLevel === filter) ?? [];

  return (
    <AppShell title="Student Risk">
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <ModuleCard
            heading="Student Risk Intelligence"
            description={
              data
                ? `${data.atRisk} at-risk · ${data.criticalCount} critical out of ${data.totalStudents} students`
                : "Loading..."
            }
          >
            <Button onClick={() => void load()}>{loading ? "Refreshing..." : "Refresh"}</Button>
          </ModuleCard>
          <ModuleCard
            heading="Coverage"
            description={
              data ? `${Math.round((data.atRisk / data.totalStudents) * 100)}% at-risk rate campus-wide` : "—"
            }
          />
          <ModuleCard
            heading="No Prior Contact"
            description={
              data
                ? `${data.students.filter((s) => !s.lastContactAt).length} students never contacted`
                : "—"
            }
          />
        </div>

        {data ? (
          <>
            <div className="flex gap-2">
              {(["all", "critical", "high", "medium", "low"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={cn(
                    "rounded px-3 py-1 text-xs font-medium transition-colors",
                    filter === level
                      ? "bg-espresso text-cream"
                      : "bg-surface text-text-secondary hover:text-text-primary"
                  )}
                >
                  {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filtered.map((student) => (
                <div key={student.studentId} className="rounded border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", riskStyle[student.riskLevel])}>
                          Risk {student.riskScore}
                        </span>
                        {student.riskFactors.map((f) => (
                          <span key={f} className="rounded bg-[#EAE6DE] px-2 py-0.5 text-xs text-text-secondary">
                            {f}
                          </span>
                        ))}
                      </div>
                      <p className="mt-0.5 font-medium">
                        {student.name}{" "}
                        <span className="font-normal text-text-secondary">· {student.rollNumber} · {student.class}</span>
                      </p>
                      <p className="text-sm text-text-secondary">
                        Attendance {student.attendancePct}% · CGPA {student.cgpa} ·{" "}
                        {student.feesDue > 0 ? `₹${student.feesDue.toLocaleString()} due` : "Fees clear"} ·{" "}
                        {student.lastContactAt
                          ? `Last contact ${new Date(student.lastContactAt).toLocaleDateString()}`
                          : "Never contacted"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === student.studentId}
                      onClick={() => void onIntervene(student.studentId)}
                    >
                      {busyId === student.studentId ? "..." : "Intervene"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
