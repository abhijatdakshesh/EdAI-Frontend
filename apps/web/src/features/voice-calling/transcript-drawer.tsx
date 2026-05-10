'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useCallLive, useCallTurns } from './transcript-store';

interface Props {
  callId: string;
  /** Optional override — if not passed, reads `live` from store. */
  live?: boolean;
}

const LANG_LABEL: Record<string, string> = { en: 'EN', kn: 'KN', hi: 'HI', ta: 'TA', te: 'TE' };

export function TranscriptDrawer({ callId, live: liveOverride }: Props) {
  const turns = useCallTurns(callId);
  const liveStored = useCallLive(callId);
  const live = liveOverride ?? liveStored;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns.length]);

  return (
    <div
      className="space-y-2"
      data-testid="transcript-drawer"
      aria-label={`Conversation transcript for call ${callId}`}
    >
      <div className="flex items-center gap-2">
        <p className="label-track text-xs">Conversation</p>
        {live ? (
          <span
            data-testid="transcript-live-pill"
            className="inline-flex items-center gap-1 rounded-full bg-[#F5E6E6] px-2 py-0.5 text-[10px] font-medium text-[#8B2F2F]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#8B2F2F]" /> Live
          </span>
        ) : (
          <span
            data-testid="transcript-completed-pill"
            className="inline-flex items-center gap-1 rounded-full bg-[#EBF3EE] px-2 py-0.5 text-[10px] font-medium text-[#3D6B4F]"
          >
            Completed
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="max-h-64 space-y-2 overflow-y-auto rounded border border-border bg-surface p-3"
      >
        {turns.length === 0 && (
          <p className="text-xs text-text-muted">Waiting for the call to start…</p>
        )}
        {turns.map((t) => (
          <div
            key={`${t.turn}-${t.role}`}
            data-testid={`transcript-bubble-${t.role.toLowerCase()}`}
            data-role={t.role}
            className={cn(
              'flex',
              t.role === 'AI' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                t.role === 'AI'
                  ? 'bg-cream-100 text-text-primary'
                  : 'bg-[#E6EEF5] text-[#2F567A]',
              )}
            >
              <div className="mb-0.5 flex items-center gap-2 text-[10px] uppercase tracking-wide opacity-70">
                <span>{t.role === 'AI' ? 'EdAI' : 'Parent'}</span>
                <span>{LANG_LABEL[t.language] ?? t.language}</span>
              </div>
              <p className="whitespace-pre-wrap">{t.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
