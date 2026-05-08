import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const usn = url.pathname.split('/').filter(Boolean).at(-1) ?? 'unknown';
  return NextResponse.json({
    studentUsn: usn,
    block: 'Boys Hostel — Block C',
    roomNumber: 'C-204',
    roommates: ['Karthik Reddy (1RV21CS003)', 'Rohit Kumar (1RV21IS012)'],
    warden: { name: 'Mr. Arun Kumar', phone: '+91 80 6717 8994', email: 'arun.k@rvce.edu' },
    feeStatus: 'PAID',
    rulesUrl: 'https://rvce.edu.in/hostel-rules.pdf',
    pendingComplaints: 0,
    upcomingLeaves: [],
  });
});
