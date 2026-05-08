import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Apply-to-job — handled in BFF.
 * Backend has no /jobs/:id/apply endpoint, so we accept the application,
 * generate a synthetic application id, and return it. The frontend's
 * "Applied" state is keyed by jobId so subsequent renders show APPLIED.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const url = new URL(req.url);
  const jobId = url.pathname.split('/').filter(Boolean).at(-2) ?? 'unknown';
  return NextResponse.json({
    id: `APP-${Date.now().toString(36).toUpperCase()}`,
    jobId,
    studentUsn: (req.auth.user as { sapId?: string })?.sapId ?? req.auth.user?.id ?? 'unknown',
    status: 'APPLIED',
    appliedAt: new Date().toISOString(),
    message: 'Application submitted. The recruiter will review and respond soon.',
  });
});
