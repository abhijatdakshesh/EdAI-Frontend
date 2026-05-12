"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/use-auth";
import { useStudentResults } from "@/lib/api/marks";
import { formatCourseCode } from "@/lib/format/course-code";

const gradeColors: Record<string, string> = {
  O: "bg-[#EBF3EE] text-[#3D6B4F]",
  "A+": "bg-[#E6EEF5] text-[#2F567A]",
  A: "bg-[#F0EBF5] text-[#6B2F8B]",
  "B+": "bg-[#F5EDDB] text-[#8B6914]",
  B: "bg-[#F5E6E6] text-[#8B2F2F]",
};

export function ResultsPortal() {
  const { session } = useAuth();
  const usn = session?.user?.sapId ?? session?.user?.id ?? "";
  const { data, isLoading, isError } = useStudentResults(usn);

  // r12-results — sort SEM1, SEM2, SEM3… in natural ascending order.
  // Backend sometimes returns the latest semester first; sort defensively here.
  const semesters = [...(data?.semesters ?? [])].sort((a, b) => a.semester - b.semester);
  const [activeSem, setActiveSem] = useState<number | null>(null);
  const latestSem = semesters[semesters.length - 1]?.semester ?? null;
  const currentSem = activeSem ?? latestSem;
  const result = semesters.find((r) => r.semester === currentSem);

  return (
    <AppShell title="Results Portal">
      <div className="grid gap-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => <div key={i} className="rounded border border-border bg-surface p-4 h-20" />)}
          </div>
        ) : isError ? (
          <div className="rounded border border-[#F5E6E6] bg-[#FDF5F5] p-4 text-sm text-[#8B2F2F]">
            Failed to load semester results. Please try again.
          </div>
        ) : !data ? (
          <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            No semester results available yet.
          </p>
        ) : (
          <>
            {/* CGPA summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2 rounded border-l-4 border-l-[#3D6B4F] bg-surface p-4">
                <p className="label-track">CGPA</p>
                <p className="text-4xl font-light mt-1">
                  {data.cgpa.toFixed(2)}
                  <span className="text-base text-text-muted ml-1">/ 10.0</span>
                </p>
                <p className="text-xs text-text-muted mt-0.5">Up to Semester {latestSem ?? "—"}</p>
              </div>
              {semesters.slice(-2).map((r) => (
                <div key={r.semester} className="rounded border border-border bg-surface p-4">
                  <p className="label-track">Sem {r.semester} SGPA</p>
                  <p className="text-2xl font-light mt-1">{r.sgpa}</p>
                </div>
              ))}
            </div>

            {/* Semester selector */}
            <div className="flex gap-2">
              {semesters.map((r) => (
                <button key={r.semester} onClick={() => setActiveSem(r.semester)}
                  className={cn("rounded border px-4 py-2 text-sm transition-colors",
                    currentSem === r.semester ? "border-[#1C1810] bg-[#1C1810] text-[#F2EFE9]" : "border-border hover:border-[#1C1810]")}>
                  Sem {r.semester}
                </button>
              ))}
            </div>

            {/* Results table */}
            {result && (
              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-cream-200">
                    <tr>
                      {["Code", "Subject", "Credits", "IA Marks", "External", "Total", "Grade"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.subjects.map((s) => (
                      <tr key={s.code} className="border-t border-border even:bg-cream-50">
                        <td className="px-4 py-2 font-mono text-xs">{formatCourseCode(s.code)}</td>
                        <td className="px-4 py-2 font-medium">{s.name}</td>
                        <td className="px-4 py-2">{s.credits}</td>
                        <td className="px-4 py-2">{s.ia}/50</td>
                        <td className="px-4 py-2">{s.exam}/100</td>
                        <td className="px-4 py-2 font-medium">{s.total}/150</td>
                        <td className="px-4 py-2">
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", gradeColors[s.grade] ?? "bg-cream-100")}>
                            {s.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border bg-cream-100">
                      <td colSpan={2} className="px-4 py-2 font-medium">Semester {result.semester}</td>
                      <td className="px-4 py-2 font-medium">{result.subjects.reduce((sum, s) => sum + s.credits, 0)}</td>
                      <td colSpan={3} />
                      <td className="px-4 py-2 font-medium">SGPA: {result.sgpa}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Grade legend */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(gradeColors).map(([g, cls]) => (
                <span key={g} className={cn("rounded px-3 py-1 text-xs font-medium", cls)}>Grade {g}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
