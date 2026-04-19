"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import { useDepartments } from "@/lib/api/academics";

type PlacementLikelihood = "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";

interface PlacementPrediction {
  studentUsn: string;
  studentName: string;
  dept: string;
  semester: number;
  cgpa: number;
  attendancePct: number;
  skillScore: number;
  mockInterviewScore?: number;
  likelihood: PlacementLikelihood;
  predictedPackage?: string;
  matchedCompanies: string[];
  gaps: string[];
}

interface PlacementSummary {
  total: number;
  high: number;
  medium: number;
  low: number;
  veryLow: number;
  avgCgpa: number;
  avgSkillScore: number;
}

const likelihoodStyle: Record<PlacementLikelihood, string> = {
  HIGH: "bg-[#EBF3EE] text-[#3D6B4F]",
  MEDIUM: "bg-[#E6EEF5] text-[#2F567A]",
  LOW: "bg-[#F5EDDB] text-[#8B6914]",
  VERY_LOW: "bg-[#F5E6E6] text-[#8B2F2F]",
};

export function PlacementPredictor() {
  const { data: departments = [] } = useDepartments();
  const [dept, setDept] = useState("");
  const [likelihood, setLikelihood] = useState<PlacementLikelihood | "">("");
  const [search, setSearch] = useState("");

  const { data: predictions = [], isLoading } = useQuery<PlacementPrediction[]>({
    queryKey: ["placement-predictions", dept, likelihood],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dept) params.set("dept", dept);
      if (likelihood) params.set("likelihood", likelihood);
      return apiGet<PlacementPrediction[]>(`/api/admin/placements/predictions?${params.toString()}`);
    },
  });

  const { data: summary } = useQuery<PlacementSummary>({
    queryKey: ["placement-summary"],
    queryFn: () => apiGet<PlacementSummary>("/api/admin/placements/summary"),
    staleTime: 300_000,
  });

  const [selected, setSelected] = useState<PlacementPrediction | null>(null);

  const filtered = predictions.filter((p) =>
    !search || p.studentName.toLowerCase().includes(search.toLowerCase()) || p.studentUsn.includes(search),
  );

  return (
    <AppShell title="Placement Predictor">
      <div className="grid gap-5">
        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {[
              { label: "Total Students", value: summary.total },
              { label: "High Likelihood", value: summary.high },
              { label: "Medium", value: summary.medium },
              { label: "Low", value: summary.low + summary.veryLow },
              { label: "Avg CGPA", value: summary.avgCgpa.toFixed(2) },
              { label: "Avg Skill Score", value: `${summary.avgSkillScore}%` },
            ].map((s) => (
              <div key={s.label} className="rounded border border-border bg-surface p-4">
                <p className="label-track text-xs">{s.label}</p>
                <p className="mt-1 text-2xl font-light">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Search by name or USN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none flex-1 min-w-[200px]"
          />
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
          </select>
          <select
            value={likelihood}
            onChange={(e) => setLikelihood(e.target.value as PlacementLikelihood | "")}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="">All Likelihood</option>
            {(["HIGH", "MEDIUM", "LOW", "VERY_LOW"] as const).map((l) => (
              <option key={l} value={l}>{l.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <div className={cn("grid gap-5", selected ? "lg:grid-cols-[1fr_360px]" : "")}>
          {/* List */}
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead className="bg-cream-200">
                <tr>
                  {["Student", "Dept", "CGPA", "Skills", "Likelihood", "Package", ""].map((h) => (
                    <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-border animate-pulse">
                        {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-3 w-20 rounded bg-cream-200" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtered.map((p) => (
                      <tr key={p.studentUsn} className="border-t border-border even:bg-cream-50 cursor-pointer hover:bg-cream-100"
                        onClick={() => setSelected(p)}>
                        <td className="px-4 py-2">
                          <p className="font-medium">{p.studentName}</p>
                          <p className="text-xs text-text-muted font-mono">{p.studentUsn}</p>
                        </td>
                        <td className="px-4 py-2">{p.dept}</td>
                        <td className="px-4 py-2">{p.cgpa}</td>
                        <td className="px-4 py-2">{p.skillScore}%</td>
                        <td className="px-4 py-2">
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", likelihoodStyle[p.likelihood])}>
                            {p.likelihood.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-text-muted">{p.predictedPackage ?? "—"}</td>
                        <td className="px-4 py-2">
                          <button className="text-xs text-[#2F567A] hover:underline">Details</button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!isLoading && filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-text-muted">
                No students match the current filters.
              </p>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="rounded border border-border bg-surface p-5 self-start sticky top-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="label-track">Student Profile</p>
                  <h3 className="mt-1 text-lg font-medium">{selected.studentName}</h3>
                  <p className="text-xs text-text-muted font-mono">{selected.studentUsn}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-primary">✕</button>
              </div>
              <span className="ray-rule ml-0" />

              <dl className="grid gap-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><dt className="label-track text-xs">CGPA</dt><dd className="font-medium">{selected.cgpa}</dd></div>
                  <div><dt className="label-track text-xs">Attendance</dt><dd>{selected.attendancePct}%</dd></div>
                  <div><dt className="label-track text-xs">Skill Score</dt><dd>{selected.skillScore}%</dd></div>
                  {selected.mockInterviewScore && (
                    <div><dt className="label-track text-xs">Mock Interview</dt><dd>{selected.mockInterviewScore}%</dd></div>
                  )}
                </div>

                <div>
                  <dt className="label-track text-xs mb-1">Likelihood</dt>
                  <dd>
                    <span className={cn("rounded px-2 py-0.5 text-xs font-medium", likelihoodStyle[selected.likelihood])}>
                      {selected.likelihood.replace("_", " ")}
                    </span>
                    {selected.predictedPackage && (
                      <span className="ml-2 text-sm">{selected.predictedPackage}</span>
                    )}
                  </dd>
                </div>

                {selected.matchedCompanies.length > 0 && (
                  <div>
                    <dt className="label-track text-xs mb-1">Matched Companies</dt>
                    <dd className="flex flex-wrap gap-1">
                      {selected.matchedCompanies.map((c) => (
                        <span key={c} className="rounded bg-[#E6EEF5] px-2 py-0.5 text-xs">{c}</span>
                      ))}
                    </dd>
                  </div>
                )}

                {selected.gaps.length > 0 && (
                  <div>
                    <dt className="label-track text-xs mb-1">Skill Gaps</dt>
                    <dd className="grid gap-1">
                      {selected.gaps.map((g) => (
                        <span key={g} className="text-xs text-[#8B6914]">• {g}</span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
