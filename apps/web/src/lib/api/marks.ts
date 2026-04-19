/**
 * React Query hooks for Marks / Results.
 * Backend: academics service → /api/academics/marks
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssessmentComponent =
  | "HOMEWORK" | "QUIZ" | "IA1" | "IA2" | "PRACTICAL" | "PROJECT" | "SEMESTER";

export interface MarksEntry {
  id: string;
  studentUsn: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  component: AssessmentComponent;
  score: number;
  maxScore: number;
  status: "DRAFT" | "PENDING_REVIEW" | "VERIFIED" | "SYNCED";
  createdAt: string;
}

export interface SemesterResult {
  semester: number;
  sgpa: number;
  subjects: {
    code: string;
    name: string;
    credits: number;
    ia: number;
    exam: number;
    total: number;
    grade: string;
  }[];
}

export interface StudentResults {
  usn: string;
  name: string;
  cgpa: number;
  semesters: SemesterResult[];
}

export interface BulkMarksPayload {
  subjectId: string;
  component: AssessmentComponent;
  entries: { studentId: string; score: number | null }[];
  enteredBy: string;
}

export interface ValidationFlag {
  studentId: string;
  studentName: string;
  score: number;
  flagType: string;
  message: string;
  suggestion?: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const marksKeys = {
  studentResults: (usn: string) => ["marks", "results", usn] as const,
  subjectMarks: (subjectId: string) => ["marks", "subject", subjectId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Full results for a student — Student portal */
export function useStudentResults(usn: string) {
  return useQuery<StudentResults>({
    queryKey: marksKeys.studentResults(usn),
    queryFn: () => apiGet<StudentResults>(`/api/academics/results/student/${usn}`),
    enabled: !!usn,
  });
}

/** Marks for a subject — Teacher portal */
export function useSubjectMarks(subjectId: string, component?: AssessmentComponent) {
  const qs = component ? `?component=${component}` : "";
  return useQuery<MarksEntry[]>({
    queryKey: marksKeys.subjectMarks(subjectId),
    queryFn: () => apiGet<MarksEntry[]>(`/api/academics/marks/subject/${subjectId}${qs}`),
    enabled: !!subjectId,
  });
}

/** Validate bulk marks before saving (AI validation) */
export function useValidateBulkMarks() {
  return useMutation({
    mutationFn: (payload: BulkMarksPayload) =>
      apiPost<{ flags: ValidationFlag[]; flagCount: number; canProceed: boolean }>(
        "/api/academics/marks/bulk",
        payload,
      ),
  });
}

/** Confirm and save validated bulk marks */
export function useConfirmBulkMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dto, flags }: { dto: BulkMarksPayload; flags: ValidationFlag[] }) =>
      apiPost("/api/academics/marks/bulk/confirm", { dto, flags }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marks"] }),
  });
}
