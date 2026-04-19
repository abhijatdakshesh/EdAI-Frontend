"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";

type Severity = "critical" | "warning" | "info";
type Category = "attendance" | "fees" | "performance" | "system" | "grievance";

interface Alert {
  id: string;
  severity: Severity;
  category: Category;
  title: string;
  message: string;
  student?: string;
  class?: string;
  occurredAt: string;
  resolved: boolean;
}

const MOCK_ALERTS: Alert[] = [
  { id: "a1", severity: "critical", category: "attendance", title: "Student Below 65%", message: "Ravi Kumar (1RV22CS089) has attendance 63.2% in CSE 6A. Immediate parent notification required.", student: "Ravi Kumar", class: "CSE 6A", occurredAt: "2025-01-12 08:15", resolved: false },
  { id: "a2", severity: "warning", category: "attendance", title: "Class Attendance Drop", message: "ME 2A overall attendance dropped to 74.8% this week, below the 75% threshold.", class: "ME 2A", occurredAt: "2025-01-12 07:00", resolved: false },
  { id: "a3", severity: "critical", category: "fees", title: "Fee Overdue > 60 Days", message: "12 students have outstanding fees overdue by more than 60 days. Total: ₹3,42,000.", occurredAt: "2025-01-11 09:00", resolved: false },
  { id: "a4", severity: "info", category: "system", title: "Scheduled Maintenance", message: "System maintenance scheduled for 2025-01-15 02:00–04:00 AM. All services will be unavailable.", occurredAt: "2025-01-10 16:00", resolved: false },
  { id: "a5", severity: "warning", category: "performance", title: "IA Marks Not Submitted", message: "3 faculty members have not submitted IA-2 marks for 5 courses. Deadline: 15 Jan 2025.", occurredAt: "2025-01-10 08:30", resolved: false },
  { id: "a6", severity: "info", category: "grievance", title: "New Grievance Filed", message: "A new Level-1 grievance (GR-2025-0041) has been filed and awaits resolution.", occurredAt: "2025-01-09 14:45", resolved: true },
  { id: "a7", severity: "warning", category: "performance", title: "Performance Drop Detected", message: "Ananya Krishnan (1RV23ME045) scored below 35% in last 2 IA exams. Counsellor review recommended.", student: "Ananya Krishnan", class: "ME 3B", occurredAt: "2025-01-08 10:00", resolved: false },
];

const severityStyle: Record<Severity, string> = {
  critical: "border-l-[#8B2F2F] bg-[#FDF5F5]",
  warning: "border-l-[#8B6914] bg-[#FDF9F0]",
  info: "border-l-[#2F567A] bg-[#F0F4F8]",
};

const severityBadge: Record<Severity, string> = {
  critical: "bg-[#F5E6E6] text-[#8B2F2F]",
  warning: "bg-[#F5EDDB] text-[#8B6914]",
  info: "bg-[#E6EEF5] text-[#2F567A]",
};

const categoryEmoji: Record<Category, string> = {
  attendance: "📊", fees: "💰", performance: "📈", system: "⚙️", grievance: "📝",
};

export function AlertFeed() {
  const [filterSev, setFilterSev] = useState<Severity | "ALL">("ALL");
  const [showResolved, setShowResolved] = useState(false);

  const filtered = MOCK_ALERTS.filter(a =>
    (filterSev === "ALL" || a.severity === filterSev) &&
    (showResolved || !a.resolved)
  );

  const counts = {
    critical: MOCK_ALERTS.filter(a=>a.severity==="critical"&&!a.resolved).length,
    warning: MOCK_ALERTS.filter(a=>a.severity==="warning"&&!a.resolved).length,
    info: MOCK_ALERTS.filter(a=>a.severity==="info"&&!a.resolved).length,
  };

  return (
    <AppShell title="Alert Feed">
      <div className="grid gap-5">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {(["critical","warning","info"] as Severity[]).map(sev=>(
            <button key={sev} onClick={()=>setFilterSev(filterSev===sev?"ALL":sev)}
              className={cn("rounded border-l-4 p-4 text-left transition-colors",
                filterSev===sev ? severityStyle[sev] : "border-border bg-surface hover:bg-cream-50",
                sev==="critical" && filterSev===sev ? severityStyle.critical
                : sev==="warning" && filterSev===sev ? severityStyle.warning
                : sev==="info" && filterSev===sev ? severityStyle.info : ""
              )}>
              <p className="label-track capitalize">{sev}</p>
              <p className="text-3xl font-light mt-1">{counts[sev]}</p>
              <p className="text-xs text-text-muted">unresolved</p>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={showResolved} onChange={e=>setShowResolved(e.target.checked)}
              className="rounded" />
            Show resolved
          </label>
          {filterSev !== "ALL" && (
            <button onClick={()=>setFilterSev("ALL")} className="text-xs text-[#2F567A] underline">
              Clear filter
            </button>
          )}
        </div>

        {/* Alerts */}
        <div className="grid gap-2">
          {filtered.map(alert=>(
            <div key={alert.id} className={cn("rounded border-l-4 p-4", severityStyle[alert.severity], alert.resolved && "opacity-60")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{categoryEmoji[alert.category]}</span>
                    <span className="text-xs text-text-muted uppercase label-track">{alert.category}</span>
                    <span className={cn("rounded px-2 py-0.5 text-xs font-medium", severityBadge[alert.severity])}>
                      {alert.severity}
                    </span>
                    {alert.resolved && <span className="rounded px-2 py-0.5 text-xs bg-[#EBF3EE] text-[#3D6B4F]">resolved</span>}
                  </div>
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-sm text-text-secondary mt-1">{alert.message}</p>
                  {(alert.student || alert.class) && (
                    <div className="flex gap-3 mt-1 text-xs text-text-muted">
                      {alert.student && <span>👤 {alert.student}</span>}
                      {alert.class && <span>🏫 {alert.class}</span>}
                    </div>
                  )}
                  <p className="text-xs text-text-muted mt-1">{alert.occurredAt}</p>
                </div>
                {!alert.resolved && (
                  <button className="text-xs text-[#2F567A] hover:underline shrink-0">Mark Resolved</button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm text-text-muted">No alerts match the current filters.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
