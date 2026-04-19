/**
 * React Query hooks for Job Portal.
 * Backend: /api/jobs
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobType = "FULL_TIME" | "INTERNSHIP" | "PART_TIME" | "CONTRACT";
export type ApplicationStatus =
  | "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN";

export interface Job {
  id: string;
  company: string;
  role: string;
  type: JobType;
  location: string;
  package?: string;
  description: string;
  requirements: string[];
  skills: string[];
  deadline: string;
  postedAt: string;
  active: boolean;
  minCgpa?: number;
  minAttendance?: number;
  targetDepts?: string[];
  targetBatches?: string[];
}

export interface JobApplication {
  id: string;
  jobId: string;
  company: string;
  role: string;
  appliedAt: string;
  status: ApplicationStatus;
  interviewDate?: string;
  notes?: string;
}

export interface JobsFilter {
  type?: JobType;
  location?: string;
  search?: string;
  dept?: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const jobKeys = {
  list: (f: JobsFilter) => ["jobs", "list", f] as const,
  detail: (id: string) => ["jobs", "detail", id] as const,
  applied: ["jobs", "applied"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useJobs(filters: JobsFilter = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.location) params.set("location", filters.location);
  if (filters.search) params.set("search", filters.search);
  if (filters.dept) params.set("dept", filters.dept);
  const qs = params.toString();

  return useQuery<Job[]>({
    queryKey: jobKeys.list(filters),
    queryFn: () => apiGet<Job[]>(`/api/jobs${qs ? `?${qs}` : ""}`),
  });
}

export function useJob(id: string) {
  return useQuery<Job>({
    queryKey: jobKeys.detail(id),
    queryFn: () => apiGet<Job>(`/api/jobs/${id}`),
    enabled: !!id,
  });
}

export function useAppliedJobs() {
  return useQuery<JobApplication[]>({
    queryKey: jobKeys.applied,
    queryFn: () => apiGet<JobApplication[]>("/api/jobs/applications/me"),
  });
}

export function useApplyToJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      apiPost<JobApplication>(`/api/jobs/${jobId}/apply`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: jobKeys.applied }),
  });
}

export function useWithdrawApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) =>
      apiPost(`/api/jobs/applications/${applicationId}/withdraw`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: jobKeys.applied }),
  });
}
