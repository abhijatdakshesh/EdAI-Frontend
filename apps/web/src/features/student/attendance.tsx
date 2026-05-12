"use client";

import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/use-auth";
import { useStudentAttendance } from "@/lib/api/attendance";
import { formatCourseCode } from "@/lib/format/course-code";

export function MyAttendance() {
  const { session } = useAuth();
  const usn = session?.user?.sapId ?? session?.user?.id ?? "";

  const { data: courses = [], isLoading, error } = useStudentAttendance(usn);

  const overall = courses.length > 0
    ? Math.round(courses.reduce((a, c) => a + c.pct, 0) / courses.length)
    : 0;

  return (
    <AppShell title="Attendance">
      <div className="grid gap-5">
        {error && (
          <p className="rounded bg-[#F5E6E6] px-4 py-3 text-sm text-[#8B2F2F]">
            Failed to load attendance: {(error as Error).message}
          </p>
        )}

        {/* Overall gauge */}
        {(isLoading || courses.length > 0) && (
          <div className={cn("rounded border-l-4 bg-surface p-5",
            isLoading ? "border-l-border animate-pulse"
            : overall >= 85 ? "border-l-[#3D6B4F]"
            : overall >= 75 ? "border-l-[#8B6914]"
            : "border-l-[#8B2F2F]")}>
            <div className="flex items-center justify-between mb-2">
              <p className="label-track">Overall Attendance</p>
              <p className="text-4xl font-light">{isLoading ? "—" : `${overall}%`}</p>
            </div>
            {!isLoading && (
              <>
                <div className="h-3 rounded-full bg-cream-200">
                  <div className={cn("h-3 rounded-full transition-all",
                    overall >= 85 ? "bg-[#3D6B4F]"
                    : overall >= 75 ? "bg-[#8B6914]"
                    : "bg-[#8B2F2F]")}
                    style={{ width: `${overall}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-xs text-text-muted">
                  <span>0%</span>
                  <span className="text-[#8B2F2F]">75% (min)</span>
                  <span>100%</span>
                </div>
                {overall < 75 && (
                  <p className="mt-2 text-sm text-[#8B2F2F] font-medium">
                    Below minimum attendance! Risk of detention.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Course-wise */}
        <div>
          <p className="label-track mb-3">Course-wise Attendance</p>
          {isLoading ? (
            <div className="grid gap-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded border border-border bg-surface h-20" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
              No attendance records found.
            </p>
          ) : (
            <div className="grid gap-3">
              {courses.map((c) => (
                <div key={c.courseId} className="rounded border border-border bg-surface p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{c.courseName}</p>
                      {/* r14 — apply CS5-01 formatting consistently. */}
                      <p className="text-xs text-text-muted">{formatCourseCode(c.courseCode)}</p>
                    </div>
                    <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                      c.pct >= 85 ? "bg-[#EBF3EE] text-[#3D6B4F]"
                      : c.pct >= 75 ? "bg-[#F5EDDB] text-[#8B6914]"
                      : "bg-[#F5E6E6] text-[#8B2F2F]")}>
                      {c.pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-cream-200">
                    <div className={cn("h-2 rounded-full",
                      c.pct >= 85 ? "bg-[#3D6B4F]"
                      : c.pct >= 75 ? "bg-[#8B6914]"
                      : "bg-[#8B2F2F]")}
                      style={{ width: `${c.pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-text-muted">
                    <span>{c.attended} / {c.totalClasses} classes</span>
                    {c.mustAttend > 0
                      ? <span className="text-[#8B2F2F]">Attend next {c.mustAttend} to reach 75%</span>
                      /* r13 — phrased positively as a "do-not-miss" instruction. */
                      : <span className="text-[#3D6B4F]">{c.canMiss} class buffer remaining; do not miss further</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
