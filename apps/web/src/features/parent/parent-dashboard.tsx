"use client";

import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";

const CHILD = { name: "Arjun Nair", usn: "1RVCE22CS089", dept: "CSE", sem: 6, section: "CSE 6A" };

const ALERTS = [
  { type: "warning", msg: "Attendance in Cryptography dropped to 75%. Risk of detention." },
  { type: "info", msg: "IA-2 exams scheduled Jan 14–17. Review exam schedule." },
];

const QUICK_STATS = [
  { label: "Overall Attendance", value: "84.5%", color: "border-l-[#8B6914]" },
  { label: "CGPA", value: "8.42", color: "border-l-[#3D6B4F]" },
  { label: "Pending Assignments", value: "2", color: "border-l-[#2F567A]" },
  { label: "Fee Status", value: "Paid", color: "border-l-[#3D6B4F]" },
];

export function ParentDashboard() {
  return (
    <AppShell title="Dashboard">
      <div className="grid gap-5">
        {/* Child info */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track">My Child</p>
          <h3 className="mt-1 text-2xl font-light">{CHILD.name}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs rounded bg-cream-100 px-2 py-0.5">{CHILD.usn}</span>
            <span className="text-xs rounded bg-cream-100 px-2 py-0.5">{CHILD.dept}</span>
            <span className="text-xs rounded bg-cream-100 px-2 py-0.5">Sem {CHILD.sem}</span>
            <span className="text-xs rounded bg-cream-100 px-2 py-0.5">{CHILD.section}</span>
          </div>
        </div>

        {/* Alerts */}
        {ALERTS.map((a,i)=>(
          <div key={i} className={cn("rounded border-l-4 p-4",
            a.type==="warning"?"border-l-[#8B6914] bg-[#FDF9F0]":"border-l-[#2F567A] bg-[#F0F4F8]")}>
            <p className="text-sm">{a.msg}</p>
          </div>
        ))}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_STATS.map(s=>(
            <div key={s.label} className={cn("rounded border-l-4 bg-surface p-4", s.color)}>
              <p className="label-track">{s.label}</p>
              <p className="text-2xl font-light mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Recent AI calls */}
        <div>
          <p className="label-track mb-2">Recent AI Calls</p>
          <div className="grid gap-2">
            {[
              { date: "Jan 12, 2025 07:05 AM", reason: "Attendance below threshold", lang: "Kannada", duration: "1m 42s" },
              { date: "Jan 5, 2025 07:03 AM", reason: "Fee reminder", lang: "English", duration: "0m 58s" },
            ].map((c,i)=>(
              <div key={i} className="rounded border border-border bg-surface p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{c.reason}</p>
                  <p className="text-xs text-text-muted">{c.date} · {c.lang} · {c.duration}</p>
                </div>
                <button className="text-xs text-[#2F567A] hover:underline">Listen</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
