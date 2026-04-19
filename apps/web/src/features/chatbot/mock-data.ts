import type { ChatbotDashboardResponse } from "./types";

export const mockChatbotDashboard: ChatbotDashboardResponse = {
  refreshedAt: new Date().toISOString(),
  stats: {
    totalSessions: 312,
    resolvedToday: 48,
    escalatedToday: 4,
    avgTurns: 5.4,
    topIntent: "Attendance query"
  },
  activeSessions: [
    {
      sessionId: "CSESS-001",
      userType: "student",
      userName: "Ravi Kumar",
      language: "kn",
      intent: "Assignment deadline query",
      messageCount: 4,
      startedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      status: "active"
    },
    {
      sessionId: "CSESS-002",
      userType: "parent",
      userName: "Meena Krishnamurthy",
      language: "kn",
      intent: "Fee payment query",
      messageCount: 7,
      startedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
      status: "active"
    }
  ],
  recentEscalations: [
    {
      sessionId: "CSESS-003",
      userType: "parent",
      userName: "Suresh Nayak",
      language: "hi",
      intent: "Complaint about teacher",
      messageCount: 12,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      status: "escalated"
    },
    {
      sessionId: "CSESS-004",
      userType: "student",
      userName: "Divya Shetty",
      language: "en",
      intent: "Hall ticket not received",
      messageCount: 8,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      status: "escalated"
    }
  ]
};
