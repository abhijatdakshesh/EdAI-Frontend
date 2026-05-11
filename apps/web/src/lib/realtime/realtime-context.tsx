"use client";

/**
 * Real-time context — wraps Socket.IO connection.
 *
 * Backend must emit:
 *   attendance:update   { classId, studentId, status, timestamp }
 *   marks:update        { studentId, subjectId, type, marks }
 *   announcement:new    { id, title, targetRoles[] }
 *   ai_call:triggered   { parentId, studentId, reason, callId }
 *   vtu:status_change   { studentId, windowId, status }
 *   ia:submission_update { teacherId, subjectId, status }
 *
 * Auth: connect with { auth: { token: accessToken } }
 * Install: pnpm --filter @rv/web add socket.io-client
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranscriptStore } from "@/features/voice-calling/transcript-store";
import type { Turn } from "@/features/voice-calling/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AttendanceUpdateEvent {
  classId: string;
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  timestamp: string;
}

export interface MarksUpdateEvent {
  studentId: string;
  subjectId: string;
  type: string;
  marks: number;
}

export interface AnnouncementEvent {
  id: string;
  title: string;
  targetRoles: string[];
}

export interface AiCallEvent {
  parentId: string;
  studentId: string;
  reason: string;
  callId: string;
}

export interface VTUStatusEvent {
  studentId: string;
  windowId: string;
  status: string;
}

interface RealtimeCtx {
  connected: boolean;
  lastAttendanceUpdate: AttendanceUpdateEvent | null;
  lastAnnouncement: AnnouncementEvent | null;
  lastAiCall: AiCallEvent | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const RealtimeContext = createContext<RealtimeCtx>({
  connected: false,
  lastAttendanceUpdate: null,
  lastAnnouncement: null,
  lastAiCall: null,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const socketRef = useRef<unknown>(null);
  const [connected, setConnected] = useState(false);
  const [lastAttendanceUpdate, setLastAttendanceUpdate] = useState<AttendanceUpdateEvent | null>(null);
  const [lastAnnouncement, setLastAnnouncement] = useState<AnnouncementEvent | null>(null);
  const [lastAiCall, setLastAiCall] = useState<AiCallEvent | null>(null);

  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:3001";

  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;

    let socket: {
      on: (event: string, handler: (data: unknown) => void) => void;
      off: (event: string) => void;
      disconnect: () => void;
      connected: boolean;
    } | null = null;

    // Dynamic import so SSR doesn't break (socket.io-client is browser-only)
    import("socket.io-client").then(({ io }) => {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      }) as typeof socket;

      socketRef.current = socket;

      socket!.on("connect", () => setConnected(true));
      socket!.on("disconnect", () => setConnected(false));
      socket!.on("error", (err: unknown) => {
        console.error("[Realtime] socket error", err);
        setConnected(false);
      });
      // Stop reconnecting on auth rejection — prevents infinite retry loop when token is expired
      socket!.on("connect_error", (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("unauthorized") || msg.includes("invalid") || msg.includes("jwt")) {
          socket?.disconnect();
        }
      });

      socket!.on("attendance:update", (data: unknown) => {
        setLastAttendanceUpdate(data as AttendanceUpdateEvent);
        void qc.invalidateQueries({ queryKey: ["attendance"] });
      });

      socket!.on("marks:update", (data: unknown) => {
        const ev = data as MarksUpdateEvent;
        void qc.invalidateQueries({ queryKey: ["marks", "results", ev.studentId] });
      });

      socket!.on("announcement:new", (data: unknown) => {
        setLastAnnouncement(data as AnnouncementEvent);
        void qc.invalidateQueries({ queryKey: ["comms", "announcements"] });
      });

      socket!.on("ai-call:completed", (data: unknown) => {
        const ev = data as AiCallEvent & { callId?: string };
        setLastAiCall(ev as AiCallEvent);
        if (ev.callId) {
          useTranscriptStore.getState().setLive(ev.callId, false);
        }
        void qc.invalidateQueries({ queryKey: ["parent-comms", "calls"] });
        void qc.invalidateQueries({ queryKey: ["admin-ai-call-logs"] });
      });

      socket!.on("ai-call:turn", (data: unknown) => {
        const payload = data as { callId: string; parentId?: string } & Turn;
        if (!payload?.callId) return;
        // Privacy filter: a parent must only see their OWN call transcripts.
        // ADMIN bypasses (centralised view). When the BE event lacks parentId
        // (legacy emit) we fall through and trust the upstream room-scoped
        // delivery — but logging once helps spot a regression.
        const role = session?.user?.role;
        const myId = session?.user?.id;
        const isAdmin = role === "ADMIN";
        if (!isAdmin && payload.parentId !== undefined && payload.parentId !== myId) {
          return;
        }
        useTranscriptStore.getState().appendTurn(payload.callId, {
          turn: payload.turn,
          role: payload.role,
          text: payload.text,
          language: payload.language,
          ts: payload.ts,
        });
      });

      socket!.on("vtu:window-opened", () => {
        void qc.invalidateQueries({ queryKey: ["vtu"] });
      });

      socket!.on("ia:submission-updated", () => {
        void qc.invalidateQueries({ queryKey: ["ia-submissions"] });
      });
    }).catch(() => {
      // socket.io-client not installed — realtime disabled silently
    });

    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("attendance:update");
        socket.off("marks:update");
        socket.off("announcement:new");
        socket.off("ai-call:completed");
        socket.off("ai-call:turn");
        socket.off("vtu:window-opened");
        socket.off("ia:submission-updated");
        socket.off("connect_error");
        socket.disconnect();
      }
      socketRef.current = null;
      setConnected(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  return (
    <RealtimeContext.Provider value={{ connected, lastAttendanceUpdate, lastAnnouncement, lastAiCall }}>
      {children}
    </RealtimeContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useRealtime() {
  return useContext(RealtimeContext);
}

export function useAttendanceFeed() {
  const { lastAttendanceUpdate } = useRealtime();
  return lastAttendanceUpdate;
}

export function useAnnouncementFeed() {
  const { lastAnnouncement } = useRealtime();
  return lastAnnouncement;
}
