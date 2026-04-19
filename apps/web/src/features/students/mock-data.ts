import type { StudentsDashboardResponse } from "./types";

export const mockStudentsDashboard: StudentsDashboardResponse = {
  refreshedAt: new Date().toISOString(),
  totalStudents: 1840,
  atRisk: 60,
  criticalCount: 8,
  students: [
    {
      studentId: "STU-001",
      name: "Rithvik Rao",
      rollNumber: "1RV22CS001",
      class: "CSE Year 2",
      riskScore: 88,
      riskLevel: "critical",
      riskFactors: ["attendance", "marks", "fees"],
      attendancePct: 54,
      cgpa: 4.2,
      feesDue: 48000,
      lastContactAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
    },
    {
      studentId: "STU-002",
      name: "Anitha Gowda",
      rollNumber: "1RV22ME010",
      class: "ME Year 2",
      riskScore: 74,
      riskLevel: "high",
      riskFactors: ["attendance", "engagement"],
      attendancePct: 68,
      cgpa: 5.8,
      feesDue: 0,
      lastContactAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    },
    {
      studentId: "STU-003",
      name: "Naveen Shetty",
      rollNumber: "1RV23EC021",
      class: "EC Year 1",
      riskScore: 62,
      riskLevel: "high",
      riskFactors: ["marks", "behavior"],
      attendancePct: 79,
      cgpa: 4.9,
      feesDue: 15000,
      lastContactAt: null
    },
    {
      studentId: "STU-004",
      name: "Sneha Pillai",
      rollNumber: "1RV21CS112",
      class: "CSE Year 3",
      riskScore: 45,
      riskLevel: "medium",
      riskFactors: ["fees"],
      attendancePct: 84,
      cgpa: 7.1,
      feesDue: 22000,
      lastContactAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    }
  ]
};
