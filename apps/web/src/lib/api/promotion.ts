/**
 * React Query hooks for Student Promotion.
 * Backend: academics service → /api/promotion
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PromotionStatus = "ELIGIBLE" | "DETAINED" | "CONDITIONAL" | "PROMOTED";

export interface PromotionCriteria {
  minAttendancePct: number;
  minIaScore: number;
  feeClearanceRequired: boolean;
}

export interface StudentEligibility {
  studentUsn: string;
  studentName: string;
  currentSemester: number;
  targetSemester: number;
  attendancePct: number;
  iaScore: number;
  feeCleared: boolean;
  status: PromotionStatus;
  failedCriteria: string[];
  overrideNote?: string;
  overriddenBy?: string;
}

export interface PromotionBatch {
  id: string;
  classId: string;
  className: string;
  fromSemester: number;
  toSemester: number;
  academicYear: string;
  generatedAt: string;
  promotedAt?: string;
  promotedBy?: string;
  criteria: PromotionCriteria;
  students: StudentEligibility[];
  stats: {
    total: number;
    eligible: number;
    detained: number;
    conditional: number;
    promoted: number;
  };
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const promotionKeys = {
  all: ["promotion", "batches"] as const,
  batch: (id: string) => ["promotion", "batches", id] as const,
  detentionList: ["promotion", "detention-list"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function usePromotionBatches() {
  return useQuery<PromotionBatch[]>({
    queryKey: promotionKeys.all,
    queryFn: () => apiGet<PromotionBatch[]>("/api/promotion/batches"),
  });
}

export function usePromotionBatch(id: string) {
  return useQuery<PromotionBatch>({
    queryKey: promotionKeys.batch(id),
    queryFn: () => apiGet<PromotionBatch>(`/api/promotion/batches/${id}`),
    enabled: !!id,
  });
}

export function useDetentionList(classId?: string, semester?: number) {
  const params = new URLSearchParams();
  if (classId) params.set("classId", classId);
  if (semester) params.set("semester", String(semester));
  const qs = params.toString();
  return useQuery<StudentEligibility[]>({
    queryKey: [...promotionKeys.detentionList, classId, semester],
    queryFn: () =>
      apiGet<StudentEligibility[]>(`/api/promotion/detention-list${qs ? `?${qs}` : ""}`),
  });
}

export function useGeneratePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      classId: string;
      className: string;
      fromSemester: number;
      academicYear: string;
      criteria?: Partial<PromotionCriteria>;
    }) => apiPost<PromotionBatch>("/api/promotion/generate", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: promotionKeys.all }),
  });
}

export function useOverridePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      batchId,
      ...body
    }: {
      batchId: string;
      studentUsn: string;
      status: PromotionStatus;
      note: string;
      overriddenBy: string;
    }) => apiPatch<PromotionBatch>(`/api/promotion/batches/${batchId}/override`, body),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: promotionKeys.batch(v.batchId) }),
  });
}

export function useExecutePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      batchId,
      promotedBy,
    }: {
      batchId: string;
      promotedBy: string;
    }) =>
      apiPost<{ promoted: string[]; detained: string[] }>(
        `/api/promotion/batches/${batchId}/promote`,
        { promotedBy },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: promotionKeys.all }),
  });
}
