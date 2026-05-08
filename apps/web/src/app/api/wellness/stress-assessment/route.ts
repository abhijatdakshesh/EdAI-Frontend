import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  let body: { responses?: Record<string, number> | unknown[] } = {};
  try { body = (await req.json()) as typeof body; } catch { /* ignore */ }
  const values = Array.isArray(body.responses)
    ? (body.responses as number[])
    : Object.values(body.responses ?? {}) as number[];
  const avg = values.length ? values.reduce((a, b) => a + Number(b || 0), 0) / values.length : 3;
  const score = Math.round(avg * 20);
  const level = score < 40 ? 'LOW' : score < 70 ? 'MEDIUM' : 'HIGH';
  const recommendations = level === 'LOW'
    ? ['Keep up your healthy habits!']
    : level === 'MEDIUM'
    ? ['Try mindfulness exercises', 'Maintain a study schedule', 'Sleep 7+ hours/night']
    : ['Book a counselor session', 'Practice deep-breathing daily', 'Reach out to a friend or family'];
  return NextResponse.json({
    ok: true,
    score,
    level,
    recommendations,
    submittedAt: new Date().toISOString(),
  });
});
