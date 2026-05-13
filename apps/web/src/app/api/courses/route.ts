import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { coursesStore, type StoredCourse } from '@/lib/synth/admin-store';

/**
 * Course create — BFF synth (KAN-32). Backend `/api/courses` only exposes
 * GET + enrollment endpoints; admin "Add Course" needs a POST. SYNTH_OK.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: Partial<StoredCourse> = {};
  try {
    body = (await req.json()) as Partial<StoredCourse>;
  } catch {
    /* ignore */
  }
  if (!body.code || !body.name) {
    return NextResponse.json(
      { error: 'code and name are required' },
      { status: 400 },
    );
  }
  const id = `crs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const created: StoredCourse = {
    id,
    code: body.code,
    name: body.name,
    departmentCode: body.departmentCode ?? 'CSE',
    semester: body.semester ?? 1,
    credits: body.credits ?? 3,
    type: body.type ?? 'THEORY',
    ...(body.syllabusUrl ? { syllabusUrl: body.syllabusUrl } : {}),
    active: true,
    createdAt: new Date().toISOString(),
  };
  coursesStore.push(created);
  return NextResponse.json(created, { status: 201 });
});
