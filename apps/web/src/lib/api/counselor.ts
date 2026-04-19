/**
 * React Query hooks for Counselor & Wellness.
 * Backend: /api/counselor, /api/wellness
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionStatus = "UPCOMING" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export interface CounselorSlot {
  id: string;
  counselorId: string;
  counselorName: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface CounselorSession {
  id: string;
  slotId: string;
  studentUsn: string;
  counselorName: string;
  date: string;
  startTime: string;
  reason: string;
  status: SessionStatus;
  notes?: string;
  rating?: number;
  feedback?: string;
  bookedAt: string;
}

export interface WellnessRiskScore {
  studentUsn: string;
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: {
    attendance: number;
    marks: number;
    submissions: number;
    streak: number;
  };
  lastUpdated: string;
}

export interface StressResource {
  id: string;
  title: string;
  description: string;
  type: "VIDEO" | "ARTICLE" | "EXERCISE" | "HOTLINE";
  url?: string;
  tags: string[];
}

export interface StudyPlanTask {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  scheduledDate: string;
  durationMins: number;
  completed: boolean;
  completedAt?: string;
}

export interface StudyPlan {
  id: string;
  studentUsn: string;
  generatedAt: string;
  streakDays: number;
  totalTasks: number;
  completedTasks: number;
  tasks: StudyPlanTask[];
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const counselorKeys = {
  slots: (from: string, to: string) => ["counselor", "slots", from, to] as const,
  sessions: (usn: string) => ["counselor", "sessions", usn] as const,
  riskScore: (usn: string) => ["wellness", "risk", usn] as const,
  resources: ["wellness", "resources"] as const,
  studyPlan: (usn: string) => ["wellness", "study-plan", usn] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCounselorSlots(from: string, to: string) {
  return useQuery<CounselorSlot[]>({
    queryKey: counselorKeys.slots(from, to),
    queryFn: () =>
      apiGet<CounselorSlot[]>(`/api/counselor/slots?from=${from}&to=${to}`),
    enabled: !!from && !!to,
  });
}

export function useMySessions() {
  return useQuery<CounselorSession[]>({
    queryKey: counselorKeys.sessions("me"),
    queryFn: () => apiGet<CounselorSession[]>("/api/counselor/sessions/me"),
  });
}

export function useBookCounselorSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, reason }: { slotId: string; reason: string }) =>
      apiPost<CounselorSession>("/api/counselor/book", { slotId, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["counselor", "sessions"] }),
  });
}

export function useRateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      rating,
      feedback,
    }: {
      sessionId: string;
      rating: number;
      feedback?: string;
    }) =>
      apiPost(`/api/counselor/sessions/${sessionId}/rate`, { rating, feedback }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["counselor", "sessions"] }),
  });
}

export function useMyWellnessScore() {
  return useQuery<WellnessRiskScore>({
    queryKey: counselorKeys.riskScore("me"),
    queryFn: () => apiGet<WellnessRiskScore>("/api/wellness/risk-score/me"),
    staleTime: 300_000,
  });
}

export function useSubmitStressAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (responses: Record<string, number>) =>
      apiPost("/api/wellness/stress-assessment", { responses }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wellness", "risk"] }),
  });
}

export function useStressResources() {
  return useQuery<StressResource[]>({
    queryKey: counselorKeys.resources,
    queryFn: () => apiGet<StressResource[]>("/api/wellness/resources"),
    staleTime: 3_600_000,
  });
}

export function useMyStudyPlan() {
  return useQuery<StudyPlan>({
    queryKey: counselorKeys.studyPlan("me"),
    queryFn: () => apiGet<StudyPlan>("/api/wellness/study-plan/me"),
  });
}

export function useGenerateStudyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<StudyPlan>("/api/wellness/study-plan/generate", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wellness", "study-plan"] }),
  });
}

export function useCompleteStudyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      apiPost(`/api/wellness/study-plan/tasks/${taskId}/complete`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wellness", "study-plan"] }),
  });
}
