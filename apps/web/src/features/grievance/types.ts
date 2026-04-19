export type GrievanceCategory =
  | "academic"
  | "infrastructure"
  | "faculty_conduct"
  | "financial"
  | "harassment"
  | "other";

export type GrievanceStatus = "open" | "assigned" | "in_review" | "resolved" | "closed";
export type GrievancePriority = "low" | "medium" | "high" | "critical";

export interface GrievanceCase {
  caseId: string;
  studentName: string;
  program: string;
  category: GrievanceCategory;
  priority: GrievancePriority;
  status: GrievanceStatus;
  summary: string;
  assignedOfficer: string | null;
  createdAt: string;
  slaDeadline: string;
  slaBreach: boolean;
}

export interface GrievanceDashboardResponse {
  fetchedAt: string;
  openCount: number;
  slaBreachCount: number;
  resolvedThisWeek: number;
  cases: GrievanceCase[];
}
