import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

interface FacultyMember { id: string; name: string; designation: string; email: string }

const MOCK_FACULTY: Record<string, FacultyMember[]> = {
  CSE: [
    { id: 'f-cse-01', name: 'Dr. Ravi Kumar', designation: 'Professor & HOD', email: 'ravi.kumar@rvce.edu.in' },
    { id: 'f-cse-02', name: 'Dr. Anitha Sharma', designation: 'Associate Professor', email: 'anitha.sharma@rvce.edu.in' },
    { id: 'f-cse-03', name: 'Mr. Suresh Babu', designation: 'Assistant Professor', email: 'suresh.babu@rvce.edu.in' },
    { id: 'f-cse-04', name: 'Ms. Priya Nair', designation: 'Assistant Professor', email: 'priya.nair@rvce.edu.in' },
    { id: 'f-cse-05', name: 'Dr. Karthik Reddy', designation: 'Associate Professor', email: 'karthik.reddy@rvce.edu.in' },
  ],
  ECE: [
    { id: 'f-ece-01', name: 'Dr. Meena Iyer', designation: 'Professor & HOD', email: 'meena.iyer@rvce.edu.in' },
    { id: 'f-ece-02', name: 'Mr. Rajesh Patil', designation: 'Assistant Professor', email: 'rajesh.patil@rvce.edu.in' },
    { id: 'f-ece-03', name: 'Dr. Sunita Rao', designation: 'Associate Professor', email: 'sunita.rao@rvce.edu.in' },
  ],
  ME: [
    { id: 'f-me-01', name: 'Dr. Venkatesh Murthy', designation: 'Professor & HOD', email: 'venkatesh.murthy@rvce.edu.in' },
    { id: 'f-me-02', name: 'Mr. Deepak Kumar', designation: 'Assistant Professor', email: 'deepak.kumar@rvce.edu.in' },
  ],
};

export const GET = auth(async (req, ctx) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const code = ((ctx as { params?: { code?: string } } | undefined)?.params?.code ?? '').toUpperCase();

  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    return NextResponse.json(MOCK_FACULTY[code] ?? []);
  }

  try {
    const res = await fetch(`${IDENTITY_SERVICE_URL}/api/departments/${code}/faculty`, {
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    if (res.ok) {
      const data = await res.text();
      return new NextResponse(data, { status: res.status, headers: { 'Content-Type': 'application/json' } });
    }
    return NextResponse.json(MOCK_FACULTY[code] ?? []);
  } catch {
    return NextResponse.json(MOCK_FACULTY[code] ?? []);
  }
});
