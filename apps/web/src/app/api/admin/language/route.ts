import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const POST = auth(async function POST(req) {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  return NextResponse.json({ ok: true }, { status: 200 });
});
