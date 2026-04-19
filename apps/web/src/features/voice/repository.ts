import { apiClient } from "@/lib/api/client";

import { mockVoiceDashboard } from "./mock-data";
import type { VoiceDashboardResponse } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getVoiceDashboard(): Promise<VoiceDashboardResponse> {
  if (USE_MOCK) return mockVoiceDashboard;
  try {
    return await apiClient.get<VoiceDashboardResponse>("/voice/dashboard");
  } catch {
    return mockVoiceDashboard;
  }
}

export async function escalateVoiceCall(callId: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/voice/escalate", { callId });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
