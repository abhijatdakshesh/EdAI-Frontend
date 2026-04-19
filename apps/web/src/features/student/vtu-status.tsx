"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActiveVTUWindow, useMyVTUStatus, useSubmitVTURegistration } from "@/lib/api/vtu";
import { useAuth } from "@/lib/auth/use-auth";

export function VTUStatus() {
  const { session } = useAuth();
  const { data: window } = useActiveVTUWindow();
  const { data: status, isLoading } = useMyVTUStatus(window?.id ?? "");
  const submitReg = useSubmitVTURegistration();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function toggleSubject(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleRegister() {
    if (!window || selectedIds.length === 0) return;
    submitReg.mutate(
      { windowId: window.id, subjectIds: selectedIds },
      { onSuccess: () => setSubmitted(true) },
    );
  }

  if (!window) {
    return (
      <AppShell title="VTU Registration">
        <div className="rounded border border-dashed border-border p-12 text-center text-sm text-text-muted">
          No VTU registration window is currently open. Check back later.
        </div>
      </AppShell>
    );
  }

  if (submitted || status?.status === "REGISTERED" || status?.status === "SUBMITTED" || status?.status === "CONFIRMED") {
    const allSubjects = [
      ...(status?.eligibleSubjects ?? []),
      ...(status?.ineligibleSubjects ?? []),
    ];

    return (
      <AppShell title="VTU Registration">
        <div className="max-w-2xl py-10 grid gap-4">
          <div className="rounded border border-[#EBF3EE] bg-[#EBF3EE]/30 p-5">
            <p className="font-medium text-[#3D6B4F] text-lg">Registration {status?.status ?? "Submitted"}</p>
            <p className="text-sm text-text-muted mt-1">
              Your VTU exam registration has been recorded for <strong>{window.title}</strong>.
            </p>
          </div>

          {allSubjects.length > 0 ? (
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm">
                <thead className="bg-cream-200">
                  <tr>
                    {["Code", "Subject", "Eligible", "Attendance"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allSubjects.map((s) => {
                    const pct = s.attendancePct ?? null;
                    const meetsAttendance = pct !== null && pct >= 75;
                    return (
                      <tr key={s.subjectId} className="border-t border-border even:bg-cream-50">
                        <td className="px-4 py-2 font-mono text-xs">{s.subjectCode || "—"}</td>
                        <td className="px-4 py-2">{s.subjectName || "—"}</td>
                        <td className="px-4 py-2">
                          {s.eligible
                            ? <span className="text-[#3D6B4F]">✓ Eligible</span>
                            : <span className="text-[#8B2F2F]">✗ Ineligible</span>}
                        </td>
                        <td className="px-4 py-2">
                          {pct !== null ? (
                            <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                              meetsAttendance ? "bg-[#EBF3EE] text-[#3D6B4F]" : "bg-[#F5E6E6] text-[#8B2F2F]")}>
                              {pct}%
                            </span>
                          ) : (
                            <span className="text-text-muted text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No subject data available for this registration.</p>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="VTU Registration">
      <div className="grid gap-5">
        {/* Window info */}
        <div className="rounded border border-[#2F567A] bg-[#E6EEF5] p-4">
          <p className="font-medium text-[#2F567A]">{window.title}</p>
          <p className="text-xs text-[#2F567A]/80 mt-0.5">
            Exam: {window.examMonth} · Open: {window.openDate} · Closes: {window.closeDate}
          </p>
        </div>

        {/* Eligibility rules — only shown when the backend returns them */}
        {window.eligibilityRules && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Min Attendance", value: `${window.eligibilityRules.minAttendancePct}%` },
              { label: "Max Backlogs", value: String(window.eligibilityRules.maxBacklogs) },
              { label: "Fee Clearance", value: window.eligibilityRules.feeClearance ? "Required" : "Not required" },
            ].map((r) => (
              <div key={r.label} className="rounded border border-border bg-surface p-3">
                <p className="label-track text-xs">{r.label}</p>
                <p className="mt-1 font-medium">{r.value}</p>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-text-muted">Checking eligibility…</p>
        ) : !status ? (
          <p className="text-sm text-text-muted">No eligibility data found. Contact the admin.</p>
        ) : (
          <>
            {/* Eligible subjects */}
            {(status.eligibleSubjects?.length ?? 0) > 0 && (
              <div>
                <p className="label-track mb-3 text-[#3D6B4F]">
                  Eligible Subjects ({status.eligibleSubjects.length})
                </p>
                <div className="grid gap-2">
                  {status.eligibleSubjects.map((s) => (
                    <label key={s.subjectId}
                      className={cn(
                        "flex items-center gap-3 rounded border p-4 cursor-pointer transition-colors",
                        selectedIds.includes(s.subjectId)
                          ? "border-[#1C1810] bg-cream-100"
                          : "border-border bg-surface hover:border-[#1C1810]",
                      )}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.subjectId)}
                        onChange={() => toggleSubject(s.subjectId)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{s.subjectName || "—"}</p>
                        <p className="text-xs text-text-muted">{s.subjectCode || "—"}</p>
                      </div>
                      <span className="rounded px-2 py-0.5 text-xs font-medium bg-[#EBF3EE] text-[#3D6B4F]">
                        {s.attendancePct != null ? `${s.attendancePct}%` : "—"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Ineligible subjects */}
            {(status.ineligibleSubjects?.length ?? 0) > 0 && (
              <div>
                <p className="label-track mb-3 text-[#8B2F2F]">
                  Ineligible Subjects ({status.ineligibleSubjects?.length})
                </p>
                <div className="grid gap-2">
                  {status.ineligibleSubjects?.map((s) => (
                    <div key={s.subjectId} className="rounded border border-[#F5E6E6] bg-surface p-4 opacity-70">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{s.subjectName || "—"}</p>
                          <p className="text-xs text-text-muted">{s.subjectCode || "—"}</p>
                          {s.reasons?.map((r, i) => (
                            <p key={i} className="text-xs text-[#8B2F2F] mt-0.5">• {r}</p>
                          ))}
                        </div>
                        <span className="rounded px-2 py-0.5 text-xs font-medium bg-[#F5E6E6] text-[#8B2F2F]">
                          {s.attendancePct != null ? `${s.attendancePct}%` : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            {selectedIds.length > 0 && (
              <div className="rounded border border-[#1C1810] bg-cream-100 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{selectedIds.length} subject{selectedIds.length > 1 ? "s" : ""} selected</p>
                  <p className="text-xs text-text-muted">Registration cannot be undone after submission.</p>
                </div>
                <Button
                  onClick={handleRegister}
                  disabled={submitReg.isPending}
                >
                  {submitReg.isPending ? "Registering…" : "Submit Registration"}
                </Button>
              </div>
            )}

            {submitReg.isError && (
              <p className="text-sm text-[#8B2F2F]">{(submitReg.error as Error).message}</p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
