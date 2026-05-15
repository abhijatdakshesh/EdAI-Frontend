import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

/** POST /api/lms/authoring/draft  body: { courseId, syllabus }
 *  Backend uses Gemini to draft a 5-lesson module. Synth fallback returns
 *  a skeleton based on bullet headings in the syllabus. */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  let body: { courseId?: string; syllabus?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  if (!body.courseId || !body.syllabus) {
    return NextResponse.json({ error: 'courseId + syllabus required' }, { status: 400 });
  }
  try {
    const url = new URL(req.url);
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${req.auth.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch { /* fall through */ }

  // Synth: split syllabus on bullet markers + create 5 placeholder lessons
  const candidates = body.syllabus
    .split(/\n+/)
    .map(s => s.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(s => s.length > 6)
    .slice(0, 5);
  while (candidates.length < 5) candidates.push(`Lesson ${candidates.length + 1}`);
  return NextResponse.json({
    title: `Module — ${body.courseId}`,
    lessons: candidates.map((title, i) => ({
      title,
      topicTags: [title.toLowerCase().replace(/\s+/g, '-').slice(0, 20)],
      markdown: `## ${title}\n\nDraft pending — edit this body. The original syllabus snippet was:\n\n> ${title}`,
      checkpoint: [
        { q: `What is the core idea of "${title}"?`, options: ['A', 'B', 'C', 'D'], correctIndex: 0 },
        { q: `When does "${title}" apply?`, options: ['A', 'B', 'C', 'D'], correctIndex: 1 },
        { q: `Limitation of "${title}"?`, options: ['A', 'B', 'C', 'D'], correctIndex: 2 },
      ],
    })),
  });
});
