"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getChatbotDashboard, resolveSession } from "./repository";
import type { ChatbotDashboardResponse, ChatbotSession, ChatbotSessionStatus } from "./types";

const langLabel: Record<string, string> = { en: "EN", kn: "KN", hi: "HI", ta: "TA", te: "TE", ml: "ML" };

const statusStyle: Record<ChatbotSessionStatus, string> = {
  active: "bg-[#E6EEF5] text-[#2F567A]",
  resolved: "bg-[#EBF3EE] text-[#3D6B4F]",
  escalated: "bg-[#F5E6E6] text-[#8B2F2F]",
  idle: "bg-[#EAE6DE] text-[#6B6358]"
};

function SessionRow({
  session,
  onResolve,
  busy
}: {
  session: ChatbotSession;
  onResolve?: (id: string) => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded border border-border bg-surface p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-text-muted">{langLabel[session.language]}</span>
          <span className="rounded bg-[#EAE6DE] px-2 py-0.5 text-xs text-text-secondary capitalize">
            {session.userType}
          </span>
          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusStyle[session.status])}>
            {session.status}
          </span>
        </div>
        <p className="mt-0.5 font-medium">{session.userName}</p>
        <p className="text-sm text-text-secondary">
          {session.intent} · {session.messageCount} msgs · Last {new Date(session.lastMessageAt).toLocaleTimeString()}
        </p>
      </div>
      {onResolve && session.status !== "resolved" && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => onResolve(session.sessionId)}>
          {busy ? "..." : "Resolve"}
        </Button>
      )}
    </div>
  );
}

export function ChatbotDashboard() {
  const [data, setData] = useState<ChatbotDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getChatbotDashboard());
    } finally {
      setLoading(false);
    }
  }

  async function onResolve(sessionId: string) {
    setBusyId(sessionId);
    try {
      await resolveSession(sessionId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              activeSessions: prev.activeSessions.map((s) =>
                s.sessionId === sessionId ? { ...s, status: "resolved" as const } : s
              ),
              recentEscalations: prev.recentEscalations.map((s) =>
                s.sessionId === sessionId ? { ...s, status: "resolved" as const } : s
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
    <AppShell title="AI Chatbot">
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-4">
          <ModuleCard heading="Sessions Today" description={data ? String(data.stats.totalSessions) : "..."} />
          <ModuleCard heading="Resolved Today" description={data ? String(data.stats.resolvedToday) : "..."} />
          <ModuleCard heading="Escalations" description={data ? String(data.stats.escalatedToday) : "..."} />
          <ModuleCard heading="Top Intent" description={data?.stats.topIntent ?? "..."}>
            <Button size="sm" variant="ghost" onClick={() => void load()}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </ModuleCard>
        </div>

        {data ? (
          <>
            <p className="label-track">Active Sessions ({data.activeSessions.length})</p>
            <div className="space-y-2">
              {data.activeSessions.length === 0 ? (
                <p className="text-sm text-text-muted">No active sessions</p>
              ) : (
                data.activeSessions.map((s) => (
                  <SessionRow
                    key={s.sessionId}
                    session={s}
                    onResolve={(id) => void onResolve(id)}
                    busy={busyId === s.sessionId}
                  />
                ))
              )}
            </div>

            <p className="label-track">Recent Escalations</p>
            <div className="space-y-2">
              {data.recentEscalations.map((s) => (
                <SessionRow
                  key={s.sessionId}
                  session={s}
                  onResolve={(id) => void onResolve(id)}
                  busy={busyId === s.sessionId}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
