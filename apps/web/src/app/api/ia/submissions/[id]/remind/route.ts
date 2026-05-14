import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * IA Reminder — BFF synth (KAN-63). Backend `/api/ia/submissions/:id/remind`
 * is missing; this stubs success so the admin "Send Reminder" button works
 * end-to-end. SYNTH_OK — replace once notifications service is wired.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, sentAt: new Date().toISOString() });
});
