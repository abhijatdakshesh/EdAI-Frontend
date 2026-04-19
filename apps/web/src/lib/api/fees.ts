/**
 * React Query hooks for Fees.
 * Backend: fees service → /api/fees
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeeStatus = "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
export type FeeComponent = "TUITION" | "HOSTEL" | "TRANSPORT" | "EXAM" | "LIBRARY" | "OTHER";

export interface FeeItem {
  id: string;
  studentUsn: string;
  component: FeeComponent;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: FeeStatus;
  semester: number;
  academicYear: string;
  receiptNo?: string;
  transactionId?: string;
}

export interface FeesSummary {
  totalDue: number;
  totalPaid: number;
  totalOutstanding: number;
  status: FeeStatus;
  items: FeeItem[];
}

export interface PaymentInitPayload {
  studentUsn: string;
  feeIds: string[];
  amount: number;
  gateway: "RAZORPAY" | "UPI";
}

export interface PaymentInitResult {
  orderId: string;
  amount: number;
  currency: string;
  key?: string; // Razorpay key_id
  upiId?: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const feeKeys = {
  summary: (usn: string) => ["fees", "summary", usn] as const,
  history: (usn: string) => ["fees", "history", usn] as const,
  adminSummary: ["fees", "admin"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Student fee summary — Student/Parent portal */
export function useFeeSummary(usn: string) {
  return useQuery<FeesSummary>({
    queryKey: feeKeys.summary(usn),
    queryFn: () => apiGet<FeesSummary>(`/api/fees/student/${usn}/summary`),
    enabled: !!usn,
  });
}

/** Student payment history */
export function useFeeHistory(usn: string) {
  return useQuery<FeeItem[]>({
    queryKey: feeKeys.history(usn),
    queryFn: () => apiGet<FeeItem[]>(`/api/fees/student/${usn}/history`),
    enabled: !!usn,
  });
}

/** Initiate Razorpay / UPI payment */
export function useInitiatePayment() {
  return useMutation({
    mutationFn: (payload: PaymentInitPayload) =>
      apiPost<PaymentInitResult>("/api/fees/payment/initiate", payload),
  });
}

/** Verify payment after gateway callback */
export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, paymentId, signature, studentUsn }: {
      orderId: string;
      paymentId: string;
      signature: string;
      studentUsn: string;
    }) =>
      apiPost("/api/fees/payment/verify", { orderId, paymentId, signature }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: feeKeys.summary(v.studentUsn) }),
  });
}
