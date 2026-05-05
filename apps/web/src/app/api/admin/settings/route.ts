import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const PATCH = auth(async function PATCH(req) {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  return NextResponse.json({ ok: true }, { status: 200 });
});
