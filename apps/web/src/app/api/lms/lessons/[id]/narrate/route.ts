import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { findLesson } from '@/lib/synth/lms-store';
import { proxyLmsMutation } from '@/lib/api/lms-proxy';

/** POST /api/lms/lessons/:id/narrate — identity + Sarvam; browser TTS fallback if API down. */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const lessonId = url.pathname.split('/').slice(-2, -1)[0] ?? '';
  let body: { lang?: 'en' | 'hi' | 'kn' | 'ta' | 'te' } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const lang = body.lang ?? 'en';

  const res = await proxyLmsMutation(url.pathname, req.auth.accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (res?.ok) return NextResponse.json(await res.json());

  const lesson = findLesson(lessonId);
  const text = lesson?.contentBlocks.find(b => b.kind === 'MARKDOWN')?.data ?? '';
  return NextResponse.json({
    audioUrl: null,
    lang,
    fallbackText: text,
    useBrowserTts: true,
  });
});
