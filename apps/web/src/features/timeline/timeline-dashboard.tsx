"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { acknowledgeEvent, getTimelineDashboard, pinEvent } from "./repository";
import type { TimelineDashboardResponse, TimelineEvent } from "./types";

const priorityStyle: Record<string, string> = {
  critical: "border-l-[#8B2F2F] bg-[#F5E6E6]",
  high: "border-l-[#8B6914] bg-[#F5EDDB]",
  medium: "border-l-[#2F567A] bg-[#E6EEF5]",
  low: "border-l-[#D0C9BC] bg-surface"
};

function EventRow({
  event,
  onAcknowledge,
  onPin,
  busy
}: {
  event: TimelineEvent;
  onAcknowledge: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  busy: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded border-l-4 p-3 transition-colors",
        priorityStyle[event.priority] ?? "bg-surface"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="label-track">{event.kind}</p>
        <p className="font-medium">{event.title}</p>
        <p className="text-sm text-text-secondary">{event.studentName} — {event.detail}</p>
        <p className="mt-1 text-xs text-text-muted">{new Date(event.occurredAt).toLocaleString()}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <Button
          size="sm"
          variant={event.acknowledged ? "ghost" : "outline"}
          disabled={event.acknowledged || busy}
          onClick={() => onAcknowledge(event.eventId)}
        >
          {event.acknowledged ? "Ack'd" : "Acknowledge"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => onPin(event.eventId, !event.pinned)}
        >
          {event.pinned ? "Unpin" : "Pin"}
        </Button>
      </div>
    </div>
  );
}

export function TimelineDashboard() {
  const [data, setData] = useState<TimelineDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pinned" | "unacknowledged">("all");

  async function load() {
    setLoading(true);
    try {
      setData(await getTimelineDashboard());
    } finally {
      setLoading(false);
    }
  }

  async function onAcknowledge(eventId: string) {
    setBusyId(eventId);
    try {
      await acknowledgeEvent(eventId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              events: prev.events.map((e) =>
                e.eventId === eventId ? { ...e, acknowledged: true } : e
              )
            }
          : prev
      );
    } finally {
      setBusyId(null);
    }
  }

  async function onPin(eventId: string, pinned: boolean) {
    setBusyId(eventId);
    try {
      await pinEvent(eventId, pinned);
      setData((prev) =>
        prev
          ? {
              ...prev,
              events: prev.events.map((e) =>
                e.eventId === eventId ? { ...e, pinned } : e
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

  const events = data
    ? data.events
        .filter((e) => {
          if (filter === "pinned") return e.pinned;
          if (filter === "unacknowledged") return !e.acknowledged;
          return true;
        })
        .sort((a, b) => {
          const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
        })
    : [];

  return (
    <AppShell title="Timeline">
      <div className="grid gap-4">
        <ModuleCard
          heading="Unified Student Timeline"
          description={
            data
              ? `Fetched ${new Date(data.fetchedAt).toLocaleTimeString()} • ${data.events.length} events • ${data.events.filter((e) => !e.acknowledged).length} unacknowledged`
              : "Loading timeline..."
          }
        >
          <div className="flex items-center gap-3">
            <Button onClick={() => void load()}>{loading ? "Refreshing..." : "Refresh"}</Button>
            <div className="flex gap-1">
              {(["all", "pinned", "unacknowledged"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? "default" : "ghost"}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </ModuleCard>

        {!loading && events.length === 0 ? (
          <ModuleCard heading="No events" description="No timeline events match the current filter." />
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <EventRow
                key={e.eventId}
                event={e}
                onAcknowledge={(id) => void onAcknowledge(id)}
                onPin={(id, pinned) => void onPin(id, pinned)}
                busy={busyId === e.eventId}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
