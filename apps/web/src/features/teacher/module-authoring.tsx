"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api/client";
import { useCreateModule, useDraftModule, type DraftModuleResponse } from "@/lib/api/lms";

interface Props {
  courseId: string;
}

/**
 * Faculty Co-Pilot (KAN inventor feature). Faculty pastes the VTU syllabus,
 * clicks "Draft with AI", reviews 5 lessons, edits, then Publishes.
 *
 * Backend uses Gemini to produce a JSON skeleton {title, lessons[]} where
 * each lesson has title/topicTags/markdown/checkpoint. Faculty can edit
 * each lesson before publish-creating the module + lesson rows.
 */
export function ModuleAuthoring({ courseId }: Props) {
  const router = useRouter();
  const [syllabus, setSyllabus] = useState("");
  const [draft, setDraft] = useState<DraftModuleResponse | null>(null);
  const [activeLesson, setActiveLesson] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedModuleId, setPublishedModuleId] = useState<string | null>(null);

  const draftMutation = useDraftModule();
  const createModule = useCreateModule();

  const onDraft = async () => {
    if (!syllabus.trim()) return;
    setPublishError(null);
    setDraft(null);
    setActiveLesson(0);
    const res = await draftMutation.mutateAsync({ courseId, syllabus });
    setDraft(res);
  };

  const onUpdateLesson = (idx: number, patch: Partial<DraftModuleResponse["lessons"][number]>) => {
    if (!draft) return;
    const lessons = draft.lessons.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    setDraft({ ...draft, lessons });
  };

  const onPublish = async () => {
    if (!draft) return;
    setPublishing(true);
    setPublishError(null);
    try {
      // 1. Create the module
      const mod = await createModule.mutateAsync({
        courseId,
        title: draft.title,
        published: true,
      });
      setPublishedModuleId(mod.id);
      // 2. Create each lesson via the catch-all proxy (POST /api/lms/lessons).
      //    Falls back to BFF if route exists in middleware; backend handles it.
      let order = 1;
      for (const lesson of draft.lessons) {
        await apiPost("/api/lms/lessons", {
          moduleId: mod.id,
          title: lesson.title,
          order: order++,
          topicTags: lesson.topicTags,
          contentBlocks: [{ kind: "MARKDOWN", data: lesson.markdown }],
          checkpoint: lesson.checkpoint,
          published: true,
        });
      }
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AppShell title={`Module Authoring · ${courseId}`}>
      <div className="grid gap-4 max-w-6xl">
        {!draft && (
          <div className="rounded border border-border bg-surface p-5 space-y-3">
            <div>
              <p className="label-track mb-1">Step 1 · Paste the official VTU syllabus</p>
              <p className="text-xs text-text-muted">
                AI will draft 5 lessons (with topic tags, Markdown body, and 3-question checkpoints each).
                You can edit everything before publishing.
              </p>
            </div>
            <textarea
              rows={12}
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              placeholder={"e.g.\nModule 2: Process Scheduling\n- FCFS\n- SJF (preemptive + non-preemptive)\n- Round-robin\n- Priority\n- Multilevel queue"}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <Button onClick={onDraft} disabled={draftMutation.isPending || !syllabus.trim()}>
                {draftMutation.isPending ? "Drafting…" : "✨ Draft with AI"}
              </Button>
              <span className="text-xs text-text-muted">
                ~6–10 seconds (Gemini Smart)
              </span>
            </div>
          </div>
        )}

        {draft && !publishedModuleId && (
          <>
            <div className="rounded border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="label-track">Step 2 · Review & edit</p>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="mt-1 text-xl font-medium border-b border-transparent hover:border-border focus:border-[#1C1810] focus:outline-none bg-transparent w-full max-w-xl"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setDraft(null)}>
                    Discard
                  </Button>
                  <Button onClick={onPublish} disabled={publishing}>
                    {publishing ? "Publishing…" : "Publish Module"}
                  </Button>
                </div>
              </div>
              {publishError && (
                <p className="mt-2 rounded bg-[#F5E6E6] px-3 py-2 text-xs text-[#8B2F2F]">
                  {publishError}
                </p>
              )}
            </div>

            <div className="grid gap-3 lg:grid-cols-[200px_1fr]">
              <aside className="rounded border border-border bg-surface p-2">
                <p className="label-track px-2 py-1">Lessons</p>
                <ul className="space-y-0.5">
                  {draft.lessons.map((l, i) => (
                    <li key={i}>
                      <button
                        onClick={() => setActiveLesson(i)}
                        className={`w-full text-left rounded px-2 py-1.5 text-sm ${
                          activeLesson === i ? "bg-cream-100" : "hover:bg-cream-50"
                        }`}
                      >
                        <span className="text-xs text-text-muted font-mono mr-2">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {l.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
              <section className="space-y-3">
                <LessonEditor
                  key={activeLesson}
                  lesson={draft.lessons[activeLesson]!}
                  onChange={(patch) => onUpdateLesson(activeLesson, patch)}
                />
              </section>
            </div>
          </>
        )}

        {publishedModuleId && (
          <div className="rounded border border-[#3D6B4F] bg-[#EBF3EE] p-5">
            <p className="text-sm font-medium text-[#3D6B4F]">
              ✓ Module published.
            </p>
            <p className="text-xs text-text-muted mt-1">Module ID: {publishedModuleId}</p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/student/learn/${courseId}`)}
              >
                Preview as student
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDraft(null);
                  setPublishedModuleId(null);
                  setSyllabus("");
                }}
              >
                Draft another module
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function LessonEditor({
  lesson,
  onChange,
}: {
  lesson: DraftModuleResponse["lessons"][number];
  onChange: (patch: Partial<DraftModuleResponse["lessons"][number]>) => void;
}) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  return (
    <div className="space-y-3">
      <input
        value={lesson.title}
        onChange={(e) => onChange({ title: e.target.value })}
        className="w-full text-lg font-medium rounded border border-border bg-background px-3 py-2"
      />
      <input
        value={lesson.topicTags.join(", ")}
        onChange={(e) => onChange({ topicTags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
        placeholder="topic tags (comma-separated)"
        className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
      />
      <div className="flex gap-1 text-xs">
        {(["edit", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1 ${tab === t ? "bg-[#1C1810] text-cream-50" : "bg-cream-100"}`}
          >
            {t === "edit" ? "Markdown" : "Preview"}
          </button>
        ))}
      </div>
      {tab === "edit" ? (
        <textarea
          rows={14}
          value={lesson.markdown}
          onChange={(e) => onChange({ markdown: e.target.value })}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm font-mono"
        />
      ) : (
        <article className="rounded border border-border bg-surface p-4 prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.markdown}</ReactMarkdown>
        </article>
      )}

      <div>
        <p className="label-track mb-1">Checkpoint · 3 questions</p>
        <div className="space-y-3">
          {lesson.checkpoint.map((q, qi) => (
            <div key={qi} className="rounded border border-border bg-surface p-3">
              <input
                value={q.q}
                onChange={(e) => {
                  const next = lesson.checkpoint.map((x, i) => (i === qi ? { ...x, q: e.target.value } : x));
                  onChange({ checkpoint: next });
                }}
                className="w-full text-sm font-medium bg-transparent focus:outline-none border-b border-transparent hover:border-border"
              />
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2 text-xs">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correctIndex === oi}
                      onChange={() => {
                        const next = lesson.checkpoint.map((x, i) =>
                          i === qi ? { ...x, correctIndex: oi } : x,
                        );
                        onChange({ checkpoint: next });
                      }}
                    />
                    <input
                      value={opt}
                      onChange={(e) => {
                        const opts = q.options.map((o, j) => (j === oi ? e.target.value : o));
                        const next = lesson.checkpoint.map((x, i) =>
                          i === qi ? { ...x, options: opts } : x,
                        );
                        onChange({ checkpoint: next });
                      }}
                      className="flex-1 rounded border border-border bg-background px-2 py-1"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
