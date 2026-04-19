"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const JOBS = [
  { id: "j1", company: "Infosys", role: "Systems Engineer", type: "Full-time", ctc: "4.5 LPA", date: "Jan 18, 2025", eligible: true, cgpa: 7.0, branches: ["CSE","ISE","ECE"], applied: false },
  { id: "j2", company: "Wipro", role: "Software Developer", type: "Full-time", ctc: "3.5 LPA", date: "Jan 22, 2025", eligible: true, cgpa: 6.5, branches: ["CSE","ISE","ECE","EEE"], applied: true },
  { id: "j3", company: "TCS", role: "Digital Trainee", type: "Full-time", ctc: "3.36 LPA", date: "Feb 1, 2025", eligible: true, cgpa: 6.0, branches: ["ALL"], applied: false },
  { id: "j4", company: "Amazon", role: "SDE Intern", type: "Internship", ctc: "₹80K/month", date: "Jan 25, 2025", eligible: false, cgpa: 8.5, branches: ["CSE","ISE"], applied: false },
  { id: "j5", company: "Persistent Systems", role: "Associate Developer", type: "Full-time", ctc: "4.0 LPA", date: "Feb 5, 2025", eligible: true, cgpa: 6.0, branches: ["CSE","ISE","ECE"], applied: false },
];

export function JobPortal() {
  const [filter, setFilter] = useState<"all"|"eligible"|"applied">("all");

  const filtered = JOBS.filter(j =>
    filter==="all" ? true : filter==="eligible" ? j.eligible : j.applied
  );

  return (
    <AppShell title="Job Portal">
      <div className="grid gap-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active Drives", value: JOBS.length },
            { label: "Eligible For", value: JOBS.filter(j=>j.eligible).length },
            { label: "Applied", value: JOBS.filter(j=>j.applied).length },
          ].map(s=>(
            <div key={s.label} className="rounded border border-border bg-surface p-4">
              <p className="label-track">{s.label}</p>
              <p className="text-3xl font-light mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(["all","eligible","applied"] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={cn("rounded border px-4 py-2 text-sm capitalize transition-colors",
                filter===f ? "border-[#1C1810] bg-[#1C1810] text-[#F2EFE9]" : "border-border hover:border-[#1C1810]")}>
              {f}
            </button>
          ))}
        </div>

        {/* Job cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(j=>(
            <div key={j.id} className={cn("rounded border p-4 bg-surface", !j.eligible && "opacity-70")}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">{j.company}</p>
                  <p className="text-sm text-text-muted">{j.role}</p>
                </div>
                <div className="text-right">
                  <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                    j.type==="Internship" ? "bg-[#E6EEF5] text-[#2F567A]" : "bg-[#EBF3EE] text-[#3D6B4F]")}>
                    {j.type}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-text-muted mb-3">
                <span>💰 {j.ctc}</span>
                <span>📅 {j.date}</span>
                <span>🎓 CGPA ≥ {j.cgpa}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {j.branches.map(b=><span key={b} className="rounded bg-cream-100 px-2 py-0.5 text-xs">{b}</span>)}
              </div>
              {j.eligible ? (
                j.applied ? (
                  <p className="text-xs text-[#3D6B4F] font-medium">✓ Application Submitted</p>
                ) : (
                  <Button size="sm" className="w-full">Apply Now</Button>
                )
              ) : (
                <p className="text-xs text-[#8B2F2F]">Not eligible (CGPA or branch mismatch)</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
