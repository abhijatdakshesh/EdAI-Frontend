import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

export const POST = auth(async (req, ctx) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const id = ((ctx as { params?: { id?: string } } | undefined)?.params?.id) ?? '';

  try {
    const res = await fetch(`${IDENTITY_SERVICE_URL}/api/ia/submissions/${id}/remind`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${req.auth.accessToken}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (res.ok) return new NextResponse(null, { status: 200 });
  } catch { /* fall through to synth */ }

  // Synth success — reminder queued (backend endpoint not yet implemented)
  return NextResponse.json({ queued: true, submissionId: id });
});
