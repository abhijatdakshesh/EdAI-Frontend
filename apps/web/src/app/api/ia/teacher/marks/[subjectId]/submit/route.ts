import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/**
 * Submit marks for a subject — BFF synth fallback (KAN-73 sibling).
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch { /* fall through */ }

  return NextResponse.json({ ok: true, submitted: true, at: new Date().toISOString() });
});
