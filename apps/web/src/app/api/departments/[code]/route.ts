import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { departmentsStore } from '@/lib/synth/admin-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

export const PATCH = auth(async (req, ctx) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const code = ((ctx as { params?: { code?: string } } | undefined)?.params?.code ?? '').toUpperCase();
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch { /* ignore */ }

  // Update in-memory store if present
  const idx = departmentsStore.findIndex(d => d.code === code);
  if (idx !== -1) {
    departmentsStore[idx] = { ...departmentsStore[idx], ...body } as typeof departmentsStore[0];
    return NextResponse.json(departmentsStore[idx]);
  }

  // Forward to backend
  try {
    const res = await fetch(`${IDENTITY_SERVICE_URL}/api/departments/${code}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${req.auth.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.text();
    return new NextResponse(data, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch {
    // Synth success for seed departments (demo mode)
    return NextResponse.json({ code, ...body });
  }
});
