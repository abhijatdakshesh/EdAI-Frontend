import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { resolveCollegeId } from '@/lib/synth/lms-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/**
 * GET /api/lms/features — returns the per-college feature flag bag
 * { collegeId, features: { lms_assignments, lms_quizzes, ... } }.
 *
 * Backend reads from `colleges.features` JSONB once Postgres tenancy lands;
 * synth fallback returns "everything on" so the demo flow works.
 */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  try {
    const url = new URL(req.url);
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}`, {
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch { /* fall through */ }
  const collegeId = resolveCollegeId(req);
  return NextResponse.json({
    collegeId,
    features: {
      lms_assignments: true,
      lms_quizzes: true,
      lms_discussions: true,
      lms_voice_tutor: true,
      lms_revision_call: true,
      lms_parent_digest: true,
      vtu_integration: true,
    },
  });
});
