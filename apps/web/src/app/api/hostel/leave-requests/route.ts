import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  let body: { studentUsn?: string; fromDate?: string; toDate?: string; reason?: string } = {};
  try { body = (await req.json()) as typeof body; } catch { /* ignore */ }
  const id = `LV-${Date.now().toString(36).toUpperCase()}`;
  return NextResponse.json({
    ok: true,
    id,
    studentUsn: body.studentUsn ?? 'unknown',
    fromDate: body.fromDate ?? new Date().toISOString().slice(0, 10),
    toDate: body.toDate ?? new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
    reason: (body.reason ?? '').slice(0, 500),
    status: 'PENDING_WARDEN_APPROVAL',
    message: `Leave request ${id} submitted to the hostel warden for approval.`,
  });
});
