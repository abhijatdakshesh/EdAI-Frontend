import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const usn = url.pathname.split('/').filter(Boolean).at(-1) ?? 'unknown';
  // Shape MUST match the HostelInfo interface in
  // src/features/student/hostel-transport.tsx — that component reads each
  // field by its exact key. Earlier the synth route returned a different
  // shape (block, warden{name,phone}, roommates[]) which left the UI
  // showing "No hostel allocation found." even though the request 200ed.
  return NextResponse.json({
    studentUsn: usn,
    block: 'Boys Hostel — Block C',
    roomNumber: 'C-204',
    bedNumber: 'B2',
    floor: '2nd Floor',
    warden: 'Mr. Arun Kumar',
    wardenContact: '+91 80 6717 8994',
    messType: 'Vegetarian',
    feesStatus: 'PAID',
  });
});
