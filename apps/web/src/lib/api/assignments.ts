/**
 * React Query hooks for Assignments.
 * Backend: assignments service → /api/assignments
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssignmentStatus = "PENDING" | "SUBMITTED" | "GRADED" | "LATE";

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  dueDate: string; // ISO
  maxMarks: number;
  description: string;
  attachmentUrl?: string;
  status: AssignmentStatus; // from student's perspective
  submittedAt?: string;
  grade?: number;
  feedback?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentUsn: string;
  studentName: string;
  submittedAt: string;
  fileUrl: string;
  grade?: number;
  feedback?: string;
  plagiarismScore?: number; // 0-100
}

export interface CreateAssignmentPayload {
  title: string;
  courseId: string;
  classId: string;
  dueDate: string;
  maxMarks: number;
  description: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const assignmentKeys = {
  all: ["assignments"] as const,
  student: (usn: string, status?: string) => ["assignments", "student", usn, status] as const,
  teacher: (courseId: string) => ["assignments", "teacher", courseId] as const,
  submissions: (assignmentId: string) => ["assignments", assignmentId, "submissions"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Student's assignments — optionally filtered by status */
export function useStudentAssignments(usn: string, status?: AssignmentStatus) {
  const qs = status ? `?status=${status}` : "";
  return useQuery<Assignment[]>({
    queryKey: assignmentKeys.student(usn, status),
    queryFn: () => apiGet<Assignment[]>(`/api/assignments/student/${usn}${qs}`),
    enabled: !!usn,
  });
}

/** Assignments for a teacher's course with submission stats */
export function useTeacherAssignments(courseId: string) {
  return useQuery<(Assignment & { submissionCount: number; avgScore?: number })[]>({
    queryKey: assignmentKeys.teacher(courseId),
    queryFn: () => apiGet(`/api/assignments/course/${courseId}`),
    enabled: !!courseId,
  });
}

/** All submissions for an assignment (teacher view) */
export function useAssignmentSubmissions(assignmentId: string) {
  return useQuery<AssignmentSubmission[]>({
    queryKey: assignmentKeys.submissions(assignmentId),
    queryFn: () => apiGet<AssignmentSubmission[]>(`/api/assignments/${assignmentId}/submissions`),
    enabled: !!assignmentId,
  });
}

/** Create assignment — Teacher portal */
export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload) =>
      apiPost<Assignment>("/api/assignments", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: assignmentKeys.all }),
  });
}

/** Submit assignment — Student portal */
export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, fileUrl, studentUsn }: { assignmentId: string; fileUrl: string; studentUsn: string }) =>
      apiPost(`/api/assignments/${assignmentId}/submit`, { fileUrl, studentUsn }),
    onSuccess: () => qc.invalidateQueries({ queryKey: assignmentKeys.all }),
  });
}

/** Grade a submission — Teacher portal */
export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, grade, feedback }: { submissionId: string; grade: number; feedback?: string }) =>
      apiPatch(`/api/assignments/submissions/${submissionId}/grade`, { grade, feedback }),
    onSuccess: () => qc.invalidateQueries({ queryKey: assignmentKeys.all }),
  });
}
