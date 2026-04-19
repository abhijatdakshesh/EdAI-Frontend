/**
 * React Query hooks for Parent-Student communication.
 * Backend: comms service → /api/parent-comms
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationSeverity = "INFO" | "WARNING" | "CRITICAL";
export type NotificationType =
  | "ATTENDANCE_LOW" | "ABSENT_CONSECUTIVE" | "FEE_DUE"
  | "EXAM_RESULT" | "IA_MARKS" | "PLACEMENT_DRIVE" | "ANNOUNCEMENT" | "CALL_SUMMARY";

export interface ParentNotification {
  id: string;
  parentId: string;
  studentUsn: string;
  studentName: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export type MessageStatus = "SENT" | "DELIVERED" | "READ" | "REPLIED";

export interface ParentMessage {
  id: string;
  parentId: string;
  parentName: string;
  studentUsn: string;
  recipientId: string;
  recipientName: string;
  subject: string;
  body: string;
  status: MessageStatus;
  replies: {
    id: string;
    fromId: string;
    fromName: string;
    body: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export type CallOutcome = "ANSWERED" | "NO_ANSWER" | "BUSY" | "FAILED";

export interface AiCallRecord {
  id: string;
  studentUsn: string;
  studentName: string;
  parentPhone: string;
  parentId: string;
  triggeredBy: string;
  language: string;
  calledAt: string;
  duration: number;
  outcome: CallOutcome;
  transcript?: string;
  summary?: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const parentCommsKeys = {
  notifications: (parentId: string) => ["parent-comms", "notifications", parentId] as const,
  messages: (parentId: string) => ["parent-comms", "messages", parentId] as const,
  calls: (parentId: string) => ["parent-comms", "calls", parentId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useParentNotifications(parentId: string) {
  return useQuery<ParentNotification[]>({
    queryKey: parentCommsKeys.notifications(parentId),
    queryFn: () =>
      apiGet<ParentNotification[]>(
        `/api/parent-comms/notifications?parentId=${parentId}`,
      ),
    enabled: !!parentId,
    refetchInterval: 30_000, // poll every 30s for real-time feel
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPatch(`/api/parent-comms/notifications/${id}/read`, {}),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["parent-comms", "notifications"] }),
  });
}

export function useMarkAllNotificationsRead(parentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiPatch(
        `/api/parent-comms/notifications/read-all?parentId=${parentId}`,
        {},
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: parentCommsKeys.notifications(parentId) }),
  });
}

export function useParentMessages(parentId: string) {
  return useQuery<ParentMessage[]>({
    queryKey: parentCommsKeys.messages(parentId),
    queryFn: () =>
      apiGet<ParentMessage[]>(`/api/parent-comms/messages?parentId=${parentId}`),
    enabled: !!parentId,
  });
}

export function useSendParentMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      parentId: string;
      parentName: string;
      studentUsn: string;
      recipientId: string;
      recipientName: string;
      subject: string;
      body: string;
    }) => apiPost<ParentMessage>("/api/parent-comms/messages", payload),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: parentCommsKeys.messages(v.parentId) }),
  });
}

export function useParentCallHistory(parentId: string) {
  return useQuery<AiCallRecord[]>({
    queryKey: parentCommsKeys.calls(parentId),
    queryFn: () =>
      apiGet<AiCallRecord[]>(`/api/parent-comms/calls?parentId=${parentId}`),
    enabled: !!parentId,
  });
}

export function useTriggerParentCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      studentUsn: string;
      studentName: string;
      parentPhone: string;
      parentId: string;
      triggeredBy: string;
      language?: string;
    }) => apiPost<AiCallRecord>("/api/parent-comms/calls/trigger", payload),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: parentCommsKeys.calls(v.parentId) }),
  });
}
