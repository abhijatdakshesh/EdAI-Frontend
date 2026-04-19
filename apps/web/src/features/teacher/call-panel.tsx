"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAtRiskStudents } from "@/lib/api/attendance";
import { useRecentCallLogs, useTriggerCall, useSendSms } from "@/lib/api/comms";
import { useClasses } from "@/lib/api/academics";

// Teacher's class — Phase 2: from session (faculty's assigned classes)
const DEFAULT_CLASS_ID = "cls-cse6a";

export function ManualCallPanel() {
  const [classId, setClassId] = useState(DEFAULT_CLASS_ID);
  const [triggering, setTriggering] = useState<string | null>(null);

  const { data: classes = [] } = useClasses();
  const { data: atRiskStudents = [], isLoading: loadingAtRisk } = useAtRiskStudents(classId);
  const { data: recentCalls = [], isLoading: loadingCalls } = useRecentCallLogs();
  const triggerCall = useTriggerCall();
  const sendSms = useSendSms();

  function handleCall(student: { usn: string; name: string; parentPhone: string }) {
    setTriggering(student.usn);
    triggerCall.mutate(
      {
        studentUsn: student.usn,
        parentPhone: student.parentPhone,
        reason: "LOW_ATTENDANCE",
        language: "kn", // default Kannada for RV Trust
      },
      { onSettled: () => setTriggering(null) },
    );
  }

  function handleSms(student: { usn: string; name: string; parentPhone: string; pct: number }) {
    sendSms.mutate({
      to: student.parentPhone,
      message: `Dear Parent, ${student.name}'s attendance has dropped to ${student.pct}%. Please ensure regular attendance. Minimum 75% required. — RV College`,
      studentUsn: student.usn,
    });
  }

  return (
    <AppShell title="Call Panel">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Left: At-risk students */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="label-track">
              Students Below 75% Attendance
              {!loadingAtRisk && atRiskStudents.length > 0 && (
                <span className="ml-2 rounded bg-[#F5E6E6] px-2 py-0.5 text-xs font-medium text-[#8B2F2F]">
                  {atRiskStudents.length} students
                </span>
              )}
            </p>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="rounded border border-border bg-white px-2 py-1 text-xs focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {loadingAtRisk && (
            <div className="grid gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded border border-border bg-surface p-4 h-20 animate-pulse" />
              ))}
            </div>
          )}

          {!loadingAtRisk && atRiskStudents.length === 0 && (
            <div className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
              No at-risk students in this class. All above 75%.
            </div>
          )}

          <div className="grid gap-2">
            {atRiskStudents.map((s) => (
              <div key={s.usn} className="rounded border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-text-muted">{s.usn}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Parent: {s.parentPhone}
                      {s.lastCallDate && ` · Last call: ${s.lastCallDate}`}
                    </p>
                    {s.consecutiveAbsences > 0 && (
                      <p className="text-xs text-[#8B2F2F] mt-0.5">
                        ⚠️ {s.consecutiveAbsences} consecutive absences
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="rounded px-2 py-0.5 text-xs font-medium bg-[#F5E6E6] text-[#8B2F2F]">
                      {s.pct}%
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        disabled={triggering === s.usn || triggerCall.isPending}
                        onClick={() =>
                          handleCall({ usn: s.usn, name: s.name, parentPhone: s.parentPhone })
                        }
                      >
                        {triggering === s.usn ? "Calling…" : "📞 Call"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() =>
                          handleSms({ usn: s.usn, name: s.name, parentPhone: s.parentPhone, pct: s.pct })
                        }
                      >
                        SMS
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent call log */}
        <div>
          <p className="label-track mb-3">Recent AI Call Log</p>
          {loadingCalls ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : (
            <div className="grid gap-2">
              {recentCalls.length === 0 && (
                <p className="text-sm text-text-muted">No calls today.</p>
              )}
              {recentCalls.map((c) => (
                <div key={c.id} className="rounded border border-border bg-surface p-3">
                  <div className="flex justify-between mb-0.5">
                    <p className="text-sm font-medium">{c.studentName}</p>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-medium",
                        c.outcome === "ANSWERED"
                          ? "bg-[#EBF3EE] text-[#3D6B4F]"
                          : "bg-[#F5E6E6] text-[#8B2F2F]",
                      )}
                    >
                      {c.outcome}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {new Date(c.calledAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {c.duration}s · {c.language.toUpperCase()}
                  </p>
                  {c.summary && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {c.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          <Button size="sm" variant="outline" className="w-full mt-3">
            View Full History
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
