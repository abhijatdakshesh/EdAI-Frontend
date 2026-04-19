"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { generateReport, getComplianceDashboard, updateEvidenceStatus } from "./repository";
import type { ComplianceDashboardResponse, CriterionStatus, EvidenceStatus } from "./types";

const criterionStatusStyle: Record<CriterionStatus, string> = {
  approved: "text-[#3D6B4F] bg-[#EBF3EE]",
  under_review: "text-[#2F567A] bg-[#E6EEF5]",
  in_progress: "text-[#8B6914] bg-[#F5EDDB]",
  not_started: "text-[#9B9489] bg-[#EAE6DE]"
};

const evidenceStatusStyle: Record<EvidenceStatus, string> = {
  verified: "text-[#3D6B4F] bg-[#EBF3EE]",
  uploaded: "text-[#2F567A] bg-[#E6EEF5]",
  pending: "text-[#8B6914] bg-[#F5EDDB]",
  rejected: "text-[#8B2F2F] bg-[#F5E6E6]"
};

export function ComplianceDashboard() {
  const [data, setData] = useState<ComplianceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyEvidenceId, setBusyEvidenceId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getComplianceDashboard());
    } finally {
      setLoading(false);
    }
  }

  async function onGenerate() {
    if (!data) return;
    setGenerating(true);
    try {
      await generateReport(data.framework);
    } finally {
      setGenerating(false);
    }
  }

  async function onVerifyEvidence(evidenceId: string) {
    setBusyEvidenceId(evidenceId);
    try {
      await updateEvidenceStatus(evidenceId, "verified");
      setData((prev) =>
        prev
          ? {
              ...prev,
              recentEvidence: prev.recentEvidence.map((e) =>
                e.evidenceId === evidenceId ? { ...e, status: "verified" as EvidenceStatus } : e
              )
            }
          : prev
      );
    } finally {
      setBusyEvidenceId(null);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const scorePercent = data ? Math.round((data.overallScore / data.maxPossibleScore) * 100) : 0;

  return (
    <AppShell title="Compliance">
      <div className="grid gap-4">
        {/* Score header */}
        <div className="grid gap-4 lg:grid-cols-3">
          <ModuleCard
            heading={`${data?.framework ?? "NAAC"} Score`}
            description={
              data
                ? `${data.overallScore.toFixed(2)} / ${data.maxPossibleScore.toFixed(1)} — ${scorePercent}% — ${data.approvedCriteria}/${data.totalCriteria} criteria approved`
                : "Loading..."
            }
          >
            <div className="flex gap-2">
              <Button onClick={() => void load()}>{loading ? "Refreshing..." : "Refresh"}</Button>
              <Button variant="outline" disabled={generating} onClick={() => void onGenerate()}>
                {generating ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </ModuleCard>
          <ModuleCard
            heading="Evidence Status"
            description={
              data
                ? `${data.pendingEvidence} pending items • ${data.recentEvidence.filter((e) => e.status === "verified").length} verified`
                : "—"
            }
          />
          <ModuleCard
            heading="Framework Coverage"
            description={
              data
                ? data.criteria
                    .filter((c) => c.status === "not_started")
                    .map((c) => c.code)
                    .join(", ") || "All criteria started"
                : "—"
            }
          />
        </div>

        {/* Criteria board */}
        {data ? (
          <>
            <p className="label-track">Criteria Evidence Map</p>
            <div className="space-y-2">
              {data.criteria.map((c) => {
                const scorePct = c.score !== null ? Math.round((c.score / c.maxScore) * 100) : null;
                return (
                  <div key={c.criterionId} className="rounded border border-border bg-surface p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-medium text-text-muted">{c.code}</span>
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-xs font-medium",
                              criterionStatusStyle[c.status]
                            )}
                          >
                            {c.status.replace(/_/g, " ")}
                          </span>
                          {c.pendingEvidenceCount > 0 && (
                            <span className="rounded bg-[#F5EDDB] px-2 py-0.5 text-xs text-[#8B6914]">
                              {c.pendingEvidenceCount} evidence pending
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-medium">{c.title}</p>
                        <p className="text-sm text-text-secondary">
                          Weightage {c.weightage} •{" "}
                          {scorePct !== null ? `Score ${c.score} / ${c.maxScore} (${scorePct}%)` : "Score not yet assessed"} •{" "}
                          {c.evidenceCount} evidence items
                        </p>
                        {scorePct !== null && (
                          <div className="mt-2 h-1.5 w-full rounded-full bg-cream-300">
                            <div
                              className="h-1.5 rounded-full bg-[#1C1810]"
                              style={{ width: `${scorePct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent evidence */}
            <p className="label-track">Recent Evidence Uploads</p>
            <div className="space-y-2">
              {data.recentEvidence.map((ev) => (
                <div
                  key={ev.evidenceId}
                  className="flex items-center justify-between gap-4 rounded border border-border bg-surface p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-text-muted">{ev.fileType.toUpperCase()}</span>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          evidenceStatusStyle[ev.status]
                        )}
                      >
                        {ev.status}
                      </span>
                    </div>
                    <p className="mt-0.5 font-medium">{ev.title}</p>
                    <p className="text-sm text-text-secondary">
                      Uploaded by {ev.uploadedBy} • {new Date(ev.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  {ev.status === "uploaded" || ev.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyEvidenceId === ev.evidenceId}
                      onClick={() => void onVerifyEvidence(ev.evidenceId)}
                    >
                      Verify
                    </Button>
                  ) : (
                    <span className="text-xs text-text-muted capitalize">{ev.status}</span>
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
