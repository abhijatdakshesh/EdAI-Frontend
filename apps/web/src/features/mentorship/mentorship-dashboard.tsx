"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getMentorshipDashboard, logFollowUp } from "./repository";
import type { MentorshipDashboardResponse } from "./types";

const riskStyle: Record<string, string> = {
  high: "text-[#8B2F2F] bg-[#F5E6E6]",
  medium: "text-[#8B6914] bg-[#F5EDDB]",
  low: "text-[#3D6B4F] bg-[#EBF3EE]"
};

const outcomeStyle: Record<string, string> = {
  productive: "text-[#3D6B4F]",
  needs_followup: "text-[#8B6914]",
  escalated: "text-[#8B2F2F]"
};

export function MentorshipDashboard() {
  const [data, setData] = useState<MentorshipDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getMentorshipDashboard());
    } finally {
      setLoading(false);
    }
  }

  async function onFollowUp(studentId: string) {
    setBusyId(studentId);
    try {
      await logFollowUp(studentId, "Follow-up logged from web console");
      setData((prev) =>
        prev
          ? {
              ...prev,
              mentees: prev.mentees.map((m) =>
                m.studentId === studentId ? { ...m, followUpDue: false } : m
              ),
              overdueFollowUps: Math.max(0, prev.overdueFollowUps - 1)
            }
          : prev
      );
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AppShell title="Mentorship">
      <div className="grid gap-4">
        {/* KPI header */}
        <div className="grid gap-4 lg:grid-cols-3">
          <ModuleCard
            heading="Programme Overview"
            description={
              data
                ? `${data.totalMentors} mentors • ${data.totalMentees} mentees • ${data.overdueFollowUps} overdue follow-ups`
                : "Loading..."
            }
          >
            <Button onClick={() => void load()}>{loading ? "Refreshing..." : "Refresh"}</Button>
          </ModuleCard>
          <ModuleCard
            heading="High-Risk Mentees"
            description={
              data
                ? `${data.mentees.filter((m) => m.riskLevel === "high").length} high-risk • ${data.mentees.filter((m) => m.riskLevel === "medium").length} medium-risk`
                : "—"
            }
          />
          <ModuleCard
            heading="Upcoming Sessions"
            description={
              data
                ? data.mentors.map((m) => `${m.mentorName}: ${m.nextSessionDate}`).join(" • ")
                : "—"
            }
          />
        </div>

        {data ? (
          <>
            {/* Mentor map */}
            <p className="label-track">Mentor Allocations</p>
            <div className="grid gap-2 lg:grid-cols-2">
              {data.mentors.map((mentor) => (
                <div key={mentor.mentorId} className="rounded border border-border bg-surface p-3">
                  <p className="font-medium">{mentor.mentorName}</p>
                  <p className="text-sm text-text-secondary">
                    {mentor.designation} • {mentor.menteeCount} mentees
                  </p>
                  <p className="text-xs text-text-muted">Next session: {mentor.nextSessionDate}</p>
                </div>
              ))}
            </div>

            {/* Mentee tracker */}
            <p className="label-track">Mentee Risk and Follow-Up</p>
            <div className="space-y-2">
              {data.mentees.map((m) => (
                <div
                  key={m.studentId}
                  className="flex items-center justify-between gap-4 rounded border border-border bg-surface p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{m.studentName}</p>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          riskStyle[m.riskLevel] ?? ""
                        )}
                      >
                        {m.riskLevel} risk
                      </span>
                      {m.followUpDue && (
                        <span className="rounded bg-[#F5EDDB] px-2 py-0.5 text-xs text-[#8B6914]">
                          Follow-up due
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">
                      {m.program} • Mentor: {m.mentorName} • Sessions: {m.sessionCount}
                    </p>
                    <p className="text-xs">
                      Last session {m.lastSessionDate} —{" "}
                      <span className={outcomeStyle[m.lastOutcome] ?? ""}>
                        {m.lastOutcome.replace("_", " ")}
                      </span>
                    </p>
                  </div>
                  {m.followUpDue ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === m.studentId}
                      onClick={() => void onFollowUp(m.studentId)}
                    >
                      Log Follow-Up
                    </Button>
                  ) : (
                    <span className="text-xs text-text-muted">Up to date</span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
