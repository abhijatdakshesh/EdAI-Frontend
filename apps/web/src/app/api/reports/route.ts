import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

export const POST = auth(async function POST(req) {
  try {
    const accessToken = req.auth?.accessToken;
    if (!accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const body = await req.json() as { reportType: string; params: Record<string, unknown> };

    const res = await fetch(`${IDENTITY_SERVICE_URL}/api/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      return NextResponse.json({ error: err.message ?? `Report engine error ${res.status}` }, { status: res.status });
    }

    const zip = await res.arrayBuffer();
    return new NextResponse(zip, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${body.reportType.replace(/[^a-zA-Z0-9_-]/g, '')}-report.zip"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
});

export const GET = auth(async function GET(req) {
  try {
    const accessToken = req.auth?.accessToken;
    if (!accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const url = new URL(req.url);
    const all = url.searchParams.get('all') === 'true';
    const endpoint = all ? '/api/reports/history/all' : '/api/reports/history';

    const res = await fetch(`${IDENTITY_SERVICE_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
});
