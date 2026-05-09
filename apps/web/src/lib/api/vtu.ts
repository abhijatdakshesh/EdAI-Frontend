/**
 * React Query hooks for VTU Registration — cross-role feature.
 * Admin configures windows; Student registers; Teacher/Parent monitor.
 * Backend: /api/vtu
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiGetArray, apiPatch, apiPost } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VTUWindowStatus = "UPCOMING" | "OPEN" | "CLOSED" | "PROCESSED";
export type VTURegStatus =
  | "NOT_STARTED" | "ELIGIBLE" | "INELIGIBLE" | "REGISTERED" | "SUBMITTED" | "CONFIRMED";

export interface VTUEligibilityRule {
  minAttendancePct: number;
  maxBacklogs: number;
  feeClearance: boolean;
}

export interface VTUWindow {
  id: string;
  title: string;
  examMonth: string;
  openDate: string;
  closeDate: string;
  eligibilityRules?: VTUEligibilityRule;
  status: VTUWindowStatus;
  createdBy: string;
  createdAt: string;
}

export interface VTUSubjectEligibility {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  eligible: boolean;
  reasons: string[];
  attendancePct: number;
  backlogs: number;
}

export interface StudentVTUStatus {
  windowId: string;
  studentUsn: string;
  status: VTURegStatus;
  eligibleSubjects: VTUSubjectEligibility[];
  ineligibleSubjects: VTUSubjectEligibility[];
  submittedAt?: string;
  confirmedAt?: string;
}

export interface VTUPendingStudent {
  usn: string;
  name: string;
  dept: string;
  semester: number;
  status: VTURegStatus;
  eligibleCount: number;
  ineligibleCount: number;
  lastRemindedAt?: string;
}

export interface VTUDeptOverview {
  dept: string;
  total: number;
  registered: number;
  pending: number;
  ineligible: number;
}

export interface IASubmission {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  dept: string;
  status: "NOT_STARTED" | "DRAFT" | "SUBMITTED" | "CONFIRMED";
  submittedAt?: string;
  confirmedAt?: string;
  studentCount: number;
  marksEntered: number;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const vtuKeys = {
  windows: ["vtu", "windows"] as const,
  window: (id: string) => ["vtu", "window", id] as const,
  studentStatus: (windowId: string) => ["vtu", "student-status", windowId] as const,
  pending: (windowId: string) => ["vtu", "pending", windowId] as const,
  deptOverview: (windowId: string) => ["vtu", "dept-overview", windowId] as const,
  iaSubmissions: (filters?: object) => ["vtu", "ia-submissions", filters] as const,
};

// ─── Admin Hooks ──────────────────────────────────────────────────────────────

export function useVTUWindows() {
  return useQuery<VTUWindow[]>({
    queryKey: vtuKeys.windows,
    queryFn: () => apiGetArray<VTUWindow>("/api/vtu/windows"),
  });
}

export function useVTUWindow(id: string) {
  return useQuery<VTUWindow>({
    queryKey: vtuKeys.window(id),
    queryFn: () => apiGet<VTUWindow>(`/api/vtu/windows/${id}`),
    enabled: !!id,
  });
}

export function useCreateVTUWindow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<VTUWindow, "id" | "status" | "createdBy" | "createdAt">) =>
      apiPost<VTUWindow>("/api/vtu/windows", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: vtuKeys.windows }),
  });
}

export function useRunEligibilityCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (windowId: string) =>
      apiPost(`/api/vtu/windows/${windowId}/eligibility-check`, {}),
    onSuccess: (_d, windowId) => {
      qc.invalidateQueries({ queryKey: vtuKeys.pending(windowId) });
      qc.invalidateQueries({ queryKey: vtuKeys.deptOverview(windowId) });
    },
  });
}

export function useVTUPendingStudents(windowId: string) {
  return useQuery<VTUPendingStudent[]>({
    queryKey: vtuKeys.pending(windowId),
    queryFn: () => apiGetArray<VTUPendingStudent>(`/api/vtu/windows/${windowId}/pending`),
    enabled: !!windowId,
  });
}

export function useSendVTUReminders() {
  return useMutation({
    mutationFn: ({ windowId, studentUsns }: { windowId: string; studentUsns: string[] }) =>
      apiPost(`/api/vtu/windows/${windowId}/remind`, { studentUsns }),
  });
}

export function useVTUDeptOverview(windowId: string) {
  return useQuery<VTUDeptOverview[]>({
    queryKey: vtuKeys.deptOverview(windowId),
    queryFn: () => apiGetArray<VTUDeptOverview>(`/api/vtu/windows/${windowId}/dept-overview`),
    enabled: !!windowId,
  });
}

// ─── Student Hooks ────────────────────────────────────────────────────────────

export function useMyVTUStatus(windowId: string) {
  return useQuery<StudentVTUStatus>({
    queryKey: vtuKeys.studentStatus(windowId),
    queryFn: () => apiGet<StudentVTUStatus>(`/api/vtu/student/status?windowId=${windowId}`),
    enabled: !!windowId,
  });
}

export function useSubmitVTURegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ windowId, subjectIds }: { windowId: string; subjectIds: string[] }) =>
      apiPost(`/api/vtu/student/register`, { windowId, subjectIds }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: vtuKeys.studentStatus(v.windowId) }),
  });
}

// ─── IA Submission Hooks (Admin) ──────────────────────────────────────────────

export interface IAFilter {
  dept?: string | undefined;
  status?: string | undefined;
  semester?: number | undefined;
}

export function useIASubmissions(filters: IAFilter = {}) {
  const params = new URLSearchParams();
  if (filters.dept) params.set("dept", filters.dept);
  if (filters.status) params.set("status", filters.status);
  if (filters.semester) params.set("semester", String(filters.semester));
  const qs = params.toString();

  return useQuery<IASubmission[]>({
    queryKey: vtuKeys.iaSubmissions(filters),
    queryFn: () => apiGetArray<IASubmission>(`/api/ia/submissions${qs ? `?${qs}` : ""}`),
  });
}

export function useSendIAReminder() {
  return useMutation({
    mutationFn: (submissionId: string) =>
      apiPost(`/api/ia/submissions/${submissionId}/remind`, {}),
  });
}

export function useConfirmIASubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (submissionId: string) =>
      apiPost(`/api/ia/submissions/${submissionId}/confirm`, {}),
    // Optimistic update: flip status to CONFIRMED in every cached list
    // immediately so the row visibly changes even before the network round-trips.
    onMutate: async (submissionId) => {
      await qc.cancelQueries({ queryKey: ["vtu", "ia-submissions"] });
      const snapshots = qc.getQueriesData<IASubmission[]>({ queryKey: ["vtu", "ia-submissions"] });
      for (const [key, list] of snapshots) {
        if (!Array.isArray(list)) continue;
        qc.setQueryData<IASubmission[]>(
          key,
          list.map((s) => (s.id === submissionId ? { ...s, status: "CONFIRMED" } : s)),
        );
      }
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      // Roll back if the server rejected the confirm
      if (ctx?.snapshots) for (const [key, prev] of ctx.snapshots) qc.setQueryData(key, prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["vtu", "ia-submissions"] }),
  });
}

// ─── Teacher IA Entry Hooks ───────────────────────────────────────────────────

export interface IAMarksRow {
  studentUsn: string;
  studentName: string;
  ia1?: number;
  ia2?: number;
}

export interface IAEntryPayload {
  subjectId: string;
  entries: IAMarksRow[];
}

export function useTeacherIAMarks(subjectId: string) {
  return useQuery<IAMarksRow[]>({
    queryKey: ["ia", "teacher", subjectId],
    queryFn: () => apiGetArray<IAMarksRow>(`/api/ia/teacher/marks?subjectId=${subjectId}`),
    enabled: !!subjectId,
  });
}

export function useSaveIAMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IAEntryPayload) =>
      apiPost("/api/ia/teacher/marks", payload),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["ia", "teacher", v.subjectId] }),
  });
}

export function useSubmitIAMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subjectId: string) =>
      apiPost(`/api/ia/teacher/marks/${subjectId}/submit`, {}),
    onSuccess: (_d, subjectId) =>
      qc.invalidateQueries({ queryKey: ["ia", "teacher", subjectId] }),
  });
}

// ─── Parent VTU View ──────────────────────────────────────────────────────────

export function useChildVTUStatus(childUsn: string, windowId: string) {
  return useQuery<StudentVTUStatus>({
    queryKey: ["vtu", "child", childUsn, windowId],
    queryFn: () =>
      apiGet<StudentVTUStatus>(`/api/parent/children/${childUsn}/vtu-status?windowId=${windowId}`),
    enabled: !!childUsn && !!windowId,
  });
}

// ─── Active Window helper ─────────────────────────────────────────────────────

export function useActiveVTUWindow() {
  return useQuery<VTUWindow | null>({
    queryKey: ["vtu", "active-window"],
    queryFn: () => apiGet<VTUWindow | null>("/api/vtu/windows/active"),
    staleTime: 60_000,
  });
}
