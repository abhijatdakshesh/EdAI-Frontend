"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getIntegrationsDashboard, retryConnector, triggerSync } from "./repository";
import type { ConnectorStatus, IntegrationsDashboardResponse } from "./types";

const statusStyle: Record<ConnectorStatus, string> = {
  connected: "bg-[#EBF3EE] text-[#3D6B4F]",
  syncing: "bg-[#E6EEF5] text-[#2F567A]",
  degraded: "bg-[#F5EDDB] text-[#8B6914]",
  disconnected: "bg-[#F5E6E6] text-[#8B2F2F]"
};

const kindIcon: Record<string, string> = {
  erp: "⬡",
  sms: "✉",
  whatsapp: "💬",
  telephony: "☎",
  auth: "🔑",
  storage: "☁"
};

export function IntegrationsDashboard() {
  const [data, setData] = useState<IntegrationsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getIntegrationsDashboard());
    } finally {
      setLoading(false);
    }
  }

  async function onRetry(connectorId: string) {
    setBusyId(connectorId);
    try {
      await retryConnector(connectorId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              connectors: prev.connectors.map((c) =>
                c.connectorId === connectorId ? { ...c, status: "syncing" as ConnectorStatus, errorMessage: null } : c
              )
            }
          : prev
      );
    } finally {
      setBusyId(null);
    }
  }

  async function onSync(connectorId: string) {
    setBusyId(connectorId);
    try {
      await triggerSync(connectorId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              connectors: prev.connectors.map((c) =>
                c.connectorId === connectorId ? { ...c, status: "syncing" as ConnectorStatus } : c
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

  const connected = data?.connectors.filter((c) => c.status === "connected").length ?? 0;
  const degraded = data?.connectors.filter((c) => c.status === "degraded" || c.status === "disconnected").length ?? 0;

  return (
    <AppShell title="Integrations">
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <ModuleCard
            heading="Integration Hub"
            description={
              data
                ? `${connected} connected · ${degraded} need attention out of ${data.connectors.length} connectors`
                : "Loading..."
            }
          >
            <Button onClick={() => void load()}>{loading ? "Refreshing..." : "Refresh All"}</Button>
          </ModuleCard>
          <ModuleCard
            heading="Degraded Connectors"
            description={
              data
                ? data.connectors
                    .filter((c) => c.status === "degraded" || c.status === "disconnected")
                    .map((c) => c.name)
                    .join(", ") || "All connectors operational"
                : "—"
            }
          />
          <ModuleCard
            heading="Last Sync Summary"
            description={
              data
                ? `${data.connectors.filter((c) => c.lastSyncAt).length} connectors synced · ${data.connectors.reduce((s, c) => s + (c.recentLogs[0]?.errorCount ?? 0), 0)} errors`
                : "—"
            }
          />
        </div>

        {data ? (
          <>
            <p className="label-track">Connector Status Board</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.connectors.map((connector) => {
                const busy = busyId === connector.connectorId;
                const log = connector.recentLogs[0];
                return (
                  <div
                    key={connector.connectorId}
                    className={cn(
                      "rounded border bg-surface p-4",
                      connector.status === "degraded" || connector.status === "disconnected"
                        ? "border-[#8B6914]"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base">{kindIcon[connector.kind] ?? "⬡"}</span>
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-xs font-medium",
                              statusStyle[connector.status]
                            )}
                          >
                            {connector.status}
                          </span>
                          <span className="font-mono text-xs text-text-muted">{connector.vendor}</span>
                        </div>
                        <p className="mt-1 font-medium">{connector.name}</p>
                        {connector.errorMessage && (
                          <p className="mt-1 text-sm text-[#8B2F2F]">{connector.errorMessage}</p>
                        )}
                        {log && (
                          <p className="mt-1 text-xs text-text-muted">
                            Last sync {new Date(log.startedAt).toLocaleTimeString()} · {log.recordsSync} records · {log.errorCount} errors
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {(connector.status === "degraded" || connector.status === "disconnected") && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void onRetry(connector.connectorId)}
                          >
                            {busy ? "..." : "Retry"}
                          </Button>
                        )}
                        {connector.status === "connected" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => void onSync(connector.connectorId)}
                          >
                            {busy ? "..." : "Sync Now"}
                          </Button>
                        )}
                        {connector.status === "syncing" && (
                          <span className="text-xs text-text-muted">Syncing…</span>
                        )}
                      </div>
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
