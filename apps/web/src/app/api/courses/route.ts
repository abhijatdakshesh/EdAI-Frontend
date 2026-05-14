import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { coursesStore, type StoredCourse } from '@/lib/synth/admin-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

const SEED_COURSES: StoredCourse[] = [
  { id: 'cs-501', code: 'CS501', name: 'Design & Analysis of Algorithms', departmentCode: 'CSE', semester: 5, credits: 4, type: 'THEORY', active: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'cs-502', code: 'CS502', name: 'Database Management Systems', departmentCode: 'CSE', semester: 5, credits: 4, type: 'THEORY', active: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'cs-503', code: 'CS503', name: 'Computer Networks', departmentCode: 'CSE', semester: 5, credits: 3, type: 'THEORY', active: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'cs-504', code: 'CS504', name: 'Software Engineering', departmentCode: 'CSE', semester: 5, credits: 4, type: 'THEORY', active: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'cs-505', code: 'CS505', name: 'DBMS Lab', departmentCode: 'CSE', semester: 5, credits: 1, type: 'LAB', active: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'cs-506', code: 'CS506', name: 'Networks Lab', departmentCode: 'CSE', semester: 5, credits: 1, type: 'LAB', active: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'cs-507', code: 'CS507', name: 'Open Elective: ML Fundamentals', departmentCode: 'CSE', semester: 5, credits: 3, type: 'ELECTIVE', active: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'ma-101', code: 'MA101', name: 'Engineering Mathematics I', departmentCode: 'CSE', semester: 1, credits: 4, type: 'THEORY', active: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'ph-101', code: 'PH101', name: 'Engineering Physics', departmentCode: 'CSE', semester: 1, credits: 4, type: 'THEORY', active: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'cs-101', code: 'CS101', name: 'Programming in C', departmentCode: 'CSE', semester: 1, credits: 3, type: 'THEORY', active: true, createdAt: '2024-01-01T00:00:00Z' },
];

export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    const all = [...SEED_COURSES, ...coursesStore.filter(c => c.active)];
    return NextResponse.json(all);
  }
  try {
    const url = new URL(req.url);
    const res = await fetch(`${IDENTITY_SERVICE_URL}/api/courses${url.search}`, {
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    const data = await res.text();
    return new NextResponse(data, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return NextResponse.json([...SEED_COURSES, ...coursesStore.filter(c => c.active)]);
  }
});

export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: Partial<StoredCourse> = {};
  try {
    body = (await req.json()) as Partial<StoredCourse>;
  } catch { /* ignore */ }
  if (!body.code || !body.name) {
    return NextResponse.json({ error: 'code and name are required' }, { status: 400 });
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

export const DELETE = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  // DELETE /api/courses/:id — handled by catch-all via this route segment
  // For synth-stored courses, remove from store
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  const idx = coursesStore.findIndex(c => c.id === id);
  if (idx !== -1) {
    coursesStore[idx] = { ...coursesStore[idx]!, active: false } as typeof coursesStore[0];
    return new NextResponse(null, { status: 204 });
  }
  // Forward to backend for seed courses
  try {
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    return new NextResponse(null, { status: res.status });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
});
