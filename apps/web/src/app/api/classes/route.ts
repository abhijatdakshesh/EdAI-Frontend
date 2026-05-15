import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { classesStore, type StoredClass } from '@/lib/synth/admin-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/**
 * Class list — merges backend response with synth-stored classes (KAN-72).
 * Newly added classes (POST below) live in-memory only; without merging
 * here, they never appear in the UI list.
 */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let backendList: unknown[] = [];
  try {
    const url = new URL(req.url);
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}${url.search}`, {
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) backendList = data;
      else if (Array.isArray((data as { items?: unknown[] })?.items)) backendList = (data as { items: unknown[] }).items;
    }
  } catch {
    /* fall through with empty backendList — still return synth items */
  }
  return NextResponse.json([...backendList, ...classesStore]);
});

/**
 * Class create — BFF synth (KAN-37).
 *
 * The backend `/api/classes` controller is GET-only. Until the POST
 * endpoint + DB table land we accept submissions here, mint a UUID, and
 * return 201 with the persisted shape. SYNTH_OK.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: Partial<StoredClass> = {};
  try {
    body = (await req.json()) as Partial<StoredClass>;
  } catch {
    /* ignore */
  }
  if (!body.name || !body.departmentCode) {
    return NextResponse.json(
      { error: 'name and departmentCode are required' },
      { status: 400 },
    );
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
