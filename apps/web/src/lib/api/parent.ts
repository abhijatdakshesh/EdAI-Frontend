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

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useParentDashboard() {
  return useQuery<ParentDashboardStats>({
    queryKey: parentKeys.dashboard,
    queryFn: () => apiGet<ParentDashboardStats>("/api/parent/dashboard"),
    staleTime: 60_000,
  });
}

export function useMyChildren() {
  return useQuery<ChildProfile[]>({
    queryKey: parentKeys.children,
    queryFn: () => apiGet<ChildProfile[]>("/api/parent/children"),
  });
}

export function useChild(usn: string) {
  return useQuery<ChildProfile>({
    queryKey: parentKeys.child(usn),
    queryFn: () => apiGet<ChildProfile>(`/api/parent/children/${usn}`),
    enabled: !!usn,
  });
}

export function useChildAttendance(usn: string) {
  return useQuery<StudentAttendanceSummary[]>({
    queryKey: parentKeys.childAttendance(usn),
    queryFn: () =>
      apiGet<StudentAttendanceSummary[]>(`/api/parent/children/${usn}/attendance`),
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

export function useChildFees(usn: string) {
  return useQuery<FeesSummary>({
    queryKey: parentKeys.childFees(usn),
    queryFn: () => apiGet<FeesSummary>(`/api/parent/children/${usn}/fees`),
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
