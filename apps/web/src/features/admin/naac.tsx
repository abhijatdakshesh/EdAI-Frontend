"use client";

import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";

interface NAACCriterion {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  lastUpdated: string;
  trend: "UP" | "DOWN" | "STABLE";
}

interface NAACMetrics {
  overallScore: number;
  grade: string;
  lastAssessed: string;
  criteria: NAACCriterion[];
  strengths: string[];
  areasForImprovement: string[];
  upcomingAuditDate?: string;
}

const trendIcon = { UP: "↑", DOWN: "↓", STABLE: "→" };
const trendColor = { UP: "text-[#3D6B4F]", DOWN: "text-[#8B2F2F]", STABLE: "text-[#6B6358]" };

export function NaacIntelligence() {
  const { data: metrics, isLoading, error } = useQuery<NAACMetrics>({
    queryKey: ["naac-metrics"],
    queryFn: () => apiGet<NAACMetrics>("/api/admin/naac/metrics"),
    staleTime: 300_000,
  });

  return (
    <AppShell title="NAAC Intelligence">
      <div className="grid gap-5">
        {error && (
          <p className="rounded bg-[#F5E6E6] px-4 py-3 text-sm text-[#8B2F2F]">
            Failed to load NAAC metrics. {(error as Error).message}
          </p>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded border border-border bg-surface h-20" />
            ))}
          </div>
        )}

        {metrics && (
          <>
            {/* Overall score */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Overall Score", value: `${metrics.overallScore}/4.0`, warn: metrics.overallScore < 3 },
                { label: "Grade", value: metrics.grade, warn: false },
                { label: "Last Assessed", value: metrics.lastAssessed, warn: false },
                {
                  label: "Next Audit",
                  value: metrics.upcomingAuditDate ?? "Not scheduled",
                  warn: !!metrics.upcomingAuditDate,
                },
              ].map((s) => (
                <div key={s.label} className={cn("rounded border-l-4 bg-surface p-4",
                  s.warn ? "border-l-[#8B6914]" : "border-l-[#3D6B4F]")}>
                  <p className="label-track">{s.label}</p>
                  <p className="mt-1 text-2xl font-light">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Criteria breakdown */}
            <div>
              <p className="label-track mb-3">Criteria Scores</p>
              <div className="grid gap-2">
                {metrics.criteria.map((c) => {
                  const pct = (c.score / c.maxScore) * 100;
                  return (
                    <div key={c.id} className="rounded border border-border bg-surface p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-text-muted">Last updated {c.lastUpdated}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{c.score}/{c.maxScore}</span>
                          <span className={cn("ml-2 text-sm font-medium", trendColor[c.trend])}>
                            {trendIcon[c.trend]}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-cream-200">
                        <div
                          className={cn("h-2 rounded-full",
                            pct >= 70 ? "bg-[#3D6B4F]" : pct >= 50 ? "bg-[#8B6914]" : "bg-[#8B2F2F]")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {/* Strengths */}
              <div>
                <p className="label-track mb-2">Strengths</p>
                <ul className="grid gap-1">
                  {metrics.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm rounded border border-[#EBF3EE] bg-[#EBF3EE]/30 p-3">
                      <span className="text-[#3D6B4F] mt-0.5">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for improvement */}
              <div>
                <p className="label-track mb-2">Areas for Improvement</p>
                <ul className="grid gap-1">
                  {metrics.areasForImprovement.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm rounded border border-[#F5EDDB] bg-[#F5EDDB]/30 p-3">
                      <span className="text-[#8B6914] mt-0.5">!</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
