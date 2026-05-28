'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  useAdaptiveQuiz,
  useLmsAssignments,
  useLmsDiscussions,
  useLmsHeartbeat,
} from '@/lib/api/lms';
import { apiPost } from '@/lib/api/client';

interface Props {
  courseId: string;
  lessonId: string;
  lowBandwidth?: boolean;
}

export function LessonExtensionsPanel({ courseId, lessonId, lowBandwidth }: Props) {
  const { data: assignments = [] } = useLmsAssignments(lessonId);
  const { data: discussions = [] } = useLmsDiscussions(lessonId);
  const { data: quiz = [] } = useAdaptiveQuiz(courseId);
  const heartbeat = useLmsHeartbeat(courseId, lessonId);
  const [asgnSubmitting, setAsgnSubmitting] = useState(false);
  const [asgnBody, setAsgnBody] = useState('');
  const [discBody, setDiscBody] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      void heartbeat.mutate();
    }, 60_000);
    return () => clearInterval(t);
  }, [heartbeat]);

  const firstAsgn = assignments[0];

  return (
    <div className="space-y-6">
      {lowBandwidth && (
        <p className="rounded bg-[#FFF3CD] px-3 py-2 text-xs text-[#8B6914]">
          Low-bandwidth mode: videos deferred; text and checkpoints prioritized.
        </p>
      )}

      {firstAsgn && (
        <section className="rounded border border-border bg-surface p-4 space-y-2">
          <p className="label-track text-xs">Assignment</p>
          <p className="font-medium text-sm">{firstAsgn.title}</p>
          <textarea
            value={asgnBody}
            onChange={(e) => setAsgnBody(e.target.value)}
            placeholder="Paste code or written answer…"
            className="w-full min-h-[80px] rounded border border-border px-3 py-2 text-sm"
          />
          <Button
            size="sm"
            disabled={!asgnBody.trim() || asgnSubmitting}
            onClick={async () => {
              setAsgnSubmitting(true);
              try {
                const r = await apiPost<{ score?: number; feedback?: string }>(
                  `/api/lms/assignments/${firstAsgn.id}/submit`,
                  { body: asgnBody },
                );
                setQuizResult(`Score: ${Math.round((r.score ?? 0) * 100)}% — ${r.feedback ?? ''}`);
              } finally {
                setAsgnSubmitting(false);
              }
            }}
          >
            Submit assignment
          </Button>
        </section>
      )}

      {quiz.length > 0 && (
        <section className="rounded border border-border bg-surface p-4 space-y-3">
          <p className="label-track text-xs">Adaptive quiz (weak topics)</p>
          {quiz.map((q) => (
            <div key={q.id} className="space-y-1">
              <p className="text-sm">{q.question}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt, i) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setQuizAnswers((a) => ({ ...a, [q.id]: i }))}
                    className={`rounded border px-2 py-1 text-xs ${
                      quizAnswers[q.id] === i ? 'border-[#1C1810] bg-cream-100' : 'border-border'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button
            size="sm"
            onClick={async () => {
              const answers = quiz.map((q) => ({ questionId: q.id, selectedIndex: quizAnswers[q.id] ?? -1 }));
              const res = await apiPost<{ pct: number }>('/api/lms/quizzes/grade', { courseId, answers });
              setQuizResult(`Quiz: ${Math.round((res.pct ?? 0) * 100)}%`);
            }}
          >
            Grade quiz
          </Button>
        </section>
      )}

      <section className="rounded border border-border bg-surface p-4 space-y-2">
        <p className="label-track text-xs">Discussion</p>
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {discussions.map((d) => (
            <li key={d.id} className="text-sm border-b border-border pb-2">
              <span className="text-xs text-text-muted">{d.authorRole}</span>
              <p>{d.body}</p>
            </li>
          ))}
        </ul>
        <input
          value={discBody}
          onChange={(e) => setDiscBody(e.target.value)}
          placeholder="Ask a doubt…"
          className="w-full rounded border border-border px-3 py-2 text-sm"
        />
        <Button
          size="sm"
          onClick={async () => {
            await apiPost(`/api/lms/lessons/${lessonId}/discussions`, { body: discBody });
            setDiscBody('');
          }}
        >
          Post
        </Button>
      </section>

      {quizResult && <p className="text-sm text-[#3D6B4F]">{quizResult}</p>}
    </div>
  );
}
