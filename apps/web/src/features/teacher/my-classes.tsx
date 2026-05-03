"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";
import { useClasses, useClassStudents } from "@/lib/api/academics";

export function MyClasses() {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: classes = [], isLoading: loadingClasses } = useClasses();
  const { data: students = [], isLoading: loadingStudents } = useClassStudents(selected ?? "");

  return (
    <AppShell title="My Classes">
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-3">
          {loadingClasses ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded border border-border bg-surface animate-pulse" />
            ))
          ) : classes.length === 0 ? (
            <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
              No classes assigned.
            </p>
          ) : (
            classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(selected === c.id ? null : c.id)}
                className={cn(
                  "rounded border p-4 text-left transition-colors",
                  selected === c.id
                    ? "border-[#1C1810] bg-cream-100"
                    : "border-border bg-surface hover:border-[#1C1810]",
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-text-muted">
                      Sem {c.semester} · Section {c.section} · {c.academicYear}
                    </p>
                  </div>
                  <span className="rounded px-2 py-0.5 text-xs font-medium bg-[#E6EEF5] text-[#2F567A]">
                    {c.strength} students
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {selected ? (
          <div className="rounded border border-border bg-surface p-4 self-start">
            <p className="label-track mb-3">
              Students — {classes.find((c) => c.id === selected)?.name}
            </p>
            {loadingStudents ? (
              <div className="grid gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded bg-cream-200 animate-pulse" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <p className="text-sm text-text-muted">No students enrolled.</p>
            ) : (
              <div className="grid gap-2">
                {students.map((s) => (
                  <div key={s.usn} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-text-muted">{s.usn}</p>
                    </div>
                    {s.attendancePct !== undefined && (
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          s.attendancePct >= 85
                            ? "bg-[#EBF3EE] text-[#3D6B4F]"
                            : s.attendancePct >= 75
                              ? "bg-[#F5EDDB] text-[#8B6914]"
                              : "bg-[#F5E6E6] text-[#8B2F2F]",
                        )}
                      >
                        {s.attendancePct}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted self-start">
            Select a class to view students
          </div>
        )}
      </div>
    </AppShell>
  );
}
