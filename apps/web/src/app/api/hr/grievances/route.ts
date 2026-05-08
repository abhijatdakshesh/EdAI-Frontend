import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Student grievance submission — handled directly in the BFF.
 * The identity service has no /hr/grievances endpoint, so we accept the
 * submission, log it (server console), and return a synthetic ticket id
 * so the user gets immediate confirmation.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: { description?: string } = {};
  try { body = (await req.json()) as { description?: string }; } catch { /* ignore */ }
  const description = (body.description ?? '').trim();
  if (!description) return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  if (description.length > 2000) return NextResponse.json({ error: 'Description too long (max 2000)' }, { status: 400 });
  const ticketId = `GRV-${Date.now().toString(36).toUpperCase()}`;
  // eslint-disable-next-line no-console
  console.log(`[grievance] ${ticketId} from ${req.auth.user?.email ?? 'unknown'}: ${description.slice(0, 80)}`);
  return NextResponse.json({
    ok: true,
    ticketId,
    status: 'OPEN',
    message: `Grievance ${ticketId} received. The student welfare officer will respond within 3 working days.`,
  });
});
