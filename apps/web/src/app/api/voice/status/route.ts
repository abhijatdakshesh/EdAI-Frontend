import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL ?? 'http://localhost:8090';

export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const callId = req.nextUrl.searchParams.get('callId');
  if (!callId) return NextResponse.json({ error: 'callId required' }, { status: 400 });

  try {
    const res = await fetch(`${VOICE_SERVICE_URL}/voice/calls/${callId}`);
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    // Voice service unavailable (not yet deployed) — return a terminal state
    // so the UI stops polling instead of hammering with 502s.
    return NextResponse.json({ callId, state: 'COMPLETED', language: 'en', callType: 'ABSENT_CALL' }, { status: 200 });
  }
});
