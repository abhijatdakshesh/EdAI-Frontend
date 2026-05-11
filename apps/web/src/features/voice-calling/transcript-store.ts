import { create } from 'zustand';
import type { Turn } from './types';

interface CallTranscript {
  turns: Turn[];
  live: boolean;
  updatedAt: number;
}

interface TranscriptStore {
  byCallId: Record<string, CallTranscript>;
  appendTurn: (callId: string, turn: Turn) => void;
  setLive: (callId: string, live: boolean) => void;
  reset: (callId: string) => void;
}

export const useTranscriptStore = create<TranscriptStore>((set) => ({
  byCallId: {},
  appendTurn: (callId, turn) =>
    set((state) => {
      const existing = state.byCallId[callId] ?? { turns: [], live: true, updatedAt: 0 };
      // Dedupe by `${turn}-${role}` — Twilio webhooks can fire duplicates on
      // retry, but PARENT and AI share the same turn index in our protocol so
      // a turn-only dedupe key would drop one half of a legitimate exchange.
      const dedupeKey = (t: Turn) => `${t.turn}-${t.role}`;
      const incomingKey = dedupeKey(turn);
      const filtered = existing.turns.filter((t) => dedupeKey(t) !== incomingKey);
      const turns = [...filtered, turn].sort((a, b) => a.turn - b.turn);
      return {
        byCallId: {
          ...state.byCallId,
          [callId]: { turns, live: existing.live, updatedAt: Date.now() },
        },
      };
    }),
  setLive: (callId, live) =>
    set((state) => {
      const existing = state.byCallId[callId] ?? { turns: [], live: false, updatedAt: 0 };
      return {
        byCallId: {
          ...state.byCallId,
          [callId]: { ...existing, live, updatedAt: Date.now() },
        },
      };
    }),
  reset: (callId) =>
    set((state) => {
      const next = { ...state.byCallId };
      delete next[callId];
      return { byCallId: next };
    }),
}));

const EMPTY_TURNS: Turn[] = [];

export function useCallTurns(callId: string): Turn[] {
  // Use a stable empty array reference so React doesn't loop on getSnapshot.
  return useTranscriptStore((s) => s.byCallId[callId]?.turns ?? EMPTY_TURNS);
}

export function useCallLive(callId: string): boolean {
  return useTranscriptStore((s) => s.byCallId[callId]?.live ?? false);
}
