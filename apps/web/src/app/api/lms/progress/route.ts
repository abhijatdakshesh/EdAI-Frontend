import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { lmsProgress, resolveCollegeId } from '@/lib/synth/lms-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/** GET /api/lms/progress?courseId=CS501 */
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
  const usn = (req.auth as { user?: { sapId?: string } } | undefined)?.user?.sapId ?? 'demo';
  return NextResponse.json(
    lmsProgress.filter(p => p.collegeId === collegeId && p.studentUsn === usn),
  );
});
