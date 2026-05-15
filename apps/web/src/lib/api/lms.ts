/**
 * LMS API hooks.
 *
 * Backend: /api/lms/* on the identity service; the Next BFF has synth
 * fallbacks for every endpoint so the demo flow works without a backend.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./client";

// ── Types (mirror backend) ─────────────────────────────────────────────────

export type LessonContentKind = "MARKDOWN" | "VIDEO" | "SLIDES" | "CODE";
export type ProgressState = "NOT_STARTED" | "IN_PROGRESS" | "MASTERED";

export interface LessonContentBlock {
  kind: LessonContentKind;
  data: string;
}

export interface CheckpointQuestion {
  q: string;
  options: string[];
  correctIndex: number;
}

export interface LmsModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  published: boolean;
  lessonCount: number;
}

export interface LmsLesson {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  contentBlocks: LessonContentBlock[];
  checkpoint: CheckpointQuestion[];
  topicTags: string[];
  published: boolean;
  progress?: { state: ProgressState; score: number };
}

export interface LmsProgress {
  studentUsn?: string;
  lessonId: string;
  state: ProgressState;
  score: number;
  attempts: number;
}

export interface LmsMastery {
  studentUsn?: string;
  courseId: string;
  topic: string;
  masteryScore: number;
}

export interface DraftModuleResponse {
  title: string;
  lessons: Array<{
    title: string;
    topicTags: string[];
    markdown: string;
    checkpoint: CheckpointQuestion[];
  }>;
}

// ── Query Keys ─────────────────────────────────────────────────────────────

export const lmsKeys = {
  all: ["lms"] as const,
  modules: (courseId: string) => [...lmsKeys.all, "modules", courseId] as const,
  lessons: (moduleId: string) => [...lmsKeys.all, "lessons", moduleId] as const,
  lesson: (id: string) => [...lmsKeys.all, "lesson", id] as const,
  progress: (courseId: string) => [...lmsKeys.all, "progress", courseId] as const,
  mastery: (courseId: string) => [...lmsKeys.all, "mastery", courseId] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useLmsModules(courseId: string) {
  return useQuery({
    queryKey: lmsKeys.modules(courseId),
    queryFn: () => apiGet<LmsModule[]>(`/api/lms/modules?courseId=${courseId}`),
    enabled: !!courseId,
    staleTime: 60_000,
  });
}

export function useLmsLessons(moduleId: string) {
  return useQuery({
    queryKey: lmsKeys.lessons(moduleId),
    queryFn: () => apiGet<LmsLesson[]>(`/api/lms/modules/${moduleId}/lessons`),
    enabled: !!moduleId,
    staleTime: 60_000,
  });
}

export function useLmsLesson(lessonId: string) {
  return useQuery({
    queryKey: lmsKeys.lesson(lessonId),
    queryFn: () => apiGet<LmsLesson>(`/api/lms/lessons/${lessonId}`),
    enabled: !!lessonId,
  });
}

export function useLmsProgress(courseId: string) {
  return useQuery({
    queryKey: lmsKeys.progress(courseId),
    queryFn: () => apiGet<LmsProgress[]>(`/api/lms/progress?courseId=${courseId}`),
    enabled: !!courseId,
  });
}

export function useLmsMastery(courseId: string) {
  return useQuery({
    queryKey: lmsKeys.mastery(courseId),
    queryFn: () => apiGet<LmsMastery[]>(`/api/lms/mastery?courseId=${courseId}`),
    enabled: !!courseId,
  });
}

export function useSubmitCheckpoint(lessonId: string, courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answers: number[]) =>
      apiPost<{ score: number; total: number; state: ProgressState }>(
        `/api/lms/lessons/${lessonId}/checkpoint`,
        { answers },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lmsKeys.lesson(lessonId) });
      qc.invalidateQueries({ queryKey: lmsKeys.progress(courseId) });
      qc.invalidateQueries({ queryKey: lmsKeys.mastery(courseId) });
    },
  });
}

export function useEli5(lessonId: string) {
  return useMutation({
    mutationFn: (level: "beginner" | "intermediate" | "advanced") =>
      apiPost<{ markdown: string; level: string }>(
        `/api/lms/lessons/${lessonId}/eli5`,
        { level },
      ),
  });
}

export function useNarrate(lessonId: string) {
  return useMutation({
    mutationFn: (lang: "en" | "hi" | "kn" | "ta" | "te") =>
      apiPost<{ audioUrl: string | null; lang: string; fallbackText?: string; useBrowserTts?: boolean }>(
        `/api/lms/lessons/${lessonId}/narrate`,
        { lang },
      ),
  });
}

export function useDraftModule() {
  return useMutation({
    mutationFn: (payload: { courseId: string; syllabus: string }) =>
      apiPost<DraftModuleResponse>("/api/lms/authoring/draft", payload),
  });
}

export function useCreateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { courseId: string; title: string; description?: string; published?: boolean }) =>
      apiPost<LmsModule>("/api/lms/modules", payload),
    onSuccess: (m) => qc.invalidateQueries({ queryKey: lmsKeys.modules(m.courseId) }),
  });
}
