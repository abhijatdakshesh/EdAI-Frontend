import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { lmsModules, resolveCollegeId } from '@/lib/synth/lms-store';
import { proxyLmsGet, proxyLmsMutation } from '@/lib/api/lms-proxy';

/** GET /api/lms/modules?courseId=CS501 — identity-first; synth only if API down. */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const courseId = url.searchParams.get('courseId');
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  const res = await proxyLmsGet(`${url.pathname}${url.search}`, req.auth.accessToken);
  if (res?.ok) return NextResponse.json(await res.json());
  const collegeId = resolveCollegeId(req);
  return NextResponse.json(
    lmsModules.filter(m => m.courseId === courseId && m.collegeId === collegeId),
  );
});

/** POST /api/lms/modules — create a module (faculty co-pilot). */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  let body: { courseId?: string; title?: string; description?: string; order?: number; published?: boolean } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  if (!body.courseId || !body.title) return NextResponse.json({ error: 'courseId + title required' }, { status: 400 });
  const url = new URL(req.url);
  const res = await proxyLmsMutation(url.pathname, req.auth.accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (res?.ok) return NextResponse.json(await res.json(), { status: res.status });
  const id = `mod-${Date.now().toString(36)}`;
  const collegeId = resolveCollegeId(req);
  const created = {
    id,
    collegeId,
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
