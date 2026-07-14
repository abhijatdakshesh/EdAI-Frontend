import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { findLesson, lmsProgress, resolveCollegeId } from '@/lib/synth/lms-store';
import { proxyLmsGet } from '@/lib/api/lms-proxy';

/** GET /api/lms/lessons/:id — fetch a lesson (with current user's progress). */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop() ?? '';
  const res = await proxyLmsGet(url.pathname, req.auth.accessToken);
  if (res?.ok) return NextResponse.json(await res.json());
  const collegeId = resolveCollegeId(req);
  const lesson = findLesson(id, collegeId);
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const usn = (req.auth as { user?: { sapId?: string; id?: string } } | undefined)?.user?.sapId ?? '';
  const prog = lmsProgress.find(
    p => p.collegeId === collegeId && p.studentUsn === usn && p.lessonId === id,
  );
  return NextResponse.json({
    ...lesson,
    progress: prog ? { state: prog.state, score: prog.score } : undefined,
  });
});
