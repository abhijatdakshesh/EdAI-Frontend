import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { findLesson, lmsProgress, lmsMastery, resolveCollegeId, type ProgressState } from '@/lib/synth/lms-store';
import { proxyLmsMutation } from '@/lib/api/lms-proxy';

/** POST /api/lms/lessons/:id/checkpoint  body: { answers: number[] } */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const url = new URL(req.url);
  const lessonId = url.pathname.split('/').slice(-2, -1)[0] ?? '';
  let body: { answers?: number[] } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const res = await proxyLmsMutation(url.pathname, req.auth.accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (res?.ok) return NextResponse.json(await res.json());
  if (res && !res.ok) {
    return NextResponse.json(await res.json().catch(() => ({ error: res.statusText })), { status: res.status });
  }

  const collegeId = resolveCollegeId(req);
  const lesson = findLesson(lessonId, collegeId);
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const total = lesson.checkpoint.length;
  let score = 0;
  for (let i = 0; i < total; i++) {
    if (body.answers?.[i] === lesson.checkpoint[i]?.correctIndex) score += 1;
  }
  const passed = total > 0 && score / total >= 0.66;
  const state: ProgressState = passed ? 'MASTERED' : 'IN_PROGRESS';
  const usn = (req.auth as { user?: { sapId?: string } } | undefined)?.user?.sapId ?? 'demo';
  const existing = lmsProgress.find(
    p => p.collegeId === collegeId && p.studentUsn === usn && p.lessonId === lessonId,
  );
  if (existing) {
    existing.score = Math.max(existing.score, score);
    existing.attempts += 1;
    if (existing.state !== 'MASTERED') existing.state = state;
  } else {
    lmsProgress.push({ collegeId, studentUsn: usn, lessonId, state, score, attempts: 1 });
  }
  if (state === 'MASTERED') {
    for (const topic of lesson.topicTags) {
      const m = lmsMastery.find(
        x => x.collegeId === collegeId && x.studentUsn === usn && x.topic === topic,
      );
      if (m) m.masteryScore = Math.min(1, m.masteryScore + 0.34);
      else
        lmsMastery.push({
          collegeId,
          studentUsn: usn,
          courseId: 'CS501',
          topic,
          masteryScore: 0.34,
        });
    }
  }
  return NextResponse.json({ score, total, state });
});
