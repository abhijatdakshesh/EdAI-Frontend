export type ChatbotSessionStatus = "active" | "resolved" | "escalated" | "idle";
export type ChatbotUserType = "student" | "parent";
export type ChatbotLanguage = "en" | "kn" | "hi" | "ta" | "te" | "ml";

export interface ChatbotSession {
  sessionId: string;
  userType: ChatbotUserType;
  userName: string;
  language: ChatbotLanguage;
  intent: string;
  messageCount: number;
  startedAt: string;
  lastMessageAt: string;
  status: ChatbotSessionStatus;
  resolvedAt?: string;
}

export interface ChatbotStats {
  totalSessions: number;
  resolvedToday: number;
  escalatedToday: number;
  avgTurns: number;
  topIntent: string;
}

export interface ChatbotDashboardResponse {
  refreshedAt: string;
  stats: ChatbotStats;
  activeSessions: ChatbotSession[];
  recentEscalations: ChatbotSession[];
}
