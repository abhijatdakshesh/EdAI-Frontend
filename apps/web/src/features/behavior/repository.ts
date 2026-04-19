import { apiClient } from "@/lib/api/client";

import { mockBehaviorDashboard } from "./mock-data";
import type { BehaviorDashboardResponse, IncidentStatus } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getBehaviorDashboard(): Promise<BehaviorDashboardResponse> {
  if (USE_MOCK) return mockBehaviorDashboard;
  try {
    return await apiClient.get<BehaviorDashboardResponse>("/behavior/dashboard");
  } catch {
    return mockBehaviorDashboard;
  }
}

export async function updateIncidentStatus(incidentId: string, status: IncidentStatus): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/behavior/incidents/status", { incidentId, status });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
