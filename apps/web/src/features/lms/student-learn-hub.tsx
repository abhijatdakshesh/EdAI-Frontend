'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/shell';
import { apiGet } from '@/lib/api/client';
import { formatCourseCode } from '@/lib/format/course-code';
import { useLmsStreak, usePlacementLmsRecs } from '@/lib/api/lms';

export interface LearnCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  instructorName: string;
  hasLms: boolean;
  learnUrl: string;
}

export function StudentLearnHub() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student', 'learn', 'courses'],
    queryFn: () => apiGet<{ courses: LearnCourse[] }>('/api/student/learn/courses'),
  });

  const courses = data?.courses ?? [];
  const withLms = courses.filter((c) => c.hasLms);
  const primaryCourse = withLms[0]?.code ?? 'CS501';
  const { data: streak } = useLmsStreak();
  const { data: placementRecs = [] } = usePlacementLmsRecs(primaryCourse);

  return (
    <AppShell title="Learn">
      <div className="max-w-2xl space-y-6">
        <p className="text-sm text-text-secondary">
          Open a course to view modules, lessons, checkpoints, and AI study tools.
          Only courses you are enrolled in appear here.
        </p>
        {streak && streak.currentStreak > 0 && (
          <p className="text-sm text-[#3D6B4F]">🔥 {streak.currentStreak}-day streak (best: {streak.longestStreak})</p>
        )}
        {placementRecs.length > 0 && (
          <div className="rounded border border-[#E6EEF5] bg-[#E6EEF5]/30 p-3 text-sm">
            <p className="label-track text-xs mb-1">Placement prep (weak topics)</p>
            <ul className="list-disc pl-4 text-text-secondary">
              {placementRecs.slice(0, 3).map((r) => (
                <li key={r.topic}>{r.recommendedAction}</li>
              ))}
            </ul>
          </div>
        )}

        {isLoading && (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded border border-border bg-surface" />
            ))}
          </div>
        )}

        {error && (
          <p className="rounded bg-[#F5E6E6] px-3 py-2 text-sm text-[#8B2F2F]">
            Could not load courses. Make sure you are logged in and the API is running.
          </p>
        )}

        {!isLoading && withLms.length === 0 && (
          <div className="rounded border border-border bg-surface p-6 text-sm text-text-muted">
            <p>No enrolled courses have learning modules yet.</p>
            <p className="mt-2">
              Enroll from{' '}
              <Link href="/student/courses" className="text-[#2F567A] hover:underline">
                My Courses
              </Link>
              , or ask your instructor to publish LMS content.
            </p>
          </div>
        )}

        <ul className="space-y-2">
          {withLms.map((c) => (
            <li key={c.id}>
              <Link
                href={c.learnUrl}
                className="block rounded border border-border bg-surface p-4 transition-colors hover:border-[#1C1810]"
              >
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {formatCourseCode(c.code)} · {c.credits} credits · {c.instructorName}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
