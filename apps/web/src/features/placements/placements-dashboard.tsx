"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getPlacementsDashboard, updateCandidateStatus } from "./repository";
import type { CandidateStatus, PlacementsDashboardResponse } from "./types";

const driveStatusStyle: Record<string, string> = {
  active: "text-[#3D6B4F] bg-[#EBF3EE]",
  upcoming: "text-[#2F567A] bg-[#E6EEF5]",
  closed: "text-[#9B9489] bg-[#EAE6DE]"
};

const candidateStatusStyle: Record<string, string> = {
  offered: "text-[#3D6B4F] bg-[#EBF3EE]",
  shortlisted: "text-[#2F567A] bg-[#E6EEF5]",
  applied: "text-[#8B6914] bg-[#F5EDDB]",
  rejected: "text-[#8B2F2F] bg-[#F5E6E6]",
  eligible: "text-[#6B6358] bg-[#EAE6DE]"
};

const nextStatus: Partial<Record<CandidateStatus, CandidateStatus>> = {
  applied: "shortlisted",
  shortlisted: "offered"
};

export function PlacementsDashboard() {
  const [data, setData] = useState<PlacementsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getPlacementsDashboard());
    } finally {
      setLoading(false);
    }
  }

  async function onAdvance(studentId: string, driveId: string, current: CandidateStatus) {
    const next = nextStatus[current];
    if (!next) return;
    setBusyId(`${studentId}-${driveId}`);
    try {
      await updateCandidateStatus(studentId, driveId, next);
      setData((prev) =>
        prev
          ? {
              ...prev,
              candidates: prev.candidates.map((c) =>
                c.studentId === studentId && c.driveId === driveId ? { ...c, status: next } : c
              )
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
    <AppShell title="Placements">
      <div className="grid gap-4">
        {/* Header KPIs */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ModuleCard
            heading="Drive Overview"
            description={
              data
                ? `${data.activeDrives} active drives • ${data.totalOffers} offers extended`
                : "Loading placements..."
            }
          >
            <Button onClick={() => void load()}>{loading ? "Refreshing..." : "Refresh"}</Button>
          </ModuleCard>
          <ModuleCard
            heading="Candidate Pipeline"
            description={
              data
                ? `${data.candidates.filter((c) => c.status === "offered").length} offered • ${data.candidates.filter((c) => c.status === "shortlisted").length} shortlisted • ${data.candidates.filter((c) => c.status === "applied").length} applied`
                : "—"
            }
          />
        </div>

        {/* Drive board */}
        {data ? (
          <>
            <p className="label-track">Active and Recent Drives</p>
            <div className="space-y-2">
              {data.drives.map((drive) => (
                <div key={drive.driveId} className="rounded border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {drive.company} — {drive.role}
                        </p>
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            driveStatusStyle[drive.status] ?? ""
                          )}
                        >
                          {drive.status}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        ₹{drive.ctcLpa} LPA • {drive.scheduledDate}
                      </p>
                    </div>
                    <div className="text-right text-xs text-text-muted">
                      <p>Eligible {drive.eligibleCount}</p>
                      <p>Applied {drive.appliedCount}</p>
                      <p>Shortlisted {drive.shortlistedCount}</p>
                      <p className="font-medium text-[#3D6B4F]">Offers {drive.offersCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Candidate tracker */}
            <p className="label-track">Candidate Tracker</p>
            <div className="space-y-2">
              {data.candidates.map((c) => {
                const key = `${c.studentId}-${c.driveId}`;
                const advance = nextStatus[c.status];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded border border-border bg-surface p-3"
                  >
                    <div>
                      <p className="font-medium">{c.studentName}</p>
                      <p className="text-sm text-text-secondary">
                        {c.program} → {c.company}
                        {c.currentRound ? ` • Round: ${c.currentRound}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          candidateStatusStyle[c.status] ?? ""
                        )}
                      >
                        {c.status}
                      </span>
                      {advance ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === key}
                          onClick={() => void onAdvance(c.studentId, c.driveId, c.status)}
                        >
                          → {advance}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
