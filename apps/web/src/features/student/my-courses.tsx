"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCourses } from "@/lib/api/academics";
import { useStudentAttendance } from "@/lib/api/attendance";
import { useAuth } from "@/lib/auth/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiDelete } from "@/lib/api/client";

export function MyCourses() {
  const { session } = useAuth();
  const usn = session?.user?.sapId ?? session?.user?.id ?? "";

  const { data: allCourses = [], isLoading: loadingCourses } = useCourses();
  const { data: attendance = [] } = useStudentAttendance(usn);
  const qc = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const enroll = useMutation({
    mutationFn: (courseId: string) =>
      apiPost(`/api/student/courses/${courseId}/enroll`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["attendance", "student"] });
    },
  });

  const unenroll = useMutation({
    mutationFn: (courseId: string) =>
      apiDelete(`/api/student/courses/${courseId}/enroll`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const attMap = Object.fromEntries(attendance.map((a) => [a.courseId, a]));

  const filtered = allCourses.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()),
  );

  const selected = allCourses.find((c) => c.id === selectedId);
  const selectedAtt = selected ? attMap[selected.id] : undefined;

  return (
    <AppShell title="My Courses">
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
                const isEnrolled = !!att;
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
                          {c.code} · {c.type} · {c.credits} cr
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
              <p className="text-sm text-text-muted">{selected.code}</p>
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

              <div className="mt-4">
                {selectedAtt ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[#8B2F2F] border-[#8B2F2F] hover:bg-[#F5E6E6]"
                    disabled={unenroll.isPending}
                    onClick={() => unenroll.mutate(selected.id)}
                  >
                    {unenroll.isPending ? "Unenrolling…" : "Unenroll"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={enroll.isPending}
                    onClick={() => enroll.mutate(selected.id)}
                  >
                    {enroll.isPending ? "Enrolling…" : "Enroll"}
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
