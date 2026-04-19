import type { MentorshipDashboardResponse } from "./types";

export const mockMentorshipDashboard: MentorshipDashboardResponse = {
  fetchedAt: new Date().toISOString(),
  totalMentors: 48,
  totalMentees: 384,
  overdueFollowUps: 11,
  mentors: [
    {
      mentorId: "FAC-101",
      mentorName: "Dr. R. Venkat",
      designation: "Professor, CSE",
      menteeCount: 9,
      nextSessionDate: "2026-04-20"
    },
    {
      mentorId: "FAC-102",
      mentorName: "Dr. S. Padma",
      designation: "Assoc. Professor, ECE",
      menteeCount: 8,
      nextSessionDate: "2026-04-21"
    }
  ],
  mentees: [
    {
      studentId: "STU1044",
      studentName: "A. Nair",
      program: "BTech CSE",
      mentorName: "Dr. R. Venkat",
      riskLevel: "high",
      lastSessionDate: "2026-04-01",
      sessionCount: 4,
      lastOutcome: "needs_followup",
      followUpDue: true
    },
    {
      studentId: "STU3390",
      studentName: "S. Priya",
      program: "BTech CSE",
      mentorName: "Dr. R. Venkat",
      riskLevel: "low",
      lastSessionDate: "2026-04-10",
      sessionCount: 7,
      lastOutcome: "productive",
      followUpDue: false
    },
    {
      studentId: "STU5521",
      studentName: "M. Gowda",
      program: "BTech ME",
      mentorName: "Dr. S. Padma",
      riskLevel: "medium",
      lastSessionDate: "2026-03-28",
      sessionCount: 3,
      lastOutcome: "escalated",
      followUpDue: true
    }
  ]
};
