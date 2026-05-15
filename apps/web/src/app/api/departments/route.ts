import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { departmentsStore, type StoredDepartment } from '@/lib/synth/admin-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/** Department list — merges backend with synth store (KAN-72/KAN-57 sibling). */
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
  } catch { /* fall through */ }
  return NextResponse.json([...backendList, ...departmentsStore]);
});

/**
 * Department create — BFF synth (KAN-57). Backend `/api/departments` may
 * only expose GET in some envs; admin "Add Department" needs a POST.
 */
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
    code: body.code,
    name: body.name,
    hodUserId: body.hodUserId ?? '',
    established: body.established ?? new Date().getFullYear(),
    active: body.active ?? true,
    createdAt: new Date().toISOString(),
  };
  departmentsStore.push(created);
  return NextResponse.json(created, { status: 201 });
});
