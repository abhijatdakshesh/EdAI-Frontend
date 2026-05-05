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

// ─── Mock data (USE_MOCKS=true) ───────────────────────────────────────────────

const MOCK_JOBS: Job[] = [
  {
    id: "mock-job-1",
    company: "Infosys",
    role: "Software Engineer",
    type: "FULL_TIME",
    location: "Bengaluru",
    package: "6.5 LPA",
    description: "Full-stack development role.",
    requirements: ["B.E/B.Tech", "CGPA ≥ 7.0"],
    skills: ["Java", "React", "SQL"],
    deadline: "2025-06-30",
    postedAt: "2025-05-01",
    active: true,
    minCgpa: 7.0,
    targetDepts: ["CSE", "ISE", "ECE"],
  },
  {
    id: "mock-job-2",
    company: "Wipro",
    role: "Data Analyst Intern",
    type: "INTERNSHIP",
    location: "Bengaluru",
    package: "25,000/month",
    description: "Analytics and reporting internship.",
    requirements: ["B.E/B.Tech"],
    skills: ["Python", "SQL", "Power BI"],
    deadline: "2025-06-15",
    postedAt: "2025-05-02",
    active: true,
    minCgpa: 6.5,
    targetDepts: ["CSE", "ISE"],
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useJobs(filters: JobsFilter = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.location) params.set("location", filters.location);
  if (filters.search) params.set("search", filters.search);
  if (filters.dept) params.set("dept", filters.dept);
  const qs = params.toString();

  const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  return useQuery<Job[]>({
    queryKey: jobKeys.list(filters),
    queryFn: USE_MOCKS
      ? () => Promise.resolve(MOCK_JOBS)
      : () => apiGet<Job[]>(`/api/jobs${qs ? `?${qs}` : ""}`),
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
