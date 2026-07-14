'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/shell';
import { useFacultyHeatmap } from '@/lib/api/lms';
import { apiGet } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

export function FacultyLmsDashboard() {
  const [courseId, setCourseId] = useState('CS501');
  const { data: heatmap, isLoading } = useFacultyHeatmap(courseId);
  const [naac, setNaac] = useState<Record<string, unknown> | null>(null);

  const downloadNaac = async () => {
    const data = await apiGet<Record<string, unknown>>(`/api/lms/reports/naac-export?courseId=${courseId}`);
    setNaac(data);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `naac-lms-${courseId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="LMS Analytics">
      <div className="space-y-6 max-w-3xl">
        <div className="flex gap-2 items-center">
          <label className="text-xs label-track">Course</label>
          <input
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded border border-border px-2 py-1 text-sm"
          />
          <Button size="sm" variant="outline" onClick={() => void downloadNaac()}>
            Export NAAC evidence
          </Button>
        </div>

        <section className="rounded border border-border bg-surface p-4">
          <p className="label-track text-xs mb-3">Topic mastery heatmap</p>
          {isLoading && <p className="text-sm text-text-muted">Loading…</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {heatmap?.topics?.map((t) => (
              <div key={t.topic} className="rounded border border-border p-3">
                <p className="font-medium text-sm">{t.topic}</p>
                <div className="mt-2 h-2 rounded-full bg-cream-200">
                  <div
                    className="h-2 rounded-full bg-[#3D6B4F]"
                    style={{ width: `${Math.round(t.avgMastery * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {Math.round(t.avgMastery * 100)}% avg · {t.studentCount} students
                </p>
              </div>
            ))}
          </div>
        </section>

        {naac && (
          <pre className="text-xs bg-cream-50 p-3 rounded border overflow-auto max-h-40">
            {JSON.stringify(naac, null, 2)}
          </pre>
        )}
      </div>
    </AppShell>
  );
}
