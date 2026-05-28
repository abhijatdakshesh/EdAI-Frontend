"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCourses } from "@/lib/api/academics";
import { useStudentAttendance } from "@/lib/api/attendance";
import { useAuth } from "@/lib/auth/use-auth";
import { apiGet, apiPost, apiDelete } from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCourseCode, formatCourseLine } from "@/lib/format/course-code";

export function MyCourses() {
  const { session } = useAuth();
  const usn = session?.user?.sapId ?? session?.user?.id ?? "";
  const qc = useQueryClient();

  const { data: allCourses = [], isLoading: loadingCourses } = useCourses();
  const { data: attendance = [] } = useStudentAttendance(usn);
  const { data: enrolledData } = useQuery<{ courseIds: string[] }>({
    queryKey: ["student", "enrollments", usn],
    queryFn: () => apiGet<{ courseIds: string[] }>("/api/student/courses"),
    enabled: !!usn,
  });
  const { data: learnData } = useQuery({
    queryKey: ["student", "learn", "courses"],
    queryFn: () => apiGet<{ courses: Array<{ id: string; code: string; hasLms: boolean; learnUrl: string }> }>(
      "/api/student/learn/courses",
    ),
    enabled: !!usn,
  });
  const lmsByCourseId = useMemo(
    () => new Map((learnData?.courses ?? []).map((c) => [c.id, c])),
    [learnData],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const enrolledSet = useMemo(() => new Set(enrolledData?.courseIds ?? []), [enrolledData]);
  const attMap = useMemo(() => Object.fromEntries(attendance.map((a) => [a.courseId, a])), [attendance]);

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => apiPost(`/api/student/courses/${courseId}/enroll`, {}),
    onMutate: async (courseId) => {
      await qc.cancelQueries({ queryKey: ["student", "enrollments", usn] });
      const prev = qc.getQueryData<{ courseIds: string[] }>(["student", "enrollments", usn]);
      qc.setQueryData<{ courseIds: string[] }>(["student", "enrollments", usn], {
        courseIds: Array.from(new Set([...(prev?.courseIds ?? []), courseId])),
      });
      return { prev };
    },
    onError: (_err, _courseId, ctx) => {
      if (ctx?.prev) qc.setQueryData(["student", "enrollments", usn], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["student", "enrollments", usn] }),
  });

  const unenrollMutation = useMutation({
    mutationFn: (courseId: string) => apiDelete(`/api/student/courses/${courseId}/enroll`),
    onMutate: async (courseId) => {
      await qc.cancelQueries({ queryKey: ["student", "enrollments", usn] });
      const prev = qc.getQueryData<{ courseIds: string[] }>(["student", "enrollments", usn]);
      qc.setQueryData<{ courseIds: string[] }>(["student", "enrollments", usn], {
        courseIds: (prev?.courseIds ?? []).filter((id) => id !== courseId),
      });
      return { prev };
    },
    onError: (_err, _courseId, ctx) => {
      if (ctx?.prev) qc.setQueryData(["student", "enrollments", usn], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["student", "enrollments", usn] }),
  });

  const isEnrolledFor = useCallback(
    (courseId: string) => enrolledSet.has(courseId) || !!attMap[courseId],
    [enrolledSet, attMap],
  );

  const pending = enrollMutation.isPending
    ? { id: enrollMutation.variables as string, action: "enroll" as const }
    : unenrollMutation.isPending
    ? { id: unenrollMutation.variables as string, action: "unenroll" as const }
    : null;

  const handleEnroll = (courseId: string) => enrollMutation.mutate(courseId);
  const handleUnenroll = (courseId: string) => unenrollMutation.mutate(courseId);

  const filtered = allCourses.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()),
  );

  const selected = allCourses.find((c) => c.id === selectedId);
  const selectedAtt = selected ? attMap[selected.id] : undefined;

  return (
    <AppShell title="Courses">
      <div className="grid gap-5">
        <input
          placeholder="Search courses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none max-w-sm"
        />

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          {/* Course list */}
          {loadingCourses ? (
            <div className="grid gap-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => <div key={i} className="rounded border border-border bg-surface h-20" />)}
            </div>
          ) : (
            <div className="grid gap-2">
              {filtered.map((c) => {
                const att = attMap[c.id];
                const isEnrolled = isEnrolledFor(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "rounded border p-4 text-left transition-colors",
                      selectedId === c.id
                        ? "border-[#1C1810] bg-cream-100"
                        : "border-border bg-surface hover:border-[#1C1810]",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{c.name}</p>
                          {isEnrolled && (
                            <span className="rounded bg-[#EBF3EE] px-2 py-0.5 text-xs text-[#3D6B4F]">Enrolled</span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          {/* r12 — render as "CS5-01 - 4 Credits"; replaces legacy "CS501--4cr". */}
                          {formatCourseLine(c.code, c.credits)} · {c.type}
                        </p>
                      </div>
                      {att && (
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                          att.pct >= 85 ? "bg-[#EBF3EE] text-[#3D6B4F]"
                          : att.pct >= 75 ? "bg-[#F5EDDB] text-[#8B6914]"
                          : "bg-[#F5E6E6] text-[#8B2F2F]")}>
                          {att.pct}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-text-muted">No courses found.</p>
              )}
            </div>
          )}

          {/* Detail panel */}
          {selected && (
            <div className="rounded border border-border bg-surface p-5 self-start sticky top-4">
              <p className="label-track">Course Details</p>
              <h3 className="mt-2 text-xl font-medium">{selected.name}</h3>
              <p className="text-sm text-text-muted">{formatCourseCode(selected.code)}</p>
              <span className="ray-rule ml-0" />

              <dl className="grid gap-3 text-sm">
                <div><dt className="label-track text-xs">Type</dt><dd>{selected.type} · {selected.credits} Credits</dd></div>
                <div><dt className="label-track text-xs">Department</dt><dd>{selected.departmentCode}</dd></div>
                <div><dt className="label-track text-xs">Semester</dt><dd>{selected.semester}</dd></div>
                {selected.syllabusUrl && (
                  <div>
                    <dt className="label-track text-xs">Syllabus</dt>
                    <dd>
                      <a href={selected.syllabusUrl} target="_blank" rel="noreferrer"
                        className="text-[#2F567A] hover:underline">Download PDF</a>
                    </dd>
                  </div>
                )}

                {selectedAtt && (
                  <div>
                    <dt className="label-track text-xs mb-1">Attendance</dt>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-cream-200">
                        <div className={cn("h-2 rounded-full",
                          selectedAtt.pct >= 75 ? "bg-[#3D6B4F]" : "bg-[#8B2F2F]")}
                          style={{ width: `${selectedAtt.pct}%` }} />
                      </div>
                      <span className="text-sm font-medium">{selectedAtt.pct}%</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {selectedAtt.attended}/{selectedAtt.totalClasses} classes attended
                    </p>
                  </div>
                )}
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                {isEnrolledFor(selected.id) && lmsByCourseId.get(selected.id)?.hasLms && (
                  <Button size="sm" asChild>
                    <Link href={lmsByCourseId.get(selected.id)!.learnUrl}>Open Learn</Link>
                  </Button>
                )}
                {isEnrolledFor(selected.id) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[#8B2F2F] border-[#8B2F2F] hover:bg-[#F5E6E6]"
                    disabled={pending?.id === selected.id && pending.action === "unenroll"}
                    onClick={() => void handleUnenroll(selected.id)}
                  >
                    {pending?.id === selected.id && pending.action === "unenroll" ? "Unenrolling…" : "Unenroll"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={pending?.id === selected.id && pending.action === "enroll"}
                    onClick={() => void handleEnroll(selected.id)}
                  >
                    {pending?.id === selected.id && pending.action === "enroll" ? "Enrolling…" : "Enroll"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
