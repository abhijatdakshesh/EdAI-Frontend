import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { lmsProgress, resolveCollegeId } from '@/lib/synth/lms-store';
import { proxyLmsGet } from '@/lib/api/lms-proxy';

/** GET /api/lms/progress?courseId=CS501 */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const res = await proxyLmsGet(`${url.pathname}${url.search}`, req.auth.accessToken);
  if (res?.ok) return NextResponse.json(await res.json());
  const collegeId = resolveCollegeId(req);
  const usn = (req.auth as { user?: { sapId?: string } } | undefined)?.user?.sapId ?? 'demo';
  return NextResponse.json(
    lmsProgress.filter(p => p.collegeId === collegeId && p.studentUsn === usn),
  );
});
