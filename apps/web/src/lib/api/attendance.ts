/**
 * React Query hooks for Attendance data.
 * Backend: attendance service → /api/attendance
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  studentUsn: string;
  courseId: string;
  date: string; // ISO date
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  markedBy: string;
  createdAt: string;
}

export interface StudentAttendanceSummary {
  courseId: string;
  courseName: string;
  courseCode: string;
  totalClasses: number;
  attended: number;
  pct: number;
  canMiss: number; // how many more can be missed staying above 75%
  mustAttend: number; // how many needed to reach 75%
}

export interface ClassAttendanceSummary {
  classId: string;
  className: string;
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  pct: number;
}

export interface BulkAttendancePayload {
  courseId: string;
  classId: string;
  date: string;
  entries: { studentUsn: string; status: "PRESENT" | "ABSENT" | "LATE" }[];
  markedBy: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const attKeys = {
  studentSummary: (usn: string) => ["attendance", "student", usn] as const,
  classSummary: (classId: string) => ["attendance", "class", classId] as const,
  classToday: (classId: string) => ["attendance", "class", classId, "today"] as const,
  atRisk: (classId: string) => ["attendance", "atrisk", classId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Student's attendance per course — Student portal */
export function useStudentAttendance(usn: string) {
  return useQuery<StudentAttendanceSummary[]>({
    queryKey: attKeys.studentSummary(usn),
    queryFn: () => apiGet<StudentAttendanceSummary[]>(`/api/attendance/student/${usn}/summary`),
    enabled: !!usn,
  });
}

/** Class-level attendance summary — Teacher portal */
export function useClassAttendanceSummary(classId: string) {
  return useQuery<ClassAttendanceSummary>({
    queryKey: attKeys.classSummary(classId),
    queryFn: () => apiGet<ClassAttendanceSummary>(`/api/attendance/class/${classId}/summary`),
    enabled: !!classId,
  });
}

/** Students below 75% threshold — Teacher / Admin portal */
export function useAtRiskStudents(classId: string) {
  return useQuery<{ usn: string; name: string; pct: number; parentPhone: string; lastCallDate?: string }[]>({
    queryKey: attKeys.atRisk(classId),
    queryFn: () => apiGet(`/api/attendance/class/${classId}/at-risk`),
    enabled: !!classId,
  });
}

/** Mark bulk attendance — Teacher portal */
export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkAttendancePayload) =>
      apiPost("/api/attendance/bulk", payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: attKeys.classSummary(v.classId) });
      qc.invalidateQueries({ queryKey: attKeys.atRisk(v.classId) });
    },
  });
}
