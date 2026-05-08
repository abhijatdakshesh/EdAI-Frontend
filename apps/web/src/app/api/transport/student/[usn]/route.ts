import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const usn = url.pathname.split('/').filter(Boolean).at(-1) ?? 'unknown';
  return NextResponse.json({
    studentUsn: usn,
    routeNumber: 'Route 14',
    routeName: 'Mysuru Road – Banashankari – RVCE',
    pickupStop: 'Banashankari Bus Stand (BTM)',
    pickupTime: '07:45 AM',
    dropTime: '04:30 PM',
    busNumber: 'KA-04-MA-1428',
    driver: { name: 'Mr. Lokesh', phone: '+91 98800 11223' },
    liveLocation: { lat: 12.9252, lng: 77.5468, updatedAt: new Date().toISOString(), eta: '12 min' },
    feeStatus: 'PAID',
  });
});
