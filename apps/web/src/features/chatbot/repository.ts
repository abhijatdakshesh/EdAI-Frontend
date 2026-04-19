import { apiClient } from "@/lib/api/client";

import { mockChatbotDashboard } from "./mock-data";
import type { ChatbotDashboardResponse } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getChatbotDashboard(): Promise<ChatbotDashboardResponse> {
  if (USE_MOCK) return mockChatbotDashboard;
  try {
    return await apiClient.get<ChatbotDashboardResponse>("/api/chatbot/dashboard");
  } catch {
    return mockChatbotDashboard;
  }
}

export async function resolveSession(sessionId: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/api/chatbot/sessions/resolve", { sessionId });
  } catch {
    // no-op if backend endpoint not yet implemented
  }
}
