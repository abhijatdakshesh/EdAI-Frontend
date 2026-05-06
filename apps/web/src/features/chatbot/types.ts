export type ChatUserRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';
export type ChatChannel = 'WEB' | 'WHATSAPP';
export type ChatbotSessionStatus = "active" | "resolved" | "escalated" | "idle";
export type ChatbotUserType = "student" | "parent" | "teacher";
export type ChatbotLanguage = "en" | "kn" | "hi" | "ta" | "te" | "ml";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatState {
  conversationId: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  isOpen: boolean;
  isConnected: boolean;
  hasConsented: boolean;
  wsError: boolean;
}

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

export const STUDENT_SUGGESTIONS = [
  'What classes do I have today?',
  'Am I at risk of detention?',
  'What is my attendance in DBMS?',
  'Is my fee paid?',
  'When is my next internal exam?',
];

export const PARENT_SUGGESTIONS = [
  'How is my child doing this semester?',
  'Was my child present today?',
  'Is there any fee pending?',
  'Is my child at risk of failing?',
  'I want to meet the class teacher',
];

export const TEACHER_SUGGESTIONS = [
  'What is my schedule today?',
  'Which students are at high risk?',
  'Show attendance for my class',
  'How many classes have I completed?',
  'Who has the lowest marks in my subject?',
];
