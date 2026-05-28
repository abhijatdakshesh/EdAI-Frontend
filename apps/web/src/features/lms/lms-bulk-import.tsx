'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { apiPost } from '@/lib/api/client';

export function LmsBulkImport() {
  const [courseId, setCourseId] = useState('CS501');
  const [syllabus, setSyllabus] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await apiPost<{ message: string; draft: { title: string; lessons: unknown[] } }>(
        '/api/lms/bulk-import/syllabus',
        { courseId, syllabus },
      );
      setResult(`${res.message} — ${res.draft.title} (${res.draft.lessons.length} lessons)`);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="LMS Bulk Import">
      <div className="max-w-xl space-y-4">
        <p className="text-sm text-text-muted">
          Paste a VTU syllabus PDF text; AI drafts modules and lessons for faculty review.
        </p>
        <input
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          placeholder="Course code e.g. CS501"
          className="w-full rounded border border-border px-3 py-2 text-sm"
        />
        <textarea
          value={syllabus}
          onChange={(e) => setSyllabus(e.target.value)}
          placeholder="Paste syllabus text…"
          className="w-full min-h-[200px] rounded border border-border px-3 py-2 text-sm"
        />
        <Button onClick={() => void run()} disabled={!syllabus.trim() || loading}>
          {loading ? 'Generating…' : 'Generate draft module'}
        </Button>
        {result && <p className="text-sm text-[#3D6B4F]">{result}</p>}
      </div>
    </AppShell>
  );
}
