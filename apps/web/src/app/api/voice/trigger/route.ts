import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL ?? 'http://localhost:8090';
  try {
    const body = await req.json() as {
      studentId: string;
      parentPhone: string;
      language: string;
      callType: string;
      institutionId?: string;
      studentContext?: Record<string, unknown>;
    };

    if (!body.parentPhone) {
      return NextResponse.json({ error: 'parentPhone required' }, { status: 400 });
    }

    const res = await fetch(`${VOICE_SERVICE_URL}/voice/calls/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: body.studentId,
        parentPhone: body.parentPhone,
        language: body.language ?? 'en',
        callType: body.callType ?? 'ABSENT_CALL',
        institutionId: body.institutionId ?? 'RVCE',
        studentContext: body.studentContext ?? { name: body.studentId },
      }),
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
