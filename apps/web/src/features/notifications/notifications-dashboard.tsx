"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getNotificationsDashboard, retryCampaign, sendCampaign } from "./repository";
import type { NotificationCampaign, NotificationsDashboardResponse } from "./types";

const statusColors: Record<string, string> = {
  sent: "text-[#3D6B4F] bg-[#EBF3EE]",
  scheduled: "text-[#2F567A] bg-[#E6EEF5]",
  failed: "text-[#8B2F2F] bg-[#F5E6E6]",
  draft: "text-[#6B6358] bg-[#EAE6DE]"
};

const channelLabel: Record<string, string> = {
  push: "Push",
  whatsapp: "WhatsApp",
  in_app: "In-App"
};

function CampaignRow({
  campaign,
  onRetry,
  onSend,
  busy
}: {
  campaign: NotificationCampaign;
  onRetry: (id: string) => void;
  onSend: (id: string) => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded border border-border bg-surface p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded px-2 py-0.5 text-xs font-medium",
              statusColors[campaign.status] ?? "bg-surface"
            )}
          >
            {campaign.status}
          </span>
          <span className="label-track">{channelLabel[campaign.channel]}</span>
        </div>
        <p className="mt-1 font-medium">{campaign.title}</p>
        <p className="text-sm text-text-secondary">{campaign.audience}</p>
        <p className="mt-0.5 text-xs text-text-muted">
          Sent {campaign.sentCount} • Failed {campaign.failedCount} •{" "}
          {new Date(campaign.scheduledAt).toLocaleString()}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        {campaign.status === "failed" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onRetry(campaign.campaignId)}>
            Retry
          </Button>
        )}
        {campaign.status === "scheduled" && (
          <Button size="sm" variant="default" disabled={busy} onClick={() => onSend(campaign.campaignId)}>
            Send Now
          </Button>
        )}
      </div>
    </div>
  );
}

export function NotificationsDashboard() {
  const [data, setData] = useState<NotificationsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getNotificationsDashboard());
    } finally {
      setLoading(false);
    }
  }

  function updateCampaignStatus(campaignId: string, status: NotificationCampaign["status"]) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            campaigns: prev.campaigns.map((c) =>
              c.campaignId === campaignId ? { ...c, status } : c
            )
          }
        : prev
    );
  }

  async function onRetry(campaignId: string) {
    setBusyId(campaignId);
    try {
      await retryCampaign(campaignId);
      updateCampaignStatus(campaignId, "sent");
    } finally {
      setBusyId(null);
    }
  }

  async function onSend(campaignId: string) {
    setBusyId(campaignId);
    try {
      await sendCampaign(campaignId);
      updateCampaignStatus(campaignId, "sent");
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AppShell title="Notifications">
      <div className="grid gap-4">
        <ModuleCard
          heading="Communication Centre"
          description={
            data
              ? `Generated ${new Date(data.generatedAt).toLocaleTimeString()} • ${data.totalSent.toLocaleString()} sent total • ${data.pendingRetries} pending retries`
              : "Loading notifications..."
          }
        >
          <Button onClick={() => void load()}>{loading ? "Refreshing..." : "Refresh"}</Button>
        </ModuleCard>

        {data ? (
          <div className="space-y-2">
            {data.campaigns.map((c) => (
              <CampaignRow
                key={c.campaignId}
                campaign={c}
                onRetry={(id) => void onRetry(id)}
                onSend={(id) => void onSend(id)}
                busy={busyId === c.campaignId}
              />
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
