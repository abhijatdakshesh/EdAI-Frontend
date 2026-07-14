import { NextResponse } from 'next/server';

const CHATBOT_SERVICE_URL =
  process.env.CHATBOT_SERVICE_URL ?? 'http://localhost:3013';

// Unauthenticated chatbot ask — proxies the body to the backend chatbot
// service. The backend falls back to a deterministic offline reply if the
// ai-engine is unreachable, so this route should never return a 5xx for
// transient backend issues.
//
// Pairs with `EdAI-Backend` PR that adds `POST /chatbot/public/ask`.
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.text();
    const res = await fetch(`${CHATBOT_SERVICE_URL}/chatbot/public/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        message:
          "I'm temporarily offline. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
