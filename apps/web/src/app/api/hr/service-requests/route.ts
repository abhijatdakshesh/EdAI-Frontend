import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const VALID_TYPES = new Set([
  'BONAFIDE', 'TRANSFER', 'CHARACTER', 'FEE_RECEIPT_DUPLICATE',
  'NOC_INTERNSHIP', 'SCHOLARSHIP_VERIFICATION',
]);

const ETA: Record<string, string> = {
  BONAFIDE: '3 working days',
  TRANSFER: '7 working days',
  CHARACTER: '5 working days',
  FEE_RECEIPT_DUPLICATE: '1 working day',
  NOC_INTERNSHIP: '2 working days',
  SCHOLARSHIP_VERIFICATION: '3 working days',
};

/**
 * Student certificate / NOC service request — handled in BFF.
 * Returns a request id and ETA so the student gets immediate confirmation.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: { type?: string } = {};
  try { body = (await req.json()) as { type?: string }; } catch { /* ignore */ }
  const type = String(body.type ?? '').toUpperCase().replace(/[\s-]/g, '_');
  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: `Unknown service type: ${type}` }, { status: 400 });
  }
  const requestId = `SVC-${Date.now().toString(36).toUpperCase()}`;
  return NextResponse.json({
    ok: true,
    requestId,
    type,
    status: 'PENDING',
    eta: ETA[type] ?? '5 working days',
    message: `Request ${requestId} (${type}) received. Expected processing time: ${ETA[type] ?? '5 working days'}.`,
  });
});
