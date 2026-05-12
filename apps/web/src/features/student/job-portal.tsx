"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/use-auth";
import { useJobs, useAppliedJobs, useApplyToJob, type Job } from "@/lib/api/jobs";

/**
 * r19 — All / Eligible / Applied tabs were not filtering correctly. The
 * old code treated "eligible" as a synonym for `j.active`, which meant
 * Eligible == Active and the buckets were indistinguishable from "All".
 * Eligible should now mean: drive is active AND the student satisfies
 * advertised CGPA + department targeting.
 */
function isEligible(
  job: Job,
  opts: { cgpa: number | undefined; dept: string | undefined },
): boolean {
  if (!job.active) return false;
  if (job.minCgpa != null && opts.cgpa != null && opts.cgpa < job.minCgpa) return false;
  if (job.targetDepts && job.targetDepts.length > 0 && opts.dept) {
    if (!job.targetDepts.includes(opts.dept)) return false;
  }
  return true;
}

export function JobPortal() {
  const { session } = useAuth();
  const studentCgpa = (session?.user as { cgpa?: number } | undefined)?.cgpa;
  const studentDept = (session?.user as { department?: string } | undefined)?.department;

  const [filter, setFilter] = useState<"all" | "eligible" | "applied">("all");
  const [applyMsg, setApplyMsg] = useState<Record<string, string>>({});

  const { data: jobs = [], isLoading: loadingJobs } = useJobs();
  const { data: applications = [] } = useAppliedJobs();
  const applyMutation = useApplyToJob();

  const appliedJobIds = new Set(applications.map((a) => a.jobId));
  const eligibilityOpts = { cgpa: studentCgpa, dept: studentDept };

  const filtered = jobs.filter((j) => {
    if (filter === "applied") return appliedJobIds.has(j.id);
    if (filter === "eligible") return isEligible(j, eligibilityOpts);
    return true;
  });

  const eligibleCount = jobs.filter((j) => isEligible(j, eligibilityOpts)).length;

  async function handleApply(jobId: string) {
    setApplyMsg((m) => ({ ...m, [jobId]: "" }));
    try {
      await applyMutation.mutateAsync(jobId);
      setApplyMsg((m) => ({ ...m, [jobId]: "Applied!" }));
    } catch {
      setApplyMsg((m) => ({ ...m, [jobId]: "Failed. Try again." }));
    }
  }

  return (
    <AppShell title="Job Portal">
      <div className="grid gap-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active Drives", value: jobs.filter((j) => j.active).length },
            { label: "Eligible For", value: eligibleCount },
            { label: "Applied", value: applications.length },
          ].map((s) => (
            <div key={s.label} className="rounded border border-border bg-surface p-4">
              <p className="label-track">{s.label}</p>
              <p className="text-3xl font-light mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "eligible", "applied"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("rounded border px-4 py-2 text-sm capitalize transition-colors",
                filter === f ? "border-[#1C1810] bg-[#1C1810] text-[#F2EFE9]" : "border-border hover:border-[#1C1810]")}>
              {f}
            </button>
          ))}
        </div>

        {loadingJobs ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 rounded border border-border bg-surface animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded border border-dashed border-border p-10 text-center text-sm text-text-muted">
            No {filter !== "all" ? filter : ""} jobs found.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((j) => {
              const alreadyApplied = appliedJobIds.has(j.id);
              const msg = applyMsg[j.id];
              return (
                <div key={j.id} className={cn("rounded border p-4 bg-surface", !j.active && "opacity-70")}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{j.company}</p>
                      <p className="text-sm text-text-muted">{j.role}</p>
                    </div>
                    <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                      j.type === "INTERNSHIP" ? "bg-[#E6EEF5] text-[#2F567A]" : "bg-[#EBF3EE] text-[#3D6B4F]")}>
                      {j.type?.replace("_", " ") ?? ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-text-muted mb-3">
                    {j.package && <span>💰 {j.package}</span>}
                    <span>📅 Deadline: {j.deadline}</span>
                    {j.minCgpa && <span>🎓 CGPA ≥ {j.minCgpa}</span>}
                    {j.location && <span>📍 {j.location}</span>}
                  </div>
                  {j.targetDepts && j.targetDepts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {j.targetDepts.map((b) => <span key={b} className="rounded bg-cream-100 px-2 py-0.5 text-xs">{b}</span>)}
                    </div>
                  )}
                  {j.active ? (
                    alreadyApplied || msg === "Applied!" ? (
                      <p className="text-xs text-[#3D6B4F] font-medium">✓ Application Submitted</p>
                    ) : (
                      <div className="grid gap-1">
                        <Button size="sm" className="w-full"
                          onClick={() => void handleApply(j.id)}
                          disabled={applyMutation.isPending}>
                          {applyMutation.isPending ? "Applying…" : "Apply Now"}
                        </Button>
                        {msg && <p className="text-xs text-[#8B2F2F] text-center">{msg}</p>}
                      </div>
                    )
                  ) : (
                    <p className="text-xs text-[#8B2F2F]">Drive not active</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
