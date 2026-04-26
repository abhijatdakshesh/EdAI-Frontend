import { NextRequest, NextResponse } from 'next/server';

const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL ?? 'http://localhost:8090';

export async function GET(req: NextRequest) {
  const callId = req.nextUrl.searchParams.get('callId');
  if (!callId) return NextResponse.json({ error: 'callId required' }, { status: 400 });

  try {
    const res = await fetch(`${VOICE_SERVICE_URL}/voice/calls/${callId}`);
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
