"use client";

/**
 * Live parent portal features (API-connected):
 *  - ParentNotificationFeed — real-time alerts with severity levels
 *  - ParentCallsLive — AI call history from comms service
 *  - ParentMessagesLive — messages with replies
 */

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useParentNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useParentCallHistory,
  useParentMessages,
  useSendParentMessage,
  type ParentNotification,
  type ParentMessage,
  type NotificationSeverity,
} from "@/lib/api/parent-comms";

// Parent ID would come from session in production
const PARENT_ID = "u-parent-01";
const PARENT_NAME = "Ramesh Sharma";
const STUDENT_USN = "1RV21CS001";

// ─── Severity config ─────────────────────────────────────────────────────────

const severityConfig: Record<NotificationSeverity, {
  border: string; badge: string; icon: string;
}> = {
  CRITICAL: {
    border: "border-l-[#8B2F2F]",
    badge: "bg-[#F5E6E6] text-[#8B2F2F]",
    icon: "🚨",
  },
  WARNING: {
    border: "border-l-[#8B6914]",
    badge: "bg-[#F5EDDB] text-[#8B6914]",
    icon: "⚠️",
  },
  INFO: {
    border: "border-l-[#2F567A]",
    badge: "bg-[#E6EEF5] text-[#2F567A]",
    icon: "ℹ️",
  },
};

// ─── ParentNotificationFeed ──────────────────────────────────────────────────

export function ParentNotificationFeed() {
  const [filterSeverity, setFilterSeverity] = useState<NotificationSeverity | "ALL">("ALL");

  const { data: notifications = [], isLoading } = useParentNotifications(PARENT_ID);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead(PARENT_ID);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered =
    filterSeverity === "ALL"
      ? notifications
      : notifications.filter((n) => n.severity === filterSeverity);

  return (
    <AppShell title="Notifications">
      <div className="grid gap-5 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up"}
            </p>
            <p className="text-xs text-text-muted">
              Alerts about {STUDENT_USN}'s attendance, fees, exams, and more
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "CRITICAL", "WARNING", "INFO"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                filterSeverity === s
                  ? "bg-[#1C1810] text-[#F2EFE9]"
                  : "bg-cream-200 text-text-muted hover:bg-cream-300",
              )}
            >
              {s === "ALL"
                ? `All (${notifications.length})`
                : `${s} (${notifications.filter((n) => n.severity === s).length})`}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="grid gap-2">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded border border-border bg-surface p-4 h-20 animate-pulse"
              />
            ))}
          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-sm text-text-muted py-8">
              No notifications found.
            </p>
          )}
          {filtered.map((n) => {
            const cfg = severityConfig[n.severity];
            return (
              <div
                key={n.id}
                className={cn(
                  "rounded border-l-4 border border-border bg-surface p-4 transition-opacity",
                  cfg.border,
                  n.read && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{cfg.icon}</span>
                      <p className={cn("font-medium text-sm", !n.read && "text-text-primary")}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-[#2F567A] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      {n.body}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(n.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={cn("rounded px-2 py-0.5 text-xs font-medium", cfg.badge)}>
                      {n.severity}
                    </span>
                    {!n.read && (
                      <button
                        className="text-xs text-text-muted hover:text-text-primary"
                        onClick={() => markRead.mutate(n.id)}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

// ─── ParentCallsLive ─────────────────────────────────────────────────────────

export function ParentCallsLive() {
  const { data: calls = [], isLoading } = useParentCallHistory(PARENT_ID);

  const answered = calls.filter((c) => c.outcome === "ANSWERED").length;
  const missed = calls.filter((c) => c.outcome !== "ANSWERED").length;

  return (
    <AppShell title="AI Call History">
      <div className="grid gap-5 max-w-2xl">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Calls", value: isLoading ? "—" : calls.length },
            { label: "Answered", value: isLoading ? "—" : answered },
            { label: "Missed", value: isLoading ? "—" : missed },
          ].map((s) => (
            <div key={s.label} className="rounded border border-border bg-surface p-4">
              <p className="label-track">{s.label}</p>
              <p className="text-2xl font-light mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-2">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded border border-border bg-surface p-4 h-20 animate-pulse" />
            ))}
          {!isLoading && calls.length === 0 && (
            <p className="text-center text-sm text-text-muted py-8">No AI calls on record.</p>
          )}
          {calls.map((c) => (
            <div key={c.id} className="rounded border border-border bg-surface p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{(c.triggeredBy ?? "GENERAL").replace(/_/g, " ")}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(c.calledAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · {c.language.toUpperCase()} · {c.duration}s
                  </p>
                  {c.summary && (
                    <p className="text-xs text-text-secondary mt-2 p-2 rounded bg-cream-100">
                      {c.summary}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-xs font-medium shrink-0 ml-3",
                    c.outcome === "ANSWERED"
                      ? "bg-[#EBF3EE] text-[#3D6B4F]"
                      : "bg-[#F5E6E6] text-[#8B2F2F]",
                  )}
                >
                  {c.outcome}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ─── ParentMessagesLive ──────────────────────────────────────────────────────

export function ParentMessagesLive() {
  const { data: messages = [], isLoading } = useParentMessages(PARENT_ID);
  const sendMessage = useSendParentMessage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [compose, setCompose] = useState({
    recipientId: "u-faculty-01",
    recipientName: "Rajesh Kumar",
    subject: "",
    body: "",
  });

  const selected = messages.find((m) => m.id === selectedId) ?? messages[0];

  function handleSend() {
    sendMessage.mutate(
      {
        parentId: PARENT_ID,
        parentName: PARENT_NAME,
        studentUsn: STUDENT_USN,
        ...compose,
      },
      {
        onSuccess: (msg) => {
          setShowCompose(false);
          setCompose({ recipientId: "u-faculty-01", recipientName: "Rajesh Kumar", subject: "", body: "" });
          setSelectedId(msg.id);
        },
      },
    );
  }

  return (
    <AppShell title="Messages">
      <div className="grid gap-5">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowCompose(true)}>
            + New Message
          </Button>
        </div>

        {showCompose && (
          <div className="rounded border border-[#1C1810] bg-surface p-5 max-w-lg grid gap-3">
            <p className="font-medium">New Message</p>
            <input
              type="text"
              placeholder="Subject"
              value={compose.subject}
              onChange={(e) => setCompose({ ...compose, subject: e.target.value })}
              className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
            />
            <textarea
              rows={4}
              placeholder="Your message…"
              value={compose.body}
              onChange={(e) => setCompose({ ...compose, body: e.target.value })}
              className="rounded border border-border bg-white px-3 py-2 text-sm focus:outline-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!compose.subject || !compose.body || sendMessage.isPending}
                onClick={handleSend}
              >
                {sendMessage.isPending ? "Sending…" : "Send"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCompose(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          {/* Message list */}
          <div className="grid gap-2">
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded border border-border bg-surface p-4 h-20 animate-pulse" />
            ))}
            {!isLoading && messages.length === 0 && (
              <p className="text-sm text-text-muted py-4">No messages yet.</p>
            )}
            {messages.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={cn(
                  "rounded border p-4 text-left transition-colors hover:border-[#1C1810]",
                  selected?.id === m.id
                    ? "border-[#1C1810] bg-cream-100"
                    : "border-border bg-surface",
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {m.status === "SENT" && (
                        <span className="h-2 w-2 rounded-full bg-[#2F567A] shrink-0" />
                      )}
                      <p className="font-medium text-sm">{m.subject}</p>
                    </div>
                    <p className="text-xs text-text-muted">
                      To: {m.recipientName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">
                      {new Date(m.createdAt).toLocaleDateString("en-IN")}
                    </p>
                    <span className={cn("rounded px-1.5 py-0.5 text-xs",
                      m.status === "REPLIED"
                        ? "bg-[#EBF3EE] text-[#3D6B4F]"
                        : "bg-cream-200 text-text-muted")}>
                      {m.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                  {m.body}
                </p>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected ? (
            <div className="rounded border border-border bg-surface p-5 self-start sticky top-4">
              <p className="font-medium">{selected.subject}</p>
              <p className="text-xs text-text-muted mb-3">
                To {selected.recipientName} ·{" "}
                {new Date(selected.createdAt).toLocaleDateString("en-IN")}
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">{selected.body}</p>

              {selected.replies.length > 0 && (
                <div className="mt-4 grid gap-2 border-t border-border pt-4">
                  <p className="text-xs label-track">Replies</p>
                  {selected.replies.map((r) => (
                    <div key={r.id} className="rounded bg-cream-100 p-3">
                      <p className="text-xs font-medium">{r.fromName}</p>
                      <p className="text-sm mt-1 text-text-secondary">{r.body}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {new Date(r.createdAt).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted self-start">
              Select a message to view
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
