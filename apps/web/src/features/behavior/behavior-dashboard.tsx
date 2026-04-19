"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getBehaviorDashboard, updateIncidentStatus } from "./repository";
import type { BehaviorDashboardResponse, BehaviorIncident, IncidentSeverity, IncidentStatus } from "./types";

const severityStyle: Record<IncidentSeverity, string> = {
  low: "bg-[#EAE6DE] text-[#6B6358]",
  medium: "bg-[#F5EDDB] text-[#8B6914]",
  high: "bg-[#F5E6E6] text-[#8B2F2F]",
  critical: "bg-[#8B2F2F] text-white"
};

const statusStyle: Record<IncidentStatus, string> = {
  open: "bg-[#F5E6E6] text-[#8B2F2F]",
  under_investigation: "bg-[#F5EDDB] text-[#8B6914]",
  action_taken: "bg-[#E6EEF5] text-[#2F567A]",
  closed: "bg-[#EBF3EE] text-[#3D6B4F]"
};

const nextStatus: Record<IncidentStatus, IncidentStatus | null> = {
  open: "under_investigation",
  under_investigation: "action_taken",
  action_taken: "closed",
  closed: null
};

export function BehaviorDashboard() {
  const [data, setData] = useState<BehaviorDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getBehaviorDashboard());
    } finally {
      setLoading(false);
    }
  }

  async function onAdvance(incident: BehaviorIncident) {
    const next = nextStatus[incident.status];
    if (!next) return;
    setBusyId(incident.incidentId);
    try {
      await updateIncidentStatus(incident.incidentId, next);
      setData((prev) =>
        prev
          ? {
              ...prev,
              incidents: prev.incidents.map((inc) =>
                inc.incidentId === incident.incidentId ? { ...inc, status: next } : inc
              )
            }
          : prev
      );
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <AppShell title="Behavioral Intelligence">
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <ModuleCard
            heading="Behavioral Intelligence"
            description={
              data
                ? `${data.openIncidents} open · ${data.criticalIncidents} critical · ${data.repeatOffenders} repeat offenders`
                : "Loading..."
            }
          >
            <Button onClick={() => void load()}>{loading ? "Refreshing..." : "Refresh"}</Button>
          </ModuleCard>
          <ModuleCard
            heading="Repeat Offenders"
            description={
              data
                ? data.incidents.filter((i) => i.isRepeatOffender).map((i) => i.studentName).join(", ") || "None"
                : "—"
            }
          />
          <ModuleCard
            heading="Resolution Rate"
            description={
              data
                ? `${Math.round((data.incidents.filter((i) => i.status === "closed").length / data.incidents.length) * 100)}% closed`
                : "—"
            }
          />
        </div>

        {data ? (
          <>
            <p className="label-track">Incident Register</p>
            <div className="space-y-2">
              {data.incidents.map((inc) => {
                const next = nextStatus[inc.status];
                return (
                  <div key={inc.incidentId} className="rounded border border-border bg-surface p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", severityStyle[inc.severity])}>
                            {inc.severity}
                          </span>
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusStyle[inc.status])}>
                            {inc.status.replace(/_/g, " ")}
                          </span>
                          {inc.isRepeatOffender && (
                            <span className="rounded bg-[#8B2F2F] px-2 py-0.5 text-xs font-medium text-white">
                              Repeat
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 font-medium">
                          {inc.studentName} <span className="font-normal text-text-secondary">· {inc.class}</span>
                        </p>
                        <p className="text-sm text-text-secondary">
                          {inc.category.replace(/_/g, " ")} · Reported by {inc.reportedBy} · {new Date(inc.reportedAt).toLocaleDateString()}
                        </p>
                        <p className="mt-1 text-sm">{inc.description}</p>
                      </div>
                      {next && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === inc.incidentId}
                          onClick={() => void onAdvance(inc)}
                        >
                          {busyId === inc.incidentId ? "..." : next.replace(/_/g, " ")}
                        </Button>
                      )}
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
