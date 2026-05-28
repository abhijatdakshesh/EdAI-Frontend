"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import {
  useLmsLesson,
  useSubmitCheckpoint,
  useEli5,
  useNarrate,
  type LessonContentBlock,
} from "@/lib/api/lms";
import { DoubtChat } from "./doubt-chat";
import { LessonExtensionsPanel } from "./lesson-extensions-panel";
import { useLmsStreak } from "@/lib/api/lms";
import "highlight.js/styles/github.css";

interface Props {
  courseId: string;
  lessonId: string;
}

const LANG_OPTIONS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
] as const;
type LangCode = (typeof LANG_OPTIONS)[number]["code"];

const LEVEL_OPTIONS = [
  { code: "beginner", label: "ELI-12" },
  { code: "intermediate", label: "Standard" },
  { code: "advanced", label: "Senior" },
] as const;
type LevelCode = (typeof LEVEL_OPTIONS)[number]["code"];

export function LessonView({ courseId, lessonId }: Props) {
  const { data: lesson, isLoading } = useLmsLesson(lessonId);
  const [level, setLevel] = useState<LevelCode>("intermediate");
  const eli5 = useEli5(lessonId);
  const narrate = useNarrate(lessonId);
  const [narrateLang, setNarrateLang] = useState<LangCode>("en");
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [dyslexiaMode, setDyslexiaMode] = useState(false);
  const { data: streak } = useLmsStreak();

  // Pick which markdown to render: original lesson body OR ELI5 rewrite if present.
  const markdownBody = useMemo(() => {
    if (level !== "intermediate" && eli5.data?.markdown) return eli5.data.markdown;
    return lesson?.contentBlocks.find((b) => b.kind === "MARKDOWN")?.data ?? "";
  }, [lesson, eli5.data, level]);

  const handleLevel = (newLevel: LevelCode) => {
    setLevel(newLevel);
    if (newLevel !== "intermediate") eli5.mutate(newLevel);
  };

  const handleNarrate = async () => {
    const res = await narrate.mutateAsync(narrateLang);
    // If backend gave us a signed audio URL, play it directly.
    if (res.audioUrl) {
      const a = new Audio(res.audioUrl);
      void a.play();
      return;
    }
    // Otherwise fall back to browser speechSynthesis with the lesson text.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const text = res.fallbackText ?? markdownBody;
      const utter = new SpeechSynthesisUtterance(stripMarkdown(text));
      utter.lang = bcp47For(narrateLang);
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    }
  };

  if (isLoading || !lesson) {
    return (
      <AppShell title="Lesson">
        <p className="text-sm text-text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={lesson.title}>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Top toolbar — wraps freely on mobile, tighter gaps below sm */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 rounded border border-border bg-surface p-3">
            <Link
              href={`/student/learn/${courseId}`}
              className="text-xs text-[#2F567A] hover:underline"
            >
              ← Back to modules
            </Link>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* Level toggle */}
              <div className="inline-flex rounded border border-border overflow-hidden">
                {LEVEL_OPTIONS.map((lvl) => (
                  <button
                    key={lvl.code}
                    onClick={() => handleLevel(lvl.code)}
                    className={`px-2 py-1 text-xs ${
                      level === lvl.code ? "bg-[#1C1810] text-cream-50" : "bg-surface"
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
              {/* Narrate */}
              <select
                value={narrateLang}
                onChange={(e) => setNarrateLang(e.target.value as LangCode)}
                className="rounded border border-border bg-surface px-2 py-1 text-xs"
              >
                {LANG_OPTIONS.map((l) => (
                  <option key={l.code} value={l.code}>
                    🔊 {l.label}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={handleNarrate} disabled={narrate.isPending}>
                {narrate.isPending ? "…" : "Listen"}
              </Button>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={lowBandwidth} onChange={(e) => setLowBandwidth(e.target.checked)} />
                Low bandwidth
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={dyslexiaMode} onChange={(e) => setDyslexiaMode(e.target.checked)} />
                Dyslexia-friendly
              </label>
            </div>
          </div>

          {streak && streak.currentStreak > 0 && (
            <p className="text-xs text-[#3D6B4F]">🔥 {streak.currentStreak}-day learning streak</p>
          )}

          {/* Content blocks */}
          <article
            className={`rounded border border-border bg-surface p-5 prose prose-sm max-w-none ${
              dyslexiaMode ? "leading-loose tracking-wide [font-family:system-ui]" : ""
            }`}
          >
            {markdownBody && (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {markdownBody}
              </ReactMarkdown>
            )}
            {eli5.isPending && (
              <p className="text-xs text-text-muted">Rewriting at {level} level…</p>
            )}
          </article>

          {/* Other content blocks (video, slides, code) */}
          {lesson.contentBlocks
            .filter((b) => b.kind !== "MARKDOWN" && !(lowBandwidth && b.kind === "VIDEO"))
            .map((b, idx) => (
              <ContentBlock key={idx} block={b} />
            ))}

          <LessonExtensionsPanel courseId={courseId} lessonId={lessonId} lowBandwidth={lowBandwidth} />

          {/* Checkpoint */}
          {lesson.checkpoint?.length > 0 && (
            <Checkpoint
              lessonId={lessonId}
              courseId={courseId}
              questions={lesson.checkpoint}
              {...(lesson.progress?.state ? { currentState: lesson.progress.state } : {})}
            />
          )}
        </div>

        {/* AI doubt chat sidebar — sticky only on lg+; on mobile it flows
            inline below the lesson body so it doesn't trap scrolling. */}
        <aside className="lg:self-start lg:sticky lg:top-4">
          <DoubtChat lessonTitle={lesson.title} lessonBody={markdownBody} />
        </aside>
      </div>
    </AppShell>
  );
}

function ContentBlock({ block }: { block: LessonContentBlock }) {
  if (block.kind === "VIDEO") {
    const yt = toYouTubeEmbed(block.data);
    return (
      <div className="rounded border border-border bg-surface p-3">
        <p className="label-track mb-2">Video</p>
        {yt ? (
          <iframe
            src={yt}
            className="w-full aspect-video rounded"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video src={block.data} controls className="w-full rounded" />
        )}
      </div>
    );
  }
  if (block.kind === "SLIDES") {
    return (
      <div className="rounded border border-border bg-surface p-3">
        <p className="label-track mb-2">Slides</p>
        <iframe src={block.data} className="w-full h-[300px] md:h-[480px] rounded" />
      </div>
    );
  }
  if (block.kind === "CODE") {
    return <CodeSandbox starter={block.data} />;
  }
  return null;
}

function CodeSandbox({ starter }: { starter: string }) {
  const [code, setCode] = useState(starter);
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState(false);
  // On mobile (<md) Pyodide's 12 MB download would burn the user's data
  // before they've even decided to run anything. Lazy-mount the editor +
  // run wiring behind a tap; desktop renders immediately.
  const [opened, setOpened] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  const run = async () => {
    setRunning(true);
    setOutput("Loading Python (Pyodide)…");
    try {
      // Lazy-load Pyodide from CDN. This is heavy (~12 MB) so we only do it on
      // first run, and reuse the loaded instance via window.__pyodide.
      type PyodideAPI = { runPython: (code: string) => unknown; setStdout: (opts: { batched: (s: string) => void }) => void };
      type Win = Window & typeof globalThis & {
        loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideAPI>;
        __pyodide?: PyodideAPI;
      };
      const w = window as Win;
      if (!w.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Pyodide"));
          document.head.appendChild(s);
        });
      }
      const pyodide =
        w.__pyodide ??
        (await w.loadPyodide!({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" }));
      w.__pyodide = pyodide;
      let buf = "";
      pyodide.setStdout({ batched: (s: string) => (buf += s + "\n") });
      pyodide.runPython(code);
      setOutput(buf || "(no output)");
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  if (!opened) {
    return (
      <div className="rounded border border-border bg-surface p-3 flex items-center justify-between gap-3">
        <div>
          <p className="label-track">Code Sandbox · Python</p>
          <p className="text-xs text-text-muted mt-0.5">
            Loads ~12 MB Python runtime. Tap to open on mobile data.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpened(true)}>▶ Launch</Button>
      </div>
    );
  }

  return (
    <div className="rounded border border-border bg-surface p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="label-track">Code Sandbox · Python</p>
        <Button size="sm" onClick={run} disabled={running}>
          {running ? "Running…" : "▶ Run"}
        </Button>
      </div>
      <CodeMirror
        value={code}
        extensions={[python()]}
        height="200px"
        onChange={(v) => setCode(v)}
        basicSetup={{ lineNumbers: true, foldGutter: false }}
      />
      {output && (
        <pre className="rounded bg-[#1C1810] text-cream-50 p-3 text-xs overflow-x-auto whitespace-pre-wrap">
          {output}
        </pre>
      )}
    </div>
  );
}

function Checkpoint({
  lessonId,
  courseId,
  questions,
  currentState,
}: {
  lessonId: string;
  courseId: string;
  questions: Array<{ q: string; options: string[]; correctIndex: number }>;
  currentState?: string;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{
    score: number;
    total: number;
    state: string;
    explanations?: string[];
    abcAward?: { awarded: boolean; credits?: number };
  } | null>(null);
  const submit = useSubmitCheckpoint(lessonId, courseId);

  const canSubmit = questions.every((_, i) => typeof answers[i] === "number");

  const onSubmit = async () => {
    const res = await submit.mutateAsync(questions.map((_, i) => answers[i] ?? -1));
    setResult(res);
  };

  return (
    <div className="rounded border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="label-track">Checkpoint</p>
        {currentState === "MASTERED" && (
          <span className="rounded px-2 py-0.5 text-xs bg-[#EBF3EE] text-[#3D6B4F]">✓ Already mastered</span>
        )}
      </div>
      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={i}>
            <p className="text-sm font-medium">{i + 1}. {q.q}</p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {q.options.map((opt, j) => (
                <label
                  key={j}
                  className={`flex items-center gap-2 rounded border p-2 text-sm cursor-pointer ${
                    answers[i] === j ? "border-[#1C1810] bg-cream-100" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${i}`}
                    checked={answers[i] === j}
                    onChange={() => setAnswers({ ...answers, [i]: j })}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={onSubmit} disabled={!canSubmit || submit.isPending}>
          {submit.isPending ? "Submitting…" : "Submit checkpoint"}
        </Button>
        {result && (
          <div className="space-y-2">
            <p className="text-sm">
              Scored <strong>{result.score} / {result.total}</strong> ·{" "}
              <span className={result.state === "MASTERED" ? "text-[#3D6B4F]" : "text-[#8B6914]"}>
                {result.state === "MASTERED" ? "Mastered ✓" : "Try again"}
              </span>
              {result.abcAward?.awarded && (
                <span className="ml-2 text-[#2F567A]">+{result.abcAward.credits} ABC micro-credit</span>
              )}
            </p>
            {result.explanations?.map((ex, i) => (
              <p key={i} className="text-xs text-text-muted">{i + 1}. {ex}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    return null;
  } catch {
    return null;
  }
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_`>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bcp47For(lang: LangCode): string {
  return {
    en: "en-IN",
    hi: "hi-IN",
    kn: "kn-IN",
    ta: "ta-IN",
    te: "te-IN",
  }[lang];
}
