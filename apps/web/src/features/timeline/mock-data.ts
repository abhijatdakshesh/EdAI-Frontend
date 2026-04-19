import type { TimelineDashboardResponse } from "./types";

export const mockTimelineDashboard: TimelineDashboardResponse = {
  fetchedAt: new Date().toISOString(),
  events: [
    {
      eventId: "EVT-9001",
      studentId: "STU1044",
      studentName: "A. Nair",
      kind: "attendance",
      priority: "critical",
      title: "4-day absence streak",
      detail: "Student has not attended for 4 consecutive days. Guardian notified via voice agent.",
      occurredAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      pinned: true,
      acknowledged: false
    },
    {
      eventId: "EVT-9002",
      studentId: "STU5521",
      studentName: "M. Gowda",
      kind: "marks",
      priority: "medium",
      title: "Assessment submission delayed",
      detail: "MAT1103 submission pending verification for 3 days.",
      occurredAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      pinned: false,
      acknowledged: false
    },
    {
      eventId: "EVT-9003",
      studentId: "STU2288",
      studentName: "D. Karthik",
      kind: "fees",
      priority: "high",
      title: "Fee overdue — 3rd reminder",
      detail: "INV-8821 due 2026-04-25. Third payment reminder sent.",
      occurredAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      pinned: false,
      acknowledged: true
    },
    {
      eventId: "EVT-9004",
      studentId: "STU3390",
      studentName: "S. Priya",
      kind: "counselling",
      priority: "low",
      title: "Mentor session completed",
      detail: "Monthly counselling session logged by mentor Dr. Venkat.",
      occurredAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      pinned: false,
      acknowledged: true
    }
  ]
};
