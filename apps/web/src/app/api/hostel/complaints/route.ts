import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  let body: { studentUsn?: string; description?: string; category?: string } = {};
  try { body = (await req.json()) as typeof body; } catch { /* ignore */ }
  const id = `HOS-${Date.now().toString(36).toUpperCase()}`;
  return NextResponse.json({
    ok: true,
    id,
    studentUsn: body.studentUsn ?? 'unknown',
    category: body.category ?? 'GENERAL',
    description: (body.description ?? '').slice(0, 500),
    status: 'OPEN',
    raisedAt: new Date().toISOString(),
    eta: '2 working days',
    message: `Complaint ${id} logged with the hostel warden.`,
  });
});
