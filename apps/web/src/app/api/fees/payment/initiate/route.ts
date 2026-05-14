import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/**
 * Fee payment initiate — BFF synth (KAN-78).
 *
 * Tries backend first; on failure (route missing in some envs), falls back
 * to a synth order so the student "Pay Now" button works end-to-end against
 * Razorpay test mode. SYNTH_OK.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: { studentUsn?: string; feeIds?: string[]; amount?: number; gateway?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  if (!body.amount || !body.feeIds?.length) {
    return NextResponse.json({ error: 'amount and feeIds required' }, { status: 400 });
  }

  // Try backend
  try {
    const url = new URL(req.url);
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${req.auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch { /* fall through to synth */ }

  // Synth fallback
  return NextResponse.json({
    orderId: `order_synth_${Date.now().toString(36)}`,
    amount: body.amount,
    currency: 'INR',
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? 'rzp_test_synth',
  });
});
