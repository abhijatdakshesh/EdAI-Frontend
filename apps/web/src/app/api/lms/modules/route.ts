import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { lmsModules } from '@/lib/synth/lms-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/** GET /api/lms/modules?courseId=CS501 — list modules for a course.
 *  Backend-first, synth-store fallback. */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const courseId = url.searchParams.get('courseId');
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  try {
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}${url.search}`, {
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return NextResponse.json(data);
    }
  } catch { /* fall through */ }
  return NextResponse.json(lmsModules.filter(m => m.courseId === courseId));
});

/** POST /api/lms/modules — create a module (faculty co-pilot). */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  let body: { courseId?: string; title?: string; description?: string; order?: number; published?: boolean } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  if (!body.courseId || !body.title) return NextResponse.json({ error: 'courseId + title required' }, { status: 400 });
  try {
    const url = new URL(req.url);
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${req.auth.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return NextResponse.json(await res.json(), { status: 201 });
  } catch { /* fall through */ }
  const id = `mod-${Date.now().toString(36)}`;
  const created = {
    id,
    courseId: body.courseId,
    title: body.title,
    ...(body.description ? { description: body.description } : {}),
    order: body.order ?? 0,
    published: body.published ?? false,
    lessonCount: 0,
  };
  lmsModules.push(created);
  return NextResponse.json(created, { status: 201 });
});
