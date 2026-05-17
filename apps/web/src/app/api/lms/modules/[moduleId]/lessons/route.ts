import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { lmsLessons, resolveCollegeId } from '@/lib/synth/lms-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/** GET /api/lms/modules/:moduleId/lessons — list lessons for a module. */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const moduleId = url.pathname.split('/').slice(-2, -1)[0] ?? '';
  try {
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}`, {
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return NextResponse.json(data);
    }
  } catch { /* fall through */ }
  const collegeId = resolveCollegeId(req);
  return NextResponse.json(
    lmsLessons
      .filter(l => l.moduleId === moduleId && l.collegeId === collegeId)
      .sort((a, b) => a.order - b.order),
  );
});
