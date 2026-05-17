import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { lmsMastery, resolveCollegeId } from '@/lib/synth/lms-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/** GET /api/lms/mastery?courseId=CS501 — student topic mastery graph nodes. */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  try {
    const url = new URL(req.url);
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}${url.search}`, {
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch { /* fall through */ }
  const collegeId = resolveCollegeId(req);
  const courseId = new URL(req.url).searchParams.get('courseId') ?? 'CS501';
  const usn = (req.auth as { user?: { sapId?: string } } | undefined)?.user?.sapId ?? 'demo';
  return NextResponse.json(
    lmsMastery.filter(
      m => m.collegeId === collegeId && m.studentUsn === usn && m.courseId === courseId,
    ),
  );
});
