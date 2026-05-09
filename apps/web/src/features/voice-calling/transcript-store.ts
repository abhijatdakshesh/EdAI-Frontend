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
      // Dedupe by turn index — Twilio webhooks can fire duplicates on retry.
      const filtered = existing.turns.filter((t) => t.turn !== turn.turn);
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
