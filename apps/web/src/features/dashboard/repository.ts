import { apiClient } from "@/lib/api/client";

import { mockDashboard } from "./mock-data";
import type { DashboardResponse } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getDashboard(): Promise<DashboardResponse> {
  if (USE_MOCK) return mockDashboard;
  try {
    return await apiClient.get<DashboardResponse>("/analytics/dashboard");
  } catch {
    return mockDashboard;
  }
}
