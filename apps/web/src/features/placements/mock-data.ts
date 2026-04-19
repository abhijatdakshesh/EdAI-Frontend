import type { PlacementsDashboardResponse } from "./types";

export const mockPlacementsDashboard: PlacementsDashboardResponse = {
  refreshedAt: new Date().toISOString(),
  activeDrives: 3,
  totalOffers: 142,
  drives: [
    {
      driveId: "DRV-2041",
      company: "Infosys",
      role: "Systems Engineer",
      ctcLpa: 6.5,
      eligibleCount: 480,
      appliedCount: 312,
      shortlistedCount: 94,
      offersCount: 52,
      status: "active",
      scheduledDate: "2026-04-22"
    },
    {
      driveId: "DRV-2042",
      company: "Wipro",
      role: "Project Engineer",
      ctcLpa: 5.5,
      eligibleCount: 390,
      appliedCount: 258,
      shortlistedCount: 71,
      offersCount: 38,
      status: "active",
      scheduledDate: "2026-04-25"
    },
    {
      driveId: "DRV-2043",
      company: "Amazon",
      role: "SDE-1",
      ctcLpa: 24,
      eligibleCount: 120,
      appliedCount: 87,
      shortlistedCount: 22,
      offersCount: 8,
      status: "active",
      scheduledDate: "2026-04-28"
    },
    {
      driveId: "DRV-2040",
      company: "TCS",
      role: "Associate",
      ctcLpa: 7,
      eligibleCount: 600,
      appliedCount: 501,
      shortlistedCount: 210,
      offersCount: 44,
      status: "closed",
      scheduledDate: "2026-04-10"
    }
  ],
  candidates: [
    {
      studentId: "STU3390",
      studentName: "S. Priya",
      program: "BTech CSE",
      driveId: "DRV-2041",
      company: "Infosys",
      status: "shortlisted",
      currentRound: "technical"
    },
    {
      studentId: "STU2288",
      studentName: "D. Karthik",
      program: "BTech CSE",
      driveId: "DRV-2043",
      company: "Amazon",
      status: "offered",
      currentRound: null
    },
    {
      studentId: "STU5521",
      studentName: "M. Gowda",
      program: "BTech ME",
      driveId: "DRV-2042",
      company: "Wipro",
      status: "applied",
      currentRound: "aptitude"
    }
  ]
};
