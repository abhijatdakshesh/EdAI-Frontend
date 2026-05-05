/**
 * React Query hooks for the Parent portal.
 * Backend: /api/parent
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./client";
import type { StudentAttendanceSummary } from "./attendance";
import type { FeesSummary } from "./fees";
import type { StudentResults } from "./marks";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChildProfile {
  usn: string;
  name: string;
  email: string;
  dept: string;
  semester: number;
  section: string;
  cgpa: number;
  attendancePct: number;
  feeStatus: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
  photo?: string;
}

export interface ParentDashboardStats {
  children: ChildProfile[];
  totalUnreadNotifications: number;
  pendingFeeAmount: number;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const parentKeys = {
  dashboard: ["parent", "dashboard"] as const,
  children: ["parent", "children"] as const,
  child: (usn: string) => ["parent", "child", usn] as const,
  childAttendance: (usn: string) => ["parent", "child", usn, "attendance"] as const,
  childResults: (usn: string) => ["parent", "child", usn, "results"] as const,
  childFees: (usn: string) => ["parent", "child", usn, "fees"] as const,
};

// ─── Mock data (USE_MOCKS=true) ───────────────────────────────────────────────

const MOCK_CHILDREN: ChildProfile[] = [
  {
    usn: "1RV21CS001",
    name: "Arjun Sharma",
    email: "arjun@rvce.edu.in",
    dept: "CSE",
    semester: 5,
    section: "A",
    cgpa: 8.42,
    attendancePct: 78,
    feeStatus: "PAID",
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useParentDashboard() {
  return useQuery<ParentDashboardStats>({
    queryKey: parentKeys.dashboard,
    queryFn: () => apiGet<ParentDashboardStats>("/api/parent/dashboard"),
    staleTime: 60_000,
  });
}

export function useMyChildren() {
  const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  return useQuery<ChildProfile[]>({
    queryKey: parentKeys.children,
    queryFn: USE_MOCKS
      ? () => Promise.resolve(MOCK_CHILDREN)
      : () => apiGet<ChildProfile[]>("/api/parent/children"),
    // Keep children data fresh for 30 s so navigating between parent pages
    // does not re-trigger a loading flash that creates a blank fees window.
    staleTime: 30_000,
  });
}

export function useChild(usn: string) {
  return useQuery<ChildProfile>({
    queryKey: parentKeys.child(usn),
    queryFn: () => apiGet<ChildProfile>(`/api/parent/children/${usn}`),
    enabled: !!usn,
  });
}

const MOCK_CHILD_ATTENDANCE: StudentAttendanceSummary[] = [
  { courseId: "21CS51", courseName: "Database Management Systems", courseCode: "21CS51", totalClasses: 40, attended: 34, pct: 85, canMiss: 3, mustAttend: 0 },
  { courseId: "21CS52", courseName: "Computer Networks", courseCode: "21CS52", totalClasses: 38, attended: 27, pct: 71, canMiss: 0, mustAttend: 2 },
];

export function useChildAttendance(usn: string) {
  const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  return useQuery<StudentAttendanceSummary[]>({
    queryKey: parentKeys.childAttendance(usn),
    queryFn: USE_MOCKS
      ? () => Promise.resolve(MOCK_CHILD_ATTENDANCE)
      : () => apiGet<StudentAttendanceSummary[]>(`/api/parent/children/${usn}/attendance`),
    // Gate on !!usn even in mock mode — same reason as useChildFees.
    // Firing with usn="" creates a junk cache key and triggers a second
    // loading cycle once the real USN is available.
    enabled: !!usn,
  });
}

export function useChildResults(usn: string) {
  return useQuery<StudentResults>({
    queryKey: parentKeys.childResults(usn),
    queryFn: () => apiGet<StudentResults>(`/api/parent/children/${usn}/results`),
    enabled: !!usn,
  });
}

const MOCK_CHILD_FEES: FeesSummary = {
  totalDue: 95000,
  totalPaid: 95000,
  totalOutstanding: 0,
  status: "PAID",
  items: [
    { id: "f1", studentUsn: "1RV21CS001", component: "TUITION", amount: 75000, dueDate: "2024-07-01", paidDate: "2024-06-28", status: "PAID", semester: 5, academicYear: "2024-25", receiptNo: "RCT-2024-001" },
    { id: "f2", studentUsn: "1RV21CS001", component: "EXAM", amount: 20000, dueDate: "2024-10-01", paidDate: "2024-09-25", status: "PAID", semester: 5, academicYear: "2024-25", receiptNo: "RCT-2024-002" },
  ],
};

export function useChildFees(usn: string) {
  const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  return useQuery<FeesSummary>({
    queryKey: parentKeys.childFees(usn),
    queryFn: USE_MOCKS
      ? () => Promise.resolve(MOCK_CHILD_FEES)
      : () => apiGet<FeesSummary>(`/api/parent/children/${usn}/fees`),
    // Always gate on !!usn — even in mock mode.
    // Without this, the query fires with usn="" (cache key ["parent","child","","fees"])
    // while children are loading, resolves immediately, then fires AGAIN with the real
    // USN once children resolve (new cache key, cache miss → loadingFees=true again).
    // That second loading window shows only the animate-pulse skeleton, which has no
    // text content, causing the E2E locator to find nothing and time out.
    enabled: !!usn,
  });
}

export function useInitiateChildPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      childUsn,
      feeIds,
      amount,
    }: {
      childUsn: string;
      feeIds: string[];
      amount: number;
    }) =>
      apiPost<{ orderId: string; amount: number; currency: string; key: string }>(
        `/api/parent/children/${childUsn}/fees/pay`,
        { feeIds, amount },
      ),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: parentKeys.childFees(v.childUsn) }),
  });
}

export function useVerifyChildPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ childUsn, orderId, paymentId, signature }: {
      childUsn: string; orderId: string; paymentId: string; signature: string;
    }) =>
      apiPost<{ success: boolean; receiptId?: string; paidAt?: string; error?: string }>(
        `/api/parent/children/${childUsn}/fees/verify`,
        { orderId, paymentId, signature },
      ),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: parentKeys.childFees(v.childUsn) }),
  });
}

export function useScholarshipEligibility(childUsn: string) {
  return useQuery<{
    eligible: boolean;
    schemes: { name: string; amount: number; criteria: string }[];
  }>({
    queryKey: ["parent", "child", childUsn, "scholarship"],
    queryFn: () =>
      apiGet(`/api/parent/children/${childUsn}/scholarship-eligibility`),
    enabled: !!childUsn,
  });
}
