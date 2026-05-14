import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * IA Confirm — BFF synth (KAN-63 sibling). Backend missing; stub success.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, confirmedAt: new Date().toISOString() });
});
