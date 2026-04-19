import type { AssignmentsDashboardResponse } from "./types";

export const mockAssignmentsDashboard: AssignmentsDashboardResponse = {
  refreshedAt: new Date().toISOString(),
  openAssignments: 5,
  overdueCount: 2,
  assignments: [
    {
      assignmentId: "ASG-001",
      courseCode: "CS401",
      title: "Neural Network Implementation",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      submittedCount: 34,
      lateCount: 2,
      missedCount: 0,
      totalStudents: 62,
      status: "open"
    },
    {
      assignmentId: "ASG-002",
      courseCode: "EC301",
      title: "Analog Circuits Lab Report",
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      submittedCount: 48,
      lateCount: 7,
      missedCount: 5,
      totalStudents: 60,
      status: "late"
    },
    {
      assignmentId: "ASG-003",
      courseCode: "CS301",
      title: "Data Structures Assignment 2",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      submittedCount: 18,
      lateCount: 0,
      missedCount: 0,
      totalStudents: 67,
      status: "open"
    },
    {
      assignmentId: "ASG-004",
      courseCode: "ME201",
      title: "Thermodynamics Problem Set 4",
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      submittedCount: 42,
      lateCount: 5,
      missedCount: 11,
      totalStudents: 58,
      status: "missed"
    }
  ]
};
