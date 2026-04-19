import type { DashboardResponse } from "./types";

export const mockDashboard: DashboardResponse = {
  generatedAt: new Date().toISOString(),
  kpis: [
    {
      label: "Attendance Rate",
      value: 91.2,
      unit: "%",
      trend: "up",
      trendValue: "+1.4% vs last week",
      status: "healthy"
    },
    {
      label: "Fee Collection",
      value: "₹1.82Cr",
      trend: "flat",
      trendValue: "On target",
      status: "healthy"
    },
    {
      label: "At-Risk Students",
      value: 60,
      trend: "down",
      trendValue: "-8 since Monday",
      status: "warning"
    },
    {
      label: "Open Grievances",
      value: 7,
      trend: "up",
      trendValue: "+3 this week",
      status: "warning"
    },
    {
      label: "Placement Offers",
      value: 142,
      trend: "up",
      trendValue: "+12 this week",
      status: "healthy"
    },
    {
      label: "NAAC Score",
      value: "2.84",
      unit: "/ 4.0",
      trend: "flat",
      trendValue: "Under review",
      status: "warning"
    },
    {
      label: "Voice Calls Made",
      value: 1247,
      trend: "up",
      trendValue: "+89 today",
      status: "healthy"
    },
    {
      label: "SLA Breaches",
      value: 2,
      trend: "down",
      trendValue: "-1 resolved today",
      status: "critical"
    }
  ],
  campusHealth: [
    {
      campusId: "rvce-main",
      campusName: "RVCE Main Campus",
      attendanceRate: 92.9,
      feeCollectionRate: 88.4,
      atRiskStudents: 41,
      openGrievances: 5,
      healthScore: 87
    },
    {
      campusId: "rvpu-bangalore",
      campusName: "RVPU Bangalore",
      attendanceRate: 93.1,
      feeCollectionRate: 91.2,
      atRiskStudents: 19,
      openGrievances: 2,
      healthScore: 91
    }
  ],
  recentAlerts: [
    {
      alertId: "ALT-1001",
      kind: "attendance",
      message: "Attendance below 85% threshold for 3 consecutive days in BTech ME Year 2.",
      severity: "warning",
      occurredAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      alertId: "ALT-1002",
      kind: "compliance",
      message: "NAAC C7 criterion has no evidence uploaded. Submission deadline in 14 days.",
      severity: "critical",
      occurredAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    },
    {
      alertId: "ALT-1003",
      kind: "finance",
      message: "INV-8821 overdue. Parent contacted via voice agent. Follow-up scheduled.",
      severity: "info",
      occurredAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
    },
    {
      alertId: "ALT-1004",
      kind: "behavior",
      message: "Repeat disciplinary incident pattern detected for 2 students in CSE Year 3.",
      severity: "warning",
      occurredAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
    }
  ]
};
