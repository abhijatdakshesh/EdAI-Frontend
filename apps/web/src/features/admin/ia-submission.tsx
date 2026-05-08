"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useIASubmissions,
  useSendIAReminder,
  useConfirmIASubmission,
  type IASubmission,
  type IAFilter,
} from "@/lib/api/vtu";
import { useDepartments } from "@/lib/api/academics";

const statusStyle: Record<IASubmission["status"], string> = {
  NOT_STARTED: "bg-[#F0EEEB] text-[#6B6358]",
  DRAFT: "bg-[#F5EDDB] text-[#8B6914]",
  SUBMITTED: "bg-[#E6EEF5] text-[#2F567A]",
  CONFIRMED: "bg-[#EBF3EE] text-[#3D6B4F]",
};

export function IASubmissionDashboard() {
  const { data: departments = [] } = useDepartments();
  const [filters, setFilters] = useState<IAFilter>({});

  const { data: submissions = [], isLoading, error } = useIASubmissions(filters);
  const sendReminder = useSendIAReminder();
  const confirmSub = useConfirmIASubmission();

  const counts = {
    total: submissions.length,
    notStarted: submissions.filter((s) => s.status === "NOT_STARTED").length,
    submitted: submissions.filter((s) => s.status === "SUBMITTED").length,
    confirmed: submissions.filter((s) => s.status === "CONFIRMED").length,
  };

  return (
    <AppShell title="IA Submission Dashboard">
      <div className="grid gap-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Subjects", value: counts.total },
            { label: "Not Started", value: counts.notStarted, warn: counts.notStarted > 0 },
            { label: "Submitted", value: counts.submitted },
            { label: "Confirmed", value: counts.confirmed },
          ].map((s) => (
            <div key={s.label} className={cn("rounded border-l-4 bg-surface p-4",
              s.warn ? "border-l-[#8B2F2F]" : "border-l-[#3D6B4F]")}>
              <p className="label-track">{s.label}</p>
              <p className="mt-1 text-3xl font-light">{isLoading ? "—" : s.value}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {!isLoading && counts.total > 0 && (
          <div>
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Submission Progress</span>
              <span>{counts.confirmed + counts.submitted} / {counts.total} done</span>
            </div>
            <div className="h-3 rounded-full bg-cream-200 overflow-hidden flex">
              <div className="bg-[#3D6B4F] h-3 transition-all"
                style={{ width: `${(counts.confirmed / counts.total) * 100}%` }} />
              <div className="bg-[#2F567A] h-3 transition-all"
                style={{ width: `${(counts.submitted / counts.total) * 100}%` }} />
            </div>
            <div className="flex gap-4 mt-1 text-xs text-text-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3D6B4F] inline-block" />Confirmed</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2F567A] inline-block" />Submitted</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.dept ?? ""}
            onChange={(e) => setFilters({ ...filters, dept: e.target.value || undefined })}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
          </select>
          <select
            value={filters.status ?? ""}
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="">All Status</option>
            {["NOT_STARTED", "DRAFT", "SUBMITTED", "CONFIRMED"].map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded bg-[#F5E6E6] px-4 py-3 text-sm text-[#8B2F2F]">
            Error: {(error as Error).message}
          </p>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-cream-200">
              <tr>
                {["Teacher", "Subject", "Dept", "Students", "Entered", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border animate-pulse">
                      {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 w-20 rounded bg-cream-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                : submissions.map((sub) => (
                    <tr key={sub.id} className="border-t border-border even:bg-cream-50">
                      <td className="px-4 py-2">
                        <p className="font-medium">{sub.teacherName}</p>
                      </td>
                      <td className="px-4 py-2">
                        <p>{sub.subjectName}</p>
                        <p className="text-xs text-text-muted font-mono">{sub.subjectCode}</p>
                      </td>
                      <td className="px-4 py-2">{sub.dept}</td>
                      <td className="px-4 py-2 text-center">{sub.studentCount}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={cn(
                          sub.marksEntered === sub.studentCount ? "text-[#3D6B4F]" : "text-[#8B6914]",
                        )}>
                          {sub.marksEntered}/{sub.studentCount}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusStyle[sub.status])}>
                          {sub.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          {(sub.status === "NOT_STARTED" || sub.status === "DRAFT") && (
                            <button
                              className="text-xs text-[#8B6914] hover:underline disabled:opacity-50"
                              disabled={sendReminder.isPending}
                              onClick={() => sendReminder.mutate(sub.id)}
                            >
                              Remind
                            </button>
                          )}
                          {sub.status === "SUBMITTED" && (
                            <Button
                              size="sm"
                              disabled={confirmSub.isPending && confirmSub.variables === sub.id}
                              onClick={() =>
                                confirmSub.mutate(sub.id, {
                                  onError: (err) => alert(`Confirm failed: ${(err as Error).message}`),
                                })
                              }
                            >
                              {confirmSub.isPending && confirmSub.variables === sub.id ? "Confirming…" : "Confirm"}
                            </Button>
                          )}
                          {sub.status === "CONFIRMED" && (
                            <span className="text-xs text-[#3D6B4F]">✓ Done</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && submissions.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-text-muted">
              No IA submissions found for the current filters.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
