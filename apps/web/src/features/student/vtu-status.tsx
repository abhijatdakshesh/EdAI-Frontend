"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActiveVTUWindow, useMyVTUStatus, useSubmitVTURegistration } from "@/lib/api/vtu";

function AttendanceBar({ pct }: { pct: number }) {
  const safe = typeof pct === "number" && !isNaN(pct) ? pct : 0;
  const color = safe >= 75 ? "#3D6B4F" : safe >= 60 ? "#8B6914" : "#8B2F2F";
  const bg = safe >= 75 ? "#EBF3EE" : safe >= 60 ? "#F5EDDB" : "#F5E6E6";
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full bg-cream-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(safe, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="rounded px-1.5 py-0.5 text-xs font-medium tabular-nums"
        style={{ background: bg, color }}
      >
        {safe > 0 ? `${safe}%` : "—"}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    REGISTERED: { label: "Registered", bg: "#EBF3EE", color: "#3D6B4F" },
    SUBMITTED:  { label: "Submitted",  bg: "#EBF3EE", color: "#3D6B4F" },
    CONFIRMED:  { label: "Confirmed",  bg: "#EBF3EE", color: "#3D6B4F" },
    ELIGIBLE:   { label: "Eligible",   bg: "#E6EEF5", color: "#2F567A" },
    INELIGIBLE: { label: "Ineligible", bg: "#F5E6E6", color: "#8B2F2F" },
    NOT_STARTED:{ label: "Not Started",bg: "#F5EDDB", color: "#8B6914" },
  };
  const s = map[status] ?? { label: status, bg: "#F5F5F0", color: "#6B6B5A" };
  return (
    <span className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export function VTUStatus() {
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

  /* ── No active window ─────────────────────────────────────────────────────── */
  if (!window) {
    return (
      <AppShell title="VTU Registration">
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-cream-200 flex items-center justify-center text-2xl">📋</div>
          <div>
            <p className="font-medium text-base">No Open Registration Window</p>
            <p className="text-sm text-text-muted mt-1">No VTU registration window is currently open. Check back later.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const isRegistered =
    submitted ||
    status?.status === "REGISTERED" ||
    status?.status === "SUBMITTED" ||
    status?.status === "CONFIRMED";

  const allSubjects = [
    ...(status?.eligibleSubjects ?? []),
    ...(status?.ineligibleSubjects ?? []),
  ];

  /* ── Registered / Confirmed view ─────────────────────────────────────────── */
  if (isRegistered) {
    return (
      <AppShell title="VTU Registration">
        <div className="grid gap-5 max-w-2xl">
          {/* Success banner */}
          <div className="rounded-xl border border-[#3D6B4F]/20 bg-gradient-to-br from-[#EBF3EE] to-[#F5FAF7] p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#3D6B4F]/10 flex items-center justify-center text-xl shrink-0">✓</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-[#3D6B4F] text-base">Registration {status?.status ?? "Submitted"}</p>
                <StatusPill status={status?.status ?? "REGISTERED"} />
              </div>
              <p className="text-sm text-[#3D6B4F]/80 mt-1">
                Your VTU exam registration has been recorded for <strong>{window.title}</strong>.
              </p>
              {status?.submittedAt && (
                <p className="text-xs text-text-muted mt-1">
                  Submitted on {new Date(status.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          </div>

          {/* Window meta */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Exam", value: window.examMonth },
              { label: "Opened", value: window.openDate },
              { label: "Closed", value: window.closeDate },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-surface p-3">
                <p className="label-track text-xs">{m.label}</p>
                <p className="mt-1 text-sm font-medium">{m.value ?? "—"}</p>
              </div>
            ))}
          </div>

          {/* Subject cards */}
          {status && allSubjects.length > 0 && (
            <div>
              <p className="label-track mb-3">Subjects ({allSubjects.length})</p>
              <div className="grid gap-2">
                {allSubjects.map((s) => (
                  <div
                    key={s.subjectId}
                    className={cn(
                      "rounded-lg border p-4 flex items-center gap-4",
                      s.eligible
                        ? "border-[#3D6B4F]/20 bg-[#F5FAF7]"
                        : "border-[#8B2F2F]/15 bg-[#FDF5F5] opacity-80",
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {s.subjectName || <span className="text-text-muted italic">Subject name unavailable</span>}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {s.subjectCode || "—"}
                        {s.backlogs > 0 && (
                          <span className="ml-2 text-[#8B6914]">· {s.backlogs} backlog{s.backlogs > 1 ? "s" : ""}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <AttendanceBar pct={s.attendancePct} />
                      <div className="w-20 text-right">
                        {s.eligible
                          ? <span className="text-xs font-medium text-[#3D6B4F]">✓ Eligible</span>
                          : <span className="text-xs font-medium text-[#8B2F2F]">✗ Ineligible</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status && allSubjects.length === 0 && (
            <p className="text-sm text-text-muted">No subject data available from the backend.</p>
          )}
        </div>
      </AppShell>
    );
  }

  /* ── Registration open view ───────────────────────────────────────────────── */
  return (
    <AppShell title="VTU Registration">
      <div className="grid gap-5 max-w-2xl">

        {/* Window banner */}
        <div className="rounded-xl border border-[#2F567A]/20 bg-gradient-to-br from-[#E6EEF5] to-[#F0F5FA] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[#2F567A] text-base">{window.title}</p>
              <p className="text-xs text-[#2F567A]/70 mt-1">
                Exam: <strong>{window.examMonth}</strong> · Opens: {window.openDate} · Closes: {window.closeDate}
              </p>
            </div>
            {status && <StatusPill status={status.status} />}
          </div>
        </div>

        {/* Eligibility rules */}
        {window.eligibilityRules && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Min Attendance", value: `${window.eligibilityRules.minAttendancePct}%`, icon: "📊" },
              { label: "Max Backlogs",   value: String(window.eligibilityRules.maxBacklogs),    icon: "📚" },
              { label: "Fee Clearance",  value: window.eligibilityRules.feeClearance ? "Required" : "Not required", icon: "💳" },
            ].map((r) => (
              <div key={r.label} className="rounded-lg border border-border bg-surface p-3 text-center">
                <p className="text-base mb-1">{r.icon}</p>
                <p className="label-track text-xs">{r.label}</p>
                <p className="mt-1 font-semibold text-sm">{r.value}</p>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-surface h-16 animate-pulse" />
            ))}
          </div>
        ) : !status ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-text-muted">No eligibility data found. Contact the admin.</p>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Eligible",   value: status.eligibleSubjects?.length ?? 0,   color: "#3D6B4F", bg: "#EBF3EE" },
                { label: "Ineligible", value: status.ineligibleSubjects?.length ?? 0,  color: "#8B2F2F", bg: "#F5E6E6" },
                { label: "Selected",   value: selectedIds.length,                       color: "#2F567A", bg: "#E6EEF5" },
                { label: "Total",      value: (status.eligibleSubjects?.length ?? 0) + (status.ineligibleSubjects?.length ?? 0), color: "#6B6B5A", bg: "#F5F5F0" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-surface p-3 text-center">
                  <p className="label-track text-xs">{s.label}</p>
                  <p className="text-2xl font-light mt-1" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Eligible subjects */}
            {(status.eligibleSubjects?.length ?? 0) > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#3D6B4F]" />
                  <p className="label-track text-[#3D6B4F]">
                    Eligible Subjects ({status.eligibleSubjects.length})
                  </p>
                </div>
                <div className="grid gap-2">
                  {status.eligibleSubjects.map((s) => {
                    const selected = selectedIds.includes(s.subjectId);
                    return (
                      <label
                        key={s.subjectId}
                        className={cn(
                          "flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-all",
                          selected
                            ? "border-[#1C1810] bg-cream-100 shadow-sm"
                            : "border-border bg-surface hover:border-[#3D6B4F]/50 hover:bg-[#F5FAF7]",
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                          selected ? "border-[#1C1810] bg-[#1C1810]" : "border-border bg-white",
                        )}>
                          {selected && <span className="text-white text-xs leading-none">✓</span>}
                        </div>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selected}
                          onChange={() => toggleSubject(s.subjectId)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {s.subjectName || <span className="italic text-text-muted">Unnamed subject</span>}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">{s.subjectCode || "—"}</p>
                        </div>
                        <AttendanceBar pct={s.attendancePct} />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ineligible subjects */}
            {(status.ineligibleSubjects?.length ?? 0) > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#8B2F2F]" />
                  <p className="label-track text-[#8B2F2F]">
                    Ineligible Subjects ({status.ineligibleSubjects?.length})
                  </p>
                </div>
                <div className="grid gap-2">
                  {status.ineligibleSubjects?.map((s) => (
                    <div
                      key={s.subjectId}
                      className="rounded-lg border border-[#8B2F2F]/15 bg-[#FDF5F5] p-4 opacity-75"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {s.subjectName || <span className="italic text-text-muted">Unnamed subject</span>}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">{s.subjectCode || "—"}</p>
                          {s.reasons?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {s.reasons.map((r, i) => (
                                <span key={i} className="rounded px-2 py-0.5 text-xs bg-[#F5E6E6] text-[#8B2F2F]">
                                  {r}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <AttendanceBar pct={s.attendancePct} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit footer */}
            {selectedIds.length > 0 && (
              <div className="rounded-xl border border-[#1C1810] bg-cream-100 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">
                    {selectedIds.length} subject{selectedIds.length > 1 ? "s" : ""} selected
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Registration cannot be undone after submission.</p>
                </div>
                <Button onClick={handleRegister} disabled={submitReg.isPending}>
                  {submitReg.isPending ? "Registering…" : "Submit Registration"}
                </Button>
              </div>
            )}

            {submitReg.isError && (
              <p className="text-sm text-[#8B2F2F] rounded border border-[#F5E6E6] bg-[#FDF5F5] px-4 py-2">
                {(submitReg.error as Error).message}
              </p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
