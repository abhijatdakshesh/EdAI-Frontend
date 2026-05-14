import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { departmentsStore, type StoredDepartment } from '@/lib/synth/admin-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

const SEED_DEPARTMENTS: StoredDepartment[] = [
  { code: 'CSE', name: 'Computer Science & Engineering', hodUserId: 'hod-cse-01', established: 1963, active: true, createdAt: '2024-01-01T00:00:00Z' },
  { code: 'ECE', name: 'Electronics & Communication Engineering', hodUserId: 'hod-ece-01', established: 1963, active: true, createdAt: '2024-01-01T00:00:00Z' },
  { code: 'ME', name: 'Mechanical Engineering', hodUserId: 'hod-me-01', established: 1963, active: true, createdAt: '2024-01-01T00:00:00Z' },
  { code: 'CV', name: 'Civil Engineering', hodUserId: 'hod-cv-01', established: 1965, active: true, createdAt: '2024-01-01T00:00:00Z' },
  { code: 'EEE', name: 'Electrical & Electronics Engineering', hodUserId: 'hod-eee-01', established: 1970, active: true, createdAt: '2024-01-01T00:00:00Z' },
  { code: 'ISE', name: 'Information Science & Engineering', hodUserId: 'hod-ise-01', established: 1998, active: true, createdAt: '2024-01-01T00:00:00Z' },
  { code: 'AIML', name: 'Artificial Intelligence & Machine Learning', hodUserId: 'hod-aiml-01', established: 2019, active: true, createdAt: '2024-01-01T00:00:00Z' },
  { code: 'MBA', name: 'Master of Business Administration', hodUserId: 'hod-mba-01', established: 2002, active: false, createdAt: '2024-01-01T00:00:00Z' },
];

export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    return NextResponse.json([...SEED_DEPARTMENTS, ...departmentsStore]);
  }
  try {
    const res = await fetch(`${IDENTITY_SERVICE_URL}/api/departments`, {
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    const data = await res.text();
    return new NextResponse(data, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return NextResponse.json([...SEED_DEPARTMENTS, ...departmentsStore]);
  }
});

export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: Partial<StoredDepartment> = {};
  try {
    body = (await req.json()) as Partial<StoredDepartment>;
  } catch { /* ignore */ }
  if (!body.code || !body.name) {
    return NextResponse.json({ error: 'code and name are required' }, { status: 400 });
  }
  const created: StoredDepartment = {
    code: body.code.toUpperCase(),
    name: body.name,
    hodUserId: body.hodUserId ?? '',
    established: body.established ?? new Date().getFullYear(),
    active: true,
    createdAt: new Date().toISOString(),
  };
  departmentsStore.push(created);
  return NextResponse.json(created, { status: 201 });
});
