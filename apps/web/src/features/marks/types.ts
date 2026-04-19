export interface AssessmentItem {
  assessmentId: string;
  courseCode: string;
  title: string;
  maxMarks: number;
  pendingVerification: number;
}

export interface MarksDashboardResponse {
  updatedAt: string;
  assessments: AssessmentItem[];
  flaggedSubmissions: number;
}
