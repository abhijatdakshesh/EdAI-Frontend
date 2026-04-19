"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";

const SEMESTER_RESULTS = [
  {
    sem: 5, sgpa: 8.92, totalCredits: 22,
    subjects: [
      { code: "21CS51", name: "Software Engineering", credits: 3, iaMarks: 44, extMarks: 78, total: 122, maxTotal: 150, grade: "A+" },
      { code: "21CS52", name: "Computer Networks", credits: 3, iaMarks: 40, extMarks: 72, total: 112, maxTotal: 150, grade: "A" },
      { code: "21CS53", name: "Database Management", credits: 3, iaMarks: 48, extMarks: 80, total: 128, maxTotal: 150, grade: "O" },
      { code: "21CS54", name: "Operating Systems", credits: 4, iaMarks: 38, extMarks: 70, total: 108, maxTotal: 150, grade: "A" },
      { code: "21CSL55", name: "DBMS Lab", credits: 1, iaMarks: 38, extMarks: 38, total: 76, maxTotal: 100, grade: "A+" },
    ],
  },
  {
    sem: 4, sgpa: 8.45, totalCredits: 21,
    subjects: [
      { code: "21CS41", name: "Design & Analysis of Algorithms", credits: 4, iaMarks: 42, extMarks: 68, total: 110, maxTotal: 150, grade: "A" },
      { code: "21CS42", name: "Microprocessors", credits: 3, iaMarks: 36, extMarks: 64, total: 100, maxTotal: 150, grade: "B+" },
      { code: "21CS43", name: "Theory of Computation", credits: 3, iaMarks: 44, extMarks: 74, total: 118, maxTotal: 150, grade: "A+" },
    ],
  },
];

const gradeColors: Record<string, string> = {
  O: "bg-[#EBF3EE] text-[#3D6B4F]",
  "A+": "bg-[#E6EEF5] text-[#2F567A]",
  A: "bg-[#F0EBF5] text-[#6B2F8B]",
  "B+": "bg-[#F5EDDB] text-[#8B6914]",
  B: "bg-[#F5E6E6] text-[#8B2F2F]",
};

export function ResultsPortal() {
  const [activeSem, setActiveSem] = useState(5);
  const result = SEMESTER_RESULTS.find(r=>r.sem===activeSem);

  const overallCGPA = 8.42;

  return (
    <AppShell title="Results Portal">
      <div className="grid gap-5">
        {/* CGPA summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 rounded border-l-4 border-l-[#3D6B4F] bg-surface p-4">
            <p className="label-track">CGPA</p>
            <p className="text-4xl font-light mt-1">{overallCGPA}<span className="text-base text-text-muted ml-1">/ 10.0</span></p>
            <p className="text-xs text-text-muted mt-0.5">Up to Semester 5</p>
          </div>
          {SEMESTER_RESULTS.map(r=>(
            <div key={r.sem} className="rounded border border-border bg-surface p-4">
              <p className="label-track">Sem {r.sem} SGPA</p>
              <p className="text-2xl font-light mt-1">{r.sgpa}</p>
            </div>
          ))}
        </div>

        {/* Semester selector */}
        <div className="flex gap-2">
          {SEMESTER_RESULTS.map(r=>(
            <button key={r.sem} onClick={()=>setActiveSem(r.sem)}
              className={cn("rounded border px-4 py-2 text-sm transition-colors",
                activeSem===r.sem ? "border-[#1C1810] bg-[#1C1810] text-[#F2EFE9]" : "border-border hover:border-[#1C1810]")}>
              Sem {r.sem}
            </button>
          ))}
        </div>

        {/* Results table */}
        {result && (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead className="bg-cream-200">
                <tr>
                  {["Code","Subject","Credits","IA Marks","External","Total","Grade"].map(h=>(
                    <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.subjects.map(s=>(
                  <tr key={s.code} className="border-t border-border even:bg-cream-50">
                    <td className="px-4 py-2 font-mono text-xs">{s.code}</td>
                    <td className="px-4 py-2 font-medium">{s.name}</td>
                    <td className="px-4 py-2">{s.credits}</td>
                    <td className="px-4 py-2">{s.iaMarks}/50</td>
                    <td className="px-4 py-2">{s.extMarks}/100</td>
                    <td className="px-4 py-2 font-medium">{s.total}/{s.maxTotal}</td>
                    <td className="px-4 py-2">
                      <span className={cn("rounded px-2 py-0.5 text-xs font-medium", gradeColors[s.grade] ?? "bg-cream-100")}>{s.grade}</span>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border bg-cream-100">
                  <td colSpan={2} className="px-4 py-2 font-medium">Semester {result.sem}</td>
                  <td className="px-4 py-2 font-medium">{result.totalCredits}</td>
                  <td colSpan={3} />
                  <td className="px-4 py-2 font-medium">SGPA: {result.sgpa}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Grade legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(gradeColors).map(([g,cls])=>(
            <span key={g} className={cn("rounded px-3 py-1 text-xs font-medium", cls)}>Grade {g}</span>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
