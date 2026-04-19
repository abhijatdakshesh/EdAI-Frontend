"use client";

/**
 * Mark Attendance — Teacher portal
 *
 * Teacher selects class + subject + date, sees all enrolled students,
 * marks each as PRESENT/ABSENT/LATE, and submits.
 * After submission, auto-alerts trigger for students with 3+ consecutive absences.
 */

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClasses, useClassStudents } from "@/lib/api/academics";
import { useMarkAttendance } from "@/lib/api/attendance";

type AttStatus = "PRESENT" | "ABSENT" | "LATE";

const statusConfig: Record<AttStatus, { label: string; color: string; bg: string }> = {
  PRESENT: { label: "P", color: "text-[#3D6B4F]", bg: "bg-[#EBF3EE]" },
  ABSENT: { label: "A", color: "text-[#8B2F2F]", bg: "bg-[#F5E6E6]" },
  LATE: { label: "L", color: "text-[#8B6914]", bg: "bg-[#F5EDDB]" },
};

export function MarkAttendance() {
  const today = new Date().toISOString().slice(0, 10);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("21CS61"); // default — in production: load from course assignment
  const [date, setDate] = useState(today);
  const [period, setPeriod] = useState("1");
  const [submitted, setSubmitted] = useState(false);

  const { data: classes = [] } = useClasses();
  const { data: students = [], isLoading: loadingStudents } = useClassStudents(classId);
  const markAttendance = useMarkAttendance();

  // Student attendance map: usn → status
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttStatus>>({});

  // Initialize when students load
  function initializeAll(status: AttStatus) {
    const map: Record<string, AttStatus> = {};
    students.forEach((s) => {
      map[s.usn] = status;
    });
    setAttendanceMap(map);
  }

  function toggle(usn: string) {
    const current = attendanceMap[usn] ?? "PRESENT";
    const next: AttStatus = current === "PRESENT" ? "ABSENT" : current === "ABSENT" ? "LATE" : "PRESENT";
    setAttendanceMap({ ...attendanceMap, [usn]: next });
  }

  function getStatus(usn: string): AttStatus {
    return attendanceMap[usn] ?? "PRESENT";
  }

  const presentCount = students.filter((s) => getStatus(s.usn) === "PRESENT").length;
  const absentCount = students.filter((s) => getStatus(s.usn) === "ABSENT").length;
  const lateCount = students.filter((s) => getStatus(s.usn) === "LATE").length;

  function handleSubmit() {
    if (!classId || students.length === 0) return;

    const entries = students.map((s) => ({
      studentUsn: s.usn,
      status: getStatus(s.usn),
    }));

    markAttendance.mutate(
      {
        courseId: subjectId,
        classId,
        date,
        entries,
        markedBy: "current-faculty", // Phase 2: from session
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
      },
    );
  }

  if (submitted) {
    return (
      <AppShell title="Mark Attendance">
        <div className="max-w-lg text-center grid gap-4 py-12">
          <p className="text-4xl">✓</p>
          <p className="text-xl font-medium">Attendance Submitted</p>
          <p className="text-sm text-text-muted">
            {presentCount} present · {absentCount} absent · {lateCount} late
            <br />
            {absentCount > 0 &&
              "Parents of absent students will be notified automatically if they have 3+ consecutive absences."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              onClick={() => {
                setSubmitted(false);
                setAttendanceMap({});
                setDate(today);
              }}
            >
              Mark Another
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Mark Attendance">
      <div className="grid gap-5">
        {/* Config row */}
        <div className="flex flex-wrap gap-3 rounded border border-border bg-surface p-4">
          <div className="grid gap-1">
            <span className="text-xs label-track">Class</span>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setAttendanceMap({});
                setSubmitted(false);
              }}
              className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
            >
              <option value="">Select class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <span className="text-xs label-track">Subject Code</span>
            <input
              type="text"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none w-28"
              placeholder="21CS61"
            />
          </div>
          <div className="grid gap-1">
            <span className="text-xs label-track">Date</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
            />
          </div>
          <div className="grid gap-1">
            <span className="text-xs label-track">Period</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
            >
              {["1", "2", "3", "4", "5", "6"].map((p) => (
                <option key={p} value={p}>
                  Period {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {classId && (
          <>
            {/* Summary bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-4 text-sm">
                <span className="text-[#3D6B4F] font-medium">✓ {presentCount} Present</span>
                <span className="text-[#8B2F2F] font-medium">✗ {absentCount} Absent</span>
                {lateCount > 0 && (
                  <span className="text-[#8B6914] font-medium">~ {lateCount} Late</span>
                )}
                <span className="text-text-muted">{students.length} total</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => initializeAll("PRESENT")}>
                  Mark All Present
                </Button>
                <Button size="sm" variant="outline" onClick={() => initializeAll("ABSENT")}>
                  Mark All Absent
                </Button>
              </div>
            </div>

            {/* Tip */}
            <p className="text-xs text-text-muted">
              Click a student to toggle: <strong>P</strong> (Present) → <strong>A</strong> (Absent) → <strong>L</strong> (Late) → P
            </p>

            {/* Student grid */}
            {loadingStudents ? (
              <p className="text-sm text-text-muted">Loading students…</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {students.map((s) => {
                  const status = getStatus(s.usn);
                  const cfg = statusConfig[status];
                  return (
                    <button
                      key={s.usn}
                      onClick={() => toggle(s.usn)}
                      className={cn(
                        "rounded border p-3 text-left transition-all",
                        cfg.bg,
                        "border-transparent hover:border-[#1C1810]",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{s.name}</p>
                        <span className={cn("text-sm font-bold shrink-0 ml-2", cfg.color)}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5 font-mono">{s.usn}</p>
                      {s.attendancePct !== undefined && (
                        <p className={cn("text-xs mt-1",
                          s.attendancePct >= 75 ? "text-[#3D6B4F]" : "text-[#8B2F2F]")}>
                          Overall: {s.attendancePct}%
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Submit */}
            {students.length > 0 && (
              <div className="flex gap-3 pt-2">
                <Button
                  disabled={markAttendance.isPending}
                  onClick={handleSubmit}
                >
                  {markAttendance.isPending
                    ? "Submitting…"
                    : `Submit Attendance (${presentCount}P / ${absentCount}A)`}
                </Button>
              </div>
            )}

            {markAttendance.isError && (
              <p className="text-xs text-[#8B2F2F]">
                Failed: {(markAttendance.error as Error).message}
              </p>
            )}
          </>
        )}

        {!classId && (
          <div className="rounded border border-dashed border-border p-12 text-center text-sm text-text-muted">
            Select a class above to start marking attendance
          </div>
        )}
      </div>
    </AppShell>
  );
}
