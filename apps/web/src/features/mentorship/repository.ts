import { apiClient } from "@/lib/api/client";

import { mockMentorshipDashboard } from "./mock-data";
import type { MentorshipDashboardResponse } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getMentorshipDashboard(): Promise<MentorshipDashboardResponse> {
  if (USE_MOCK) return mockMentorshipDashboard;
  try {
    return await apiClient.get<MentorshipDashboardResponse>("/mentorship/dashboard");
  } catch {
    return mockMentorshipDashboard;
  }
}

export async function logFollowUp(studentId: string, note: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/mentorship/followup", { studentId, note });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
