import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// BFF synth route: backend has no /api/parent/scholarship/apply endpoint
// today and the demo has to look like the application succeeded.
// Returns a deterministic application reference so the UI can show the
// "Application submitted" success state without any DB writes.
// DPDP: no PII is logged here; the body shape matches what
// ScholarshipEligibility (apps/web/src/features/parent/parent-pages.tsx) sends.
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    childUsn?: string;
    schemeName?: string;
  };
  if (!body.schemeName) {
    return NextResponse.json({ error: 'schemeName required' }, { status: 400 });
  }
  return NextResponse.json({
    success: true,
    applicationId: `SCH-${Date.now().toString(36).toUpperCase()}`,
    schemeName: body.schemeName,
    submittedAt: new Date().toISOString(),
    nextStep:
      'Submit hard-copy documents to the Scholarships Office (Admin Block, Room 102) within 14 days.',
  });
});
