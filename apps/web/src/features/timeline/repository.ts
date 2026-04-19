import { apiClient } from "@/lib/api/client";

import { mockTimelineDashboard } from "./mock-data";
import type { TimelineDashboardResponse } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getTimelineDashboard(): Promise<TimelineDashboardResponse> {
  if (USE_MOCK) return mockTimelineDashboard;
  try {
    return await apiClient.get<TimelineDashboardResponse>("/timeline/dashboard");
  } catch {
    return mockTimelineDashboard;
  }
}

export async function acknowledgeEvent(eventId: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/timeline/acknowledge", { eventId });
  } catch {
    // no-op if endpoint not yet implemented
  }
}

export async function pinEvent(eventId: string, pinned: boolean): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/timeline/pin", { eventId, pinned });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
