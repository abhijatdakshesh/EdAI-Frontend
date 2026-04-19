import type { MarksDashboardResponse } from "./types";

export const mockMarksDashboard: MarksDashboardResponse = {
  updatedAt: new Date().toISOString(),
  flaggedSubmissions: 14,
  assessments: [
    {
      assessmentId: "ASM-ENG-2201",
      courseCode: "ENG2201",
      title: "Internal Assessment 2",
      maxMarks: 30,
      pendingVerification: 5
    },
    {
      assessmentId: "ASM-MAT-1103",
      courseCode: "MAT1103",
      title: "Quiz Cycle",
      maxMarks: 20,
      pendingVerification: 9
    }
  ]
};
