"use client";

import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";
import { useParentDashboard, useMyChildren } from "@/lib/api/parent";
import { useParentNotifications, useParentCallHistory } from "@/lib/api/parent-comms";
import { useAuth } from "@/lib/auth/use-auth";
import { VTUNotificationsPanel } from "@/features/vtu/notifications-panel";

export function ParentDashboard() {
  const { session } = useAuth();
  const parentId = session?.user?.id ?? "";

  const { data: dashboard, isLoading } = useParentDashboard();
  const { data: children = [] } = useMyChildren();
  const { data: notifications = [] } = useParentNotifications(parentId);
  const { data: calls = [] } = useParentCallHistory(parentId);

  const child = children[0];
  const alerts = notifications.filter((n) => !n.read && (n.severity === "CRITICAL" || n.severity === "WARNING")).slice(0, 3);
  const recentCalls = calls.slice(0, 3);

  return (
    <AppShell title="Dashboard">
      <div className="grid gap-5">
        {/* Child info */}
        {isLoading ? (
          <div className="h-24 rounded border border-border bg-surface animate-pulse" />
        ) : child ? (
          <div className="rounded border border-border bg-surface p-5">
            <p className="label-track">My Child</p>
            <h3 className="mt-1 text-2xl font-light">{child.name}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs rounded bg-cream-100 px-2 py-0.5">{child.usn}</span>
              <span className="text-xs rounded bg-cream-100 px-2 py-0.5">{child.dept}</span>
              <span className="text-xs rounded bg-cream-100 px-2 py-0.5">Sem {child.semester}</span>
              <span className="text-xs rounded bg-cream-100 px-2 py-0.5">{child.section}</span>
            </div>
          </div>
        ) : null}

        {/* Alerts from notifications */}
        {alerts.map((a) => (
          <div
            key={a.id}
            className={cn(
              "rounded border-l-4 p-4",
              a.severity === "CRITICAL"
                ? "border-l-[#8B2F2F] bg-[#FDF5F5]"
                : a.severity === "WARNING"
                  ? "border-l-[#8B6914] bg-[#FDF9F0]"
                  : "border-l-[#2F567A] bg-[#F0F4F8]",
            )}
          >
            <p className="text-sm">{a.body}</p>
          </div>
        ))}

        {/* KPIs */}
        {child && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Overall Attendance",
                value: `${child.attendancePct ?? "—"}%`,
                color:
                  (child.attendancePct ?? 0) >= 85
                    ? "border-l-[#3D6B4F]"
                    : (child.attendancePct ?? 0) >= 75
                      ? "border-l-[#8B6914]"
                      : "border-l-[#8B2F2F]",
              },
              { label: "CGPA", value: child.cgpa ?? "—", color: "border-l-[#3D6B4F]" },
              {
                label: "Pending Fee",
                value: dashboard?.pendingFeeAmount
                  ? `₹${dashboard.pendingFeeAmount.toLocaleString()}`
                  : "—",
                color: dashboard?.pendingFeeAmount ? "border-l-[#8B6914]" : "border-l-[#3D6B4F]",
              },
              {
                label: "Fee Status",
                value: child.feeStatus ?? "—",
                color: child.feeStatus === "PAID" ? "border-l-[#3D6B4F]" : "border-l-[#8B6914]",
              },
            ].map((s) => (
              <div key={s.label} className={cn("rounded border-l-4 bg-surface p-4", s.color)}>
                <p className="label-track">{s.label}</p>
                <p className="text-2xl font-light mt-1">{String(s.value)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent AI calls — always rendered so tests can find the section */}
        <div>
          <p className="label-track mb-2">Recent AI Calls</p>
          {recentCalls.length === 0 ? (
            <p className="text-sm text-text-muted rounded border border-dashed border-border p-4 text-center">
              No calls on record.
            </p>
          ) : (
            <div className="grid gap-2">
              {recentCalls.map((c) => (
                <div
                  key={c.id}
                  className="rounded border border-border bg-surface p-3 flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-medium">{c.triggeredBy.replace(/_/g, " ")}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(c.calledAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {c.language.toUpperCase()} · {c.duration}s
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-medium",
                      c.outcome === "ANSWERED"
                        ? "bg-[#EBF3EE] text-[#3D6B4F]"
                        : "bg-[#F5E6E6] text-[#8B2F2F]",
                    )}
                  >
                    {c.outcome}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <VTUNotificationsPanel limit={8} />
      </div>
    </AppShell>
  );
}
