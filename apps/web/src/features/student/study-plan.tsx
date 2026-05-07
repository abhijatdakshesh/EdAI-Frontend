"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMyStudyPlan, useCompleteStudyTask, useGenerateStudyPlan } from "@/lib/api/counselor";

export function StudyPlan() {
  const { data: plan, isLoading, refetch } = useMyStudyPlan();
  const completeTask = useCompleteStudyTask();
  const generatePlan = useGenerateStudyPlan();
  const [genError, setGenError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenError(null);
    try {
      await generatePlan.mutateAsync();
      // Force a refetch in case TanStack v5 prefix-invalidation didn't kick in
      await refetch();
    } catch (e) {
      setGenError((e as Error).message ?? "Failed to generate plan");
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = plan?.tasks.filter((t) => t.scheduledDate === todayStr) ?? [];

  const subjectProgress = (plan?.tasks ?? []).reduce<Record<string, { done: number; total: number; name: string }>>(
    (acc, t) => {
      const entry = acc[t.subjectId];
      if (!entry) { acc[t.subjectId] = { done: t.completed ? 1 : 0, total: 1, name: t.subjectName }; }
      else { entry.total++; if (t.completed) entry.done++; }
      return acc;
    },
    {},
  );

  return (
    <AppShell title="My Study Plan">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Weekly plan */}
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <p className="label-track">Study Progress</p>
            <Button size="sm" variant="outline"
              onClick={() => void handleGenerate()}
              disabled={generatePlan.isPending}>
              {generatePlan.isPending ? "Generating…" : "Generate New Plan"}
            </Button>
          </div>
          {genError && (
            <p className="text-xs rounded bg-[#F5E6E6] text-[#8B2F2F] px-3 py-2">{genError}</p>
          )}

          {isLoading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded border border-border bg-surface animate-pulse" />)}
            </div>
          ) : !plan ? (
            <div className="rounded border border-dashed border-border p-10 text-center text-sm text-text-muted">
              No study plan yet. Click &ldquo;Generate New Plan&rdquo; to create one.
            </div>
          ) : (
            Object.values(subjectProgress).map((s) => {
              const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
              return (
                <div key={s.name} className="rounded border border-border bg-surface p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-text-muted">{s.done}/{s.total} tasks</p>
                  </div>
                  <div className="h-2 rounded-full bg-cream-200">
                    <div className={cn("h-2 rounded-full transition-all",
                      pct >= 100 ? "bg-[#3D6B4F]" : pct >= 60 ? "bg-[#8B6914]" : "bg-[#8B2F2F]")}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-text-muted mt-1">{pct}% complete</p>
                </div>
              );
            })
          )}
        </div>

        {/* Today's tasks */}
        <div>
          <p className="label-track mb-3">Today&apos;s Tasks</p>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-text-muted rounded border border-dashed border-border p-6 text-center">
              No tasks scheduled for today.
            </p>
          ) : (
            <div className="grid gap-2">
              {todayTasks.map((t) => (
                <button key={t.id}
                  onClick={() => !t.completed && void completeTask.mutateAsync(t.id)}
                  disabled={t.completed || completeTask.isPending}
                  className={cn("rounded border p-3 text-left flex items-start gap-3 transition-colors",
                    t.completed ? "border-[#3D6B4F] bg-[#F8FCF9]" : "border-border bg-surface hover:border-[#1C1810]")}>
                  <span className={cn("mt-0.5 text-sm shrink-0", t.completed ? "text-[#3D6B4F]" : "text-text-muted")}>
                    {t.completed ? "✓" : "○"}
                  </span>
                  <div>
                    <p className={cn("text-sm", t.completed && "line-through text-text-muted")}>{t.topic}</p>
                    <p className="text-xs text-text-muted mt-0.5">{t.subjectName} · {t.durationMins} min</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {todayTasks.length > 0 && (
            <p className="text-xs text-text-muted mt-2">
              {todayTasks.filter((t) => t.completed).length} / {todayTasks.length} tasks done today
            </p>
          )}
          {plan && (
            <p className="text-xs text-text-muted mt-2">🔥 {plan.streakDays} day streak</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
