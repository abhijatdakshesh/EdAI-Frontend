import type { GrievanceDashboardResponse } from "./types";

export const mockGrievanceDashboard: GrievanceDashboardResponse = {
  fetchedAt: new Date().toISOString(),
  openCount: 7,
  slaBreachCount: 2,
  resolvedThisWeek: 5,
  cases: [
    {
      caseId: "GRV-5001",
      studentName: "A. Nair",
      program: "BTech CSE",
      category: "academic",
      priority: "high",
      status: "open",
      summary: "Grade discrepancy in ENG2201 Internal Assessment 2.",
      assignedOfficer: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      slaDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      slaBreach: false
    },
    {
      caseId: "GRV-5002",
      studentName: "M. Gowda",
      program: "BTech ME",
      category: "infrastructure",
      priority: "medium",
      status: "assigned",
      summary: "Laboratory equipment non-functional for 2 weeks.",
      assignedOfficer: "Dr. S. Padma",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      slaDeadline: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      slaBreach: true
    },
    {
      caseId: "GRV-5003",
      studentName: "P. Ayesha",
      program: "MBA",
      category: "financial",
      priority: "critical",
      status: "in_review",
      summary: "Scholarship disbursement not received despite approval letter.",
      assignedOfficer: "Dr. R. Venkat",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      slaDeadline: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
      slaBreach: false
    },
    {
      caseId: "GRV-5004",
      studentName: "D. Karthik",
      program: "BTech CSE",
      category: "other",
      priority: "low",
      status: "resolved",
      summary: "Library access card not issued after registration.",
      assignedOfficer: "Dr. S. Padma",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
      slaDeadline: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      slaBreach: false
    }
  ]
};
