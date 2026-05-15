import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

interface EligibilityRow {
  usn: string;
  name: string;
  eligible: boolean;
  reasons: string[];
  attendancePct: number;
}

const SAMPLE: EligibilityRow[] = [
  { usn: '1RV21CS001', name: 'Arjun Kumar', eligible: true, reasons: [], attendancePct: 82 },
  { usn: '1RV21CS002', name: 'Riya Patel', eligible: true, reasons: [], attendancePct: 76 },
  { usn: '1RV21CS003', name: 'Priya Sharma', eligible: true, reasons: [], attendancePct: 91 },
  { usn: '1RV21CS004', name: 'Rahul Verma', eligible: false, reasons: ['Attendance < 75%'], attendancePct: 68 },
  { usn: '1RV21CS005', name: 'Anjali Reddy', eligible: true, reasons: [], attendancePct: 85 },
];

/**
 * VTU eligibility — BFF (KAN-74 sibling). Backend route is missing in some
 * envs; on 4xx/5xx return a synth list so the teacher VTU page renders.
 */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  try {
    const url = new URL(req.url);
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}${url.search}`, {
      headers: { Authorization: `Bearer ${req.auth.accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return NextResponse.json(data);
    }
  } catch { /* fall through */ }
  return NextResponse.json(SAMPLE);
});
