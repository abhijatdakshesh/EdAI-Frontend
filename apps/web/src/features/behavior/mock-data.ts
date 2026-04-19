import type { BehaviorDashboardResponse } from "./types";

export const mockBehaviorDashboard: BehaviorDashboardResponse = {
  refreshedAt: new Date().toISOString(),
  openIncidents: 5,
  criticalIncidents: 1,
  repeatOffenders: 2,
  incidents: [
    {
      incidentId: "INC-001",
      studentName: "Arun Patel",
      studentId: "USN001",
      class: "CSE Year 3 Sec A",
      category: "academic_dishonesty",
      severity: "high",
      status: "under_investigation",
      reportedBy: "Prof. K. Sharma",
      reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      description: "Copied during mid-term examination paper CS401.",
      isRepeatOffender: true
    },
    {
      incidentId: "INC-002",
      studentName: "Priya Reddy",
      studentId: "USN002",
      class: "ME Year 2 Sec B",
      category: "bullying",
      severity: "critical",
      status: "open",
      reportedBy: "Student Welfare Cell",
      reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      description: "Repeated verbal harassment reported by classmate.",
      isRepeatOffender: true
    },
    {
      incidentId: "INC-003",
      studentName: "Kiran Nair",
      studentId: "USN003",
      class: "EC Year 1 Sec A",
      category: "attendance_fraud",
      severity: "medium",
      status: "action_taken",
      reportedBy: "Dr. A. Bhat",
      reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      description: "Proxy attendance marked by another student during lecture.",
      isRepeatOffender: false
    },
    {
      incidentId: "INC-004",
      studentName: "Soham Desai",
      studentId: "USN004",
      class: "CS Year 4 Sec A",
      category: "misconduct",
      severity: "low",
      status: "closed",
      reportedBy: "Lab Coordinator",
      reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      description: "Unauthorized use of lab equipment outside scheduled hours.",
      isRepeatOffender: false
    }
  ]
};
