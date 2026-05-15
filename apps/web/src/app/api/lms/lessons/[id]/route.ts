import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { findLesson, lmsProgress } from '@/lib/synth/lms-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/** GET /api/lms/lessons/:id — fetch a lesson (with current user's progress). */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop() ?? '';
  try {
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}`, {
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch { /* fall through */ }
  const lesson = findLesson(id);
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const usn = (req.auth as { user?: { sapId?: string; id?: string } } | undefined)?.user?.sapId ?? '';
  const prog = lmsProgress.find(p => p.studentUsn === usn && p.lessonId === id);
  return NextResponse.json({
    ...lesson,
    progress: prog ? { state: prog.state, score: prog.score } : undefined,
  });
});
