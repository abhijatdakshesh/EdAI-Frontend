import type { ComplianceDashboardResponse } from "./types";

export const mockComplianceDashboard: ComplianceDashboardResponse = {
  refreshedAt: new Date().toISOString(),
  framework: "NAAC",
  overallScore: 2.84,
  maxPossibleScore: 4.0,
  totalCriteria: 7,
  approvedCriteria: 3,
  pendingEvidence: 9,
  criteria: [
    {
      criterionId: "NAAC-C1",
      framework: "NAAC",
      code: "C1",
      title: "Curricular Aspects",
      weightage: 150,
      score: 4.2,
      maxScore: 5,
      status: "approved",
      evidenceCount: 12,
      pendingEvidenceCount: 0
    },
    {
      criterionId: "NAAC-C2",
      framework: "NAAC",
      code: "C2",
      title: "Teaching-Learning & Evaluation",
      weightage: 200,
      score: 3.8,
      maxScore: 5,
      status: "approved",
      evidenceCount: 21,
      pendingEvidenceCount: 0
    },
    {
      criterionId: "NAAC-C3",
      framework: "NAAC",
      code: "C3",
      title: "Research, Innovations & Extension",
      weightage: 250,
      score: 3.2,
      maxScore: 5,
      status: "under_review",
      evidenceCount: 18,
      pendingEvidenceCount: 4
    },
    {
      criterionId: "NAAC-C4",
      framework: "NAAC",
      code: "C4",
      title: "Infrastructure & Learning Resources",
      weightage: 100,
      score: null,
      maxScore: 5,
      status: "in_progress",
      evidenceCount: 6,
      pendingEvidenceCount: 5
    },
    {
      criterionId: "NAAC-C5",
      framework: "NAAC",
      code: "C5",
      title: "Student Support & Progression",
      weightage: 150,
      score: 4.0,
      maxScore: 5,
      status: "approved",
      evidenceCount: 14,
      pendingEvidenceCount: 0
    },
    {
      criterionId: "NAAC-C6",
      framework: "NAAC",
      code: "C6",
      title: "Governance, Leadership & Management",
      weightage: 100,
      score: null,
      maxScore: 5,
      status: "in_progress",
      evidenceCount: 4,
      pendingEvidenceCount: 0
    },
    {
      criterionId: "NAAC-C7",
      framework: "NAAC",
      code: "C7",
      title: "Institutional Values & Best Practices",
      weightage: 50,
      score: null,
      maxScore: 5,
      status: "not_started",
      evidenceCount: 0,
      pendingEvidenceCount: 0
    }
  ],
  recentEvidence: [
    {
      evidenceId: "EV-7001",
      criterionId: "NAAC-C3",
      title: "Research publications list AY 2025-26",
      uploadedBy: "Dr. R. Venkat",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      status: "uploaded",
      fileType: "pdf"
    },
    {
      evidenceId: "EV-7002",
      criterionId: "NAAC-C4",
      title: "Lab utilisation reports Q3",
      uploadedBy: "Dr. S. Padma",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      status: "pending",
      fileType: "xlsx"
    },
    {
      evidenceId: "EV-7003",
      criterionId: "NAAC-C3",
      title: "Industry collaboration MoUs",
      uploadedBy: "Admin",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      status: "verified",
      fileType: "pdf"
    }
  ]
};
