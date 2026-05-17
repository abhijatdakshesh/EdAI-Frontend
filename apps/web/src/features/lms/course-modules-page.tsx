"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";
import {
  useLmsModules,
  useLmsLessons,
  useLmsProgress,
  useLmsMastery,
  type LmsModule,
} from "@/lib/api/lms";
import { MasteryGraph } from "./mastery-graph";

interface Props {
  courseId: string;
}

/**
 * Student-facing course learn page. Shows the module list on the left and a
 * lesson list with progress badges on the right. Locks lesson N+1 until N
 * is mastered.
 */
export function CourseModulesPage({ courseId }: Props) {
  const { data: modules = [], isLoading: loadingModules } = useLmsModules(courseId);
  const { data: progressList = [] } = useLmsProgress(courseId);
  const { data: mastery = [] } = useLmsMastery(courseId);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const activeModule = useMemo(
    () => modules.find((m) => m.id === activeModuleId) ?? modules[0],
    [modules, activeModuleId],
  );

  return (
    <AppShell title="Learn">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr_320px]">
        {/* Module list */}
        <aside className="rounded border border-border bg-surface p-3">
          <p className="label-track mb-2">Modules · {courseId}</p>
          {loadingModules && (
            <p className="text-xs text-text-muted">Loading…</p>
          )}
          {!loadingModules && modules.length === 0 && (
            <p className="text-xs text-text-muted">No modules published yet.</p>
          )}
          <ul className="space-y-1">
            {modules.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => setActiveModuleId(m.id)}
                  className={cn(
                    "w-full rounded px-3 py-2 text-left text-sm transition-colors",
                    (activeModule?.id ?? "") === m.id
                      ? "bg-cream-100 border border-[#1C1810]"
                      : "border border-transparent hover:bg-cream-50",
                  )}
                >
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {m.lessonCount} lesson{m.lessonCount === 1 ? "" : "s"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Lessons */}
        <section>
          {activeModule ? (
            <LessonList module={activeModule} progressList={progressList} courseId={courseId} />
          ) : (
            <p className="text-sm text-text-muted">Pick a module to start.</p>
          )}
        </section>

        {/* Mastery graph rail */}
        <aside className="rounded border border-border bg-surface p-3 self-start">
          <p className="label-track mb-2">Mastery</p>
          <MasteryGraph mastery={mastery} />
        </aside>
      </div>
    </AppShell>
  );
}

function LessonList({
  module,
  progressList,
  courseId,
}: {
  module: LmsModule;
  progressList: Array<{ lessonId: string; state: string; score: number }>;
  courseId: string;
}) {
  const { data: lessons = [], isLoading } = useLmsLessons(module.id);
  const progressByLesson = useMemo(
    () => Object.fromEntries(progressList.map((p) => [p.lessonId, p])),
    [progressList],
  );

  // Lock lessons: a lesson is locked if any preceding lesson is not MASTERED.
  const lockedFrom = lessons.findIndex((l) => {
    const p = progressByLesson[l.id];
    return !p || p.state !== "MASTERED";
  });
  const firstLockedIndex = lockedFrom === -1 ? lessons.length : lockedFrom + 1;

  return (
    <div>
      <header className="mb-3">
        <h2 className="text-xl font-medium">{module.title}</h2>
        {module.description && (
          <p className="text-sm text-text-muted mt-1">{module.description}</p>
        )}
      </header>
      {isLoading && <p className="text-sm text-text-muted">Loading lessons…</p>}
      <ol className="space-y-2">
        {lessons.map((l, i) => {
          const prog = progressByLesson[l.id];
          const state = prog?.state ?? "NOT_STARTED";
          const locked = i >= firstLockedIndex;
          return (
            <li key={l.id}>
              <Link
                href={locked ? "#" : `/student/learn/${courseId}/${l.id}`}
                aria-disabled={locked}
                onClick={(e) => locked && e.preventDefault()}
                className={cn(
                  "block rounded border p-4 transition-colors",
                  locked
                    ? "border-border bg-cream-50 text-text-muted cursor-not-allowed"
                    : "border-border bg-surface hover:border-[#1C1810]",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted font-mono w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{l.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {l.topicTags?.slice(0, 3).join(" · ") || "—"}
                    </p>
                  </div>
                  <StateBadge state={state} locked={locked} />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StateBadge({ state, locked }: { state: string; locked: boolean }) {
  if (locked) return <span className="rounded px-2 py-0.5 text-xs bg-cream-100 text-text-muted">🔒</span>;
  if (state === "MASTERED")
    return <span className="rounded px-2 py-0.5 text-xs bg-[#EBF3EE] text-[#3D6B4F]">✓ Mastered</span>;
  if (state === "IN_PROGRESS")
    return <span className="rounded px-2 py-0.5 text-xs bg-[#F5EDDB] text-[#8B6914]">In progress</span>;
  return <span className="rounded px-2 py-0.5 text-xs bg-[#E6EEF5] text-[#2F567A]">Start</span>;
}
