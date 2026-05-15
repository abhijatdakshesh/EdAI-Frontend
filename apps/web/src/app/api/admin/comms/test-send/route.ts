import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Send test communication message — BFF synth (KAN-62).
 * Stubs success so the "Send Test" button in Comms Settings works.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: { recipient?: string; templateId?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  if (!body.recipient) {
    return NextResponse.json({ error: 'recipient required' }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    messageId: `msg-${Date.now().toString(36)}`,
    recipient: body.recipient,
    templateId: body.templateId,
    sentAt: new Date().toISOString(),
  });
});
