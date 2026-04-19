"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";

import { escalateVoiceCall, getVoiceDashboard } from "./repository";
import type { VoiceDashboardResponse } from "./types";

export function VoiceDashboard() {
  const [data, setData] = useState<VoiceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyCallId, setBusyCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setData(await getVoiceDashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch voice queue");
    } finally {
      setLoading(false);
    }
  }

  async function onEscalate(callId: string) {
    try {
      setBusyCallId(callId);
      await escalateVoiceCall(callId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              queue: prev.queue.map((item) =>
                item.callId === callId ? { ...item, status: "escalated" } : item
              )
            }
          : prev
      );
    } finally {
      setBusyCallId(null);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AppShell title="Voice Agent">
      <div className="grid gap-4">
        <ModuleCard
          heading="Voice Queue"
          description={
            data
              ? `Updated ${new Date(data.refreshedAt).toLocaleTimeString()} • ${data.queue.length} active calls`
              : "Loading queue..."
          }
        >
          <div className="flex items-center gap-3">
            <Button onClick={() => void load()}>{loading ? "Refreshing..." : "Refresh Queue"}</Button>
            {error ? <span className="text-sm text-[#8B2F2F]">{error}</span> : null}
          </div>
        </ModuleCard>

        {data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <ModuleCard
              heading="Active Calls"
              description={data.queue
                .map((item) => `${item.guardianName} (${item.priority}) - ${item.status}`)
                .join(" • ")}
            >
              <div className="space-y-2">
                {data.queue.map((item) => (
                  <div key={item.callId} className="flex items-center justify-between rounded border p-2">
                    <div>
                      <p className="text-sm font-medium">
                        {item.guardianName} - {item.studentName}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {item.language} • {item.callId} • {item.status}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void onEscalate(item.callId)}
                      disabled={busyCallId === item.callId || item.status === "escalated"}
                    >
                      {item.status === "escalated" ? "Escalated" : "Escalate"}
                    </Button>
                  </div>
                ))}
              </div>
            </ModuleCard>
            <ModuleCard
              heading="Transcript Insights"
              description={data.transcripts
                .map((t) => `${t.callId} (${t.sentiment}) - ${t.summary}`)
                .join(" • ")}
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
