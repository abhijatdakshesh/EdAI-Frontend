export type ComplianceFramework = "NAAC" | "NBA" | "NIRF" | "ABET";
export type CriterionStatus = "not_started" | "in_progress" | "under_review" | "approved";
export type EvidenceStatus = "pending" | "uploaded" | "verified" | "rejected";

export interface ComplianceCriterion {
  criterionId: string;
  framework: ComplianceFramework;
  code: string;
  title: string;
  weightage: number;
  score: number | null;
  maxScore: number;
  status: CriterionStatus;
  evidenceCount: number;
  pendingEvidenceCount: number;
}

export interface EvidenceItem {
  evidenceId: string;
  criterionId: string;
  title: string;
  uploadedBy: string;
  uploadedAt: string;
  status: EvidenceStatus;
  fileType: string;
}

export interface ComplianceDashboardResponse {
  refreshedAt: string;
  framework: ComplianceFramework;
  overallScore: number;
  maxPossibleScore: number;
  totalCriteria: number;
  approvedCriteria: number;
  pendingEvidence: number;
  criteria: ComplianceCriterion[];
  recentEvidence: EvidenceItem[];
}
