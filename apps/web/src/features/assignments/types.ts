export type AssignmentStatus = "open" | "submitted" | "late" | "missed" | "graded";

export interface Assignment {
  assignmentId: string;
  courseCode: string;
  title: string;
  dueDate: string;
  submittedCount: number;
  lateCount: number;
  missedCount: number;
  totalStudents: number;
  status: AssignmentStatus;
}

export interface AssignmentsDashboardResponse {
  refreshedAt: string;
  openAssignments: number;
  overdueCount: number;
  assignments: Assignment[];
}
