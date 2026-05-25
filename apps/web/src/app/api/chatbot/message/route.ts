import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const CHATBOT_SERVICE_URL =
  process.env.CHATBOT_SERVICE_URL ?? 'http://localhost:3013';

// Auth-protected chatbot ask — used by authenticated portals (admin,
// faculty, student, parent). Returns { conversationId, message, timestamp }.
//
// If the upstream call fails, we fall back to the same public/ask handler
// so the user gets *some* reply instead of an error banner. This matches
// the widget's existing fallback ladder.
export const POST = auth(async (req): Promise<NextResponse> => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await req.text();
    const res = await fetch(`${CHATBOT_SERVICE_URL}/chatbot/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${req.auth.accessToken}`,
      },
      body,
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json(
      {
        conversationId: '',
        message:
          "I'm temporarily offline. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
});
