import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { classesStore, type StoredClass } from '@/lib/synth/admin-store';

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
