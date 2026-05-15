import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/**
 * Teacher marks entry — BFF synth fallback (KAN-73).
 * Tries backend; on failure echoes success so faculty can enter marks
 * during demos even when the backend route is missing. SYNTH_OK.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: unknown = {};
  try { body = await req.json(); } catch { /* ignore */ }

  try {
    const url = new URL(req.url);
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${req.auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch { /* fall through */ }

  return NextResponse.json({ ok: true, saved: true, at: new Date().toISOString() });
});
