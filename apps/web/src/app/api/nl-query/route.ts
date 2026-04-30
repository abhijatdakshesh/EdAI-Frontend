import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

// NextAuth v5: use auth() wrapper so req.auth is populated
export const POST = auth(async function POST(req) {
  try {
    const accessToken = req.auth?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json() as { query: string };

    const res = await fetch(`${IDENTITY_SERVICE_URL}/api/nl-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query: body.query }),
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
});
