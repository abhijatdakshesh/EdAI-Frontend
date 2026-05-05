"use client";

import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import { useActiveVTUWindow } from "@/lib/api/vtu";
import Link from "next/link";

interface DashboardStats {
  attendancePct: number;
  cgpa: number;
  pendingAssignments: number;
  feeStatus: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
  riskScore?: number;
  studyPlanStreak?: number;
  examStressLevel?: "LOW" | "MEDIUM" | "HIGH";
}

interface UpcomingItem {
  date: string;
  event: string;
  type: "exam" | "assignment" | "event" | "placement";
}

interface EnrolledCourse {
  code: string;
  name: string;
  faculty: string;
  attendance: number;
  nextClass: string;
}

interface StudentDashboardData {
  stats: DashboardStats;
  upcoming: UpcomingItem[];
  courses: EnrolledCourse[];
}

const typeStyle: Record<string, string> = {
  exam: "bg-[#F5E6E6] text-[#8B2F2F]",
  assignment: "bg-[#F5EDDB] text-[#8B6914]",
  event: "bg-[#E6EEF5] text-[#2F567A]",
  placement: "bg-[#EBF3EE] text-[#3D6B4F]",
};

export function StudentDashboard() {
  const { session } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery<StudentDashboardData>({
    queryKey: ["student-dashboard"],
    queryFn: () => apiGet<StudentDashboardData>("/api/student/dashboard"),
    staleTime: 60_000,
    retry: (failureCount, err) => {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) return false;
      return failureCount < 1;
    },
  });

  const { data: vtuWindow } = useActiveVTUWindow();

  const stats = data?.stats;
  const upcoming = data?.upcoming ?? [];
  const courses = data?.courses ?? [];

  return (
    <AppShell title="Dashboard">
      <div className="grid gap-5">
        {/* API error banner */}
        {isError && (
          <div className="rounded border border-[#8B2F2F]/30 bg-[#F5E6E6] px-4 py-3 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-[#8B2F2F] text-sm">Could not load dashboard data</p>
              <p className="text-xs text-[#8B2F2F]/80 mt-0.5">
                {(error as Error)?.message ?? "Unknown error"} — make sure you are signed in with a seeded account (e.g. <span className="font-mono">student@rvce.edu</span>)
              </p>
            </div>
            <button
              onClick={() => void refetch()}
              className="shrink-0 rounded border border-[#8B2F2F]/40 px-3 py-1 text-xs text-[#8B2F2F] hover:bg-[#8B2F2F]/10"
            >
              Retry
            </button>
          </div>
        )}
        {/* VTU Registration Banner */}
        {vtuWindow && (
          <Link href="/student/vtu"
            className="rounded border border-[#2F567A] bg-[#E6EEF5] p-4 flex items-center justify-between hover:bg-[#d8e6f0] transition-colors">
            <div>
              <p className="font-medium text-[#2F567A]">VTU Registration Open — {vtuWindow.title}</p>
              <p className="text-xs text-[#2F567A]/80">Closes {vtuWindow.closeDate} · Click to register</p>
            </div>
            <span className="text-[#2F567A] text-lg">→</span>
          </Link>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {isLoading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded border border-border bg-surface p-4 h-20 animate-pulse" />
              ))
            : [
                { label: "Overall Attendance", value: stats ? `${stats.attendancePct}%` : "—", warn: (stats?.attendancePct ?? 100) < 75 },
                { label: "CGPA", value: stats ? stats.cgpa.toFixed(2) : "—", warn: false },
                { label: "Pending Assignments", value: stats ? String(stats.pendingAssignments) : "—", warn: (stats?.pendingAssignments ?? 0) > 0 },
                { label: "Fee Status", value: stats?.feeStatus ?? "—", warn: stats?.feeStatus !== "PAID" },
              ].map((k) => (
                <div key={k.label} className={cn("rounded border-l-4 bg-surface p-4",
                  k.warn ? "border-l-[#8B6914]" : "border-l-[#3D6B4F]")}>
                  <p className="label-track">{k.label}</p>
                  <p className="text-2xl font-light mt-1">{k.value}</p>
                </div>
              ))}
        </div>

        {/* Wellness signals */}
        {stats && (stats.riskScore !== undefined || stats.studyPlanStreak !== undefined) && (
          <div className="grid grid-cols-3 gap-3">
            {stats.riskScore !== undefined && (
              <div className={cn("rounded border-l-4 bg-surface p-3",
                stats.riskScore > 70 ? "border-l-[#8B2F2F]"
                : stats.riskScore > 40 ? "border-l-[#8B6914]" : "border-l-[#3D6B4F]")}>
                <p className="label-track text-xs">Risk Score</p>
                <p className="text-xl font-light mt-0.5">{stats.riskScore}/100</p>
              </div>
            )}
            {stats.studyPlanStreak !== undefined && (
              <div className="rounded border-l-4 border-l-[#2F567A] bg-surface p-3">
                <p className="label-track text-xs">Study Streak</p>
                <p className="text-xl font-light mt-0.5">{stats.studyPlanStreak} days</p>
              </div>
            )}
            {stats.examStressLevel && (
              <div className={cn("rounded border-l-4 bg-surface p-3",
                stats.examStressLevel === "HIGH" ? "border-l-[#8B2F2F]"
                : stats.examStressLevel === "MEDIUM" ? "border-l-[#8B6914]" : "border-l-[#3D6B4F]")}>
                <p className="label-track text-xs">Exam Stress</p>
                <p className="text-xl font-light mt-0.5">{stats.examStressLevel}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Courses */}
          <div>
            <p className="label-track mb-2">My Courses</p>
            {isLoading ? (
              <div className="grid gap-2 animate-pulse">
                {[1, 2, 3].map((i) => <div key={i} className="rounded border border-border bg-surface h-16" />)}
              </div>
            ) : (
              <div className="grid gap-2">
                {courses.map((c) => (
                  <div key={c.code} className="rounded border border-border bg-surface p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-text-muted">{c.code} · {c.faculty}</p>
                        <p className="text-xs text-text-muted mt-0.5">Next: {c.nextClass}</p>
                      </div>
                      <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                        c.attendance >= 85 ? "bg-[#EBF3EE] text-[#3D6B4F]"
                        : c.attendance >= 75 ? "bg-[#F5EDDB] text-[#8B6914]"
                        : "bg-[#F5E6E6] text-[#8B2F2F]")}>
                        {c.attendance}%
                      </span>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <p className="text-sm text-text-muted">No courses enrolled.</p>
                )}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div>
            <p className="label-track mb-2">Upcoming</p>
            {isLoading ? (
              <div className="grid gap-2 animate-pulse">
                {[1, 2, 3].map((i) => <div key={i} className="rounded border border-border bg-surface h-14" />)}
              </div>
            ) : (
              <div className="grid gap-2">
                {upcoming.map((u, i) => (
                  <div key={i} className="rounded border border-border bg-surface p-3 flex items-center gap-3">
                    <div className="text-center min-w-[44px]">
                      <p className="text-xs text-text-muted">{u.date.split(" ")[0]}</p>
                      <p className="font-medium text-sm">{u.date.split(" ")[1]}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{u.event}</p>
                    </div>
                    <span className={cn("rounded px-2 py-0.5 text-xs font-medium", typeStyle[u.type])}>
                      {u.type}
                    </span>
                  </div>
                ))}
                {upcoming.length === 0 && (
                  <p className="text-sm text-text-muted">No upcoming events.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
