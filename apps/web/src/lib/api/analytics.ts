/**
 * React Query hooks for Analytics & Reports.
 * Backend: analytics service → /api/analytics
 */
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AttendanceTrendPoint {
  month: string;  // e.g. "Jan 25"
  pct: number;
}

export interface FeeCollectionPoint {
  month: string;
  collected: number; // in lakhs
  target: number;
}

export interface DepartmentAttendanceStat {
  dept: string;
  avgPct: number;
  belowThreshold: number; // count of students below 75%
}

export interface PerformanceSummary {
  avgCgpa: number;
  topCgpa: number;
  below5: number;  // count of students with CGPA < 5
  passRate: number; // percentage
}

export interface AdminDashboardStats {
  totalStudents: number;
  totalFaculty: number;
  avgAttendance: number;
  feeCollectionPct: number;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const analyticsKeys = {
  adminDashboard: ["analytics", "admin", "dashboard"] as const,
  attendanceTrend: (institutionId: string) => ["analytics", "attendance-trend", institutionId] as const,
  feeCollection: (year: string) => ["analytics", "fee-collection", year] as const,
  deptAttendance: ["analytics", "dept-attendance"] as const,
  performance: (classId: string) => ["analytics", "performance", classId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAdminDashboardStats() {
  return useQuery<AdminDashboardStats>({
    queryKey: analyticsKeys.adminDashboard,
    queryFn: () => apiGet<AdminDashboardStats>("/api/analytics/admin/dashboard"),
    staleTime: 60_000,
  });
}

export function useAttendanceTrend(institutionId = "rvce") {
  return useQuery<AttendanceTrendPoint[]>({
    queryKey: analyticsKeys.attendanceTrend(institutionId),
    queryFn: () =>
      apiGet<AttendanceTrendPoint[]>(`/api/analytics/attendance-trend?institutionId=${institutionId}`),
    staleTime: 300_000, // 5 min
  });
}

export function useFeeCollectionTrend(academicYear = "2024-25") {
  return useQuery<FeeCollectionPoint[]>({
    queryKey: analyticsKeys.feeCollection(academicYear),
    queryFn: () =>
      apiGet<FeeCollectionPoint[]>(`/api/analytics/fee-collection?year=${academicYear}`),
    staleTime: 300_000,
  });
}

export function useDeptAttendanceStats() {
  return useQuery<DepartmentAttendanceStat[]>({
    queryKey: analyticsKeys.deptAttendance,
    queryFn: () => apiGet<DepartmentAttendanceStat[]>("/api/analytics/attendance/by-department"),
    staleTime: 120_000,
  });
}

export function useClassPerformance(classId: string) {
  return useQuery<PerformanceSummary>({
    queryKey: analyticsKeys.performance(classId),
    queryFn: () => apiGet<PerformanceSummary>(`/api/analytics/performance?classId=${classId}`),
    enabled: !!classId,
  });
}
