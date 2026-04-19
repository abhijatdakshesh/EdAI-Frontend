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
        setLastAiCall(data as AiCallEvent);
        void qc.invalidateQueries({ queryKey: ["parent-comms", "calls"] });
        void qc.invalidateQueries({ queryKey: ["admin-ai-call-logs"] });
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
        socket.off("vtu:window-opened");
        socket.off("ia:submission-updated");
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
