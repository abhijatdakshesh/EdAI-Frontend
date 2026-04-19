import { apiClient } from "@/lib/api/client";

import { mockNotificationsDashboard } from "./mock-data";
import type { NotificationsDashboardResponse } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getNotificationsDashboard(): Promise<NotificationsDashboardResponse> {
  if (USE_MOCK) return mockNotificationsDashboard;
  try {
    return await apiClient.get<NotificationsDashboardResponse>("/comms/notifications/dashboard");
  } catch {
    return mockNotificationsDashboard;
  }
}

export async function retryCampaign(campaignId: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/comms/notifications/retry", { campaignId });
  } catch {
    // no-op if endpoint not yet implemented
  }
}

export async function sendCampaign(campaignId: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/comms/notifications/send", { campaignId });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
