import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { findLesson } from '@/lib/synth/lms-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

const synthCache = new Map<string, string>();

/** POST /api/lms/lessons/:id/eli5  body: { level: 'beginner'|'intermediate'|'advanced' }
 *  Backend-first; synth returns a level-prefixed copy of the lesson body so the UX
 *  works in demos without Gemini. */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const lessonId = url.pathname.split('/').slice(-2, -1)[0] ?? '';
  let body: { level?: 'beginner' | 'intermediate' | 'advanced' } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const level = body.level ?? 'beginner';

  try {
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${req.auth.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch { /* fall through */ }

  const key = `${lessonId}:${level}`;
  if (synthCache.has(key)) return NextResponse.json({ markdown: synthCache.get(key), level });
  const lesson = findLesson(lessonId);
  const body0 = lesson?.contentBlocks.find(b => b.kind === 'MARKDOWN')?.data ?? '';
  const prefix = level === 'beginner'
    ? `> **Explain Like I'm 12:** plain words only, with one tiny example.\n\n`
    : level === 'advanced'
    ? `> **Senior-engineer brief:** dense, precise, no hand-holding.\n\n`
    : `> **Undergrad-level:** standard textbook tone.\n\n`;
  const out = prefix + body0;
  synthCache.set(key, out);
  return NextResponse.json({ markdown: out, level });
});
