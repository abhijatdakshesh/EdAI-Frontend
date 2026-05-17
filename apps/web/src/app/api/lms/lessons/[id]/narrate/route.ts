import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { findLesson } from '@/lib/synth/lms-store';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/** POST /api/lms/lessons/:id/narrate  body: { lang: 'en'|'hi'|'kn'|'ta'|'te' }
 *  Returns: { audioUrl, lang }.
 *  Backend proxies through to Sarvam via the existing comms audio store;
 *  synth fallback returns the Web Speech API hint (handled by client). */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const lessonId = url.pathname.split('/').slice(-2, -1)[0] ?? '';
  let body: { lang?: 'en' | 'hi' | 'kn' | 'ta' | 'te' } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const lang = body.lang ?? 'en';

  try {
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${req.auth.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch { /* fall through */ }

  // Synth: hand the client the lesson text + a hint that it should use
  // window.speechSynthesis (browser TTS) until Sarvam is wired.
  const lesson = findLesson(lessonId);
  const text = lesson?.contentBlocks.find(b => b.kind === 'MARKDOWN')?.data ?? '';
  return NextResponse.json({
    audioUrl: null,
    lang,
    fallbackText: text,
    useBrowserTts: true,
  });
});
