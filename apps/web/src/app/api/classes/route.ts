import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { classesStore, type StoredClass } from '@/lib/synth/admin-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

const SEED_CLASSES: StoredClass[] = [
  {
    id: 'cls-cse-5a',
    name: 'CSE 5A — 2024-25',
    departmentCode: 'CSE',
    semester: 5,
    section: 'A',
    strength: 60,
    classTeacherId: 'u-teacher-01',
    academicYear: '2024-25',
    createdAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'cls-cse-5b',
    name: 'CSE 5B — 2024-25',
    departmentCode: 'CSE',
    semester: 5,
    section: 'B',
    strength: 58,
    classTeacherId: 'u-teacher-02',
    academicYear: '2024-25',
    createdAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'cls-ece-3a',
    name: 'ECE 3A — 2024-25',
    departmentCode: 'ECE',
    semester: 3,
    section: 'A',
    strength: 62,
    classTeacherId: 'u-teacher-03',
    academicYear: '2024-25',
    createdAt: '2024-06-01T00:00:00Z',
  },
];

export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    return NextResponse.json([...SEED_CLASSES, ...classesStore]);
  }
  try {
    const url = new URL(req.url);
    const res = await fetch(`${IDENTITY_SERVICE_URL}/api/classes${url.search}`, {
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    const data = await res.text();
    return new NextResponse(data, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return NextResponse.json([...SEED_CLASSES, ...classesStore]);
  }
});

export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: Partial<StoredClass> = {};
  try {
    body = (await req.json()) as Partial<StoredClass>;
  } catch { /* ignore */ }
  if (!body.name || !body.departmentCode) {
    return NextResponse.json({ error: 'name and departmentCode are required' }, { status: 400 });
  }
  const id = `cls-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const created: StoredClass = {
    id,
    name: body.name,
    departmentCode: body.departmentCode,
    semester: body.semester ?? 1,
    section: body.section ?? 'A',
    strength: body.strength ?? 60,
    classTeacherId: body.classTeacherId ?? '',
    academicYear: body.academicYear ?? '2025-26',
    createdAt: new Date().toISOString(),
  };
  classesStore.push(created);
  return NextResponse.json(created, { status: 201 });
});
