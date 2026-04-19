export type RiskLevel = "low" | "medium" | "high" | "critical";
export type RiskFactor = "attendance" | "marks" | "fees" | "behavior" | "engagement";

export interface StudentRiskProfile {
  studentId: string;
  name: string;
  rollNumber: string;
  class: string;
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  attendancePct: number;
  cgpa: number;
  feesDue: number;
  lastContactAt: string | null;
}

export interface StudentsDashboardResponse {
  refreshedAt: string;
  totalStudents: number;
  atRisk: number;
  criticalCount: number;
  students: StudentRiskProfile[];
}
