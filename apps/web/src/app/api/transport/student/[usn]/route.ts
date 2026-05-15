import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const usn = url.pathname.split('/').filter(Boolean).at(-1) ?? 'unknown';
  // Shape MUST match the TransportInfo interface in
  // src/features/student/hostel-transport.tsx (busNumber, driver as string,
  // driverContact, morningPickup, eveningDrop, feesStatus). The previous
  // payload nested driver as an object, so the UI rendered "No transport
  // allocation found." despite a 200 response.
  return NextResponse.json({
    studentUsn: usn,
    routeName: 'Mysuru Road – Banashankari – Raycraft',
    busNumber: 'KA-04-MA-1428',
    driver: 'Mr. Lokesh',
    driverContact: '+91 98800 11223',
    morningPickup: 'Banashankari Bus Stand · 07:45 AM',
    eveningDrop: 'Raycraft Main Gate · 04:30 PM',
    feesStatus: 'PAID',
  });
});
