import { apiClient } from "@/lib/api/client";

import { mockDashboard } from "./mock-data";
import type { DashboardResponse } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getDashboard(): Promise<DashboardResponse> {
  if (USE_MOCK) return mockDashboard;
  try {
    const result = await apiClient.get<DashboardResponse>("/api/analytics/admin/dashboard");
    if (!Array.isArray(result?.kpis)) return mockDashboard;
    return result;
  } catch {
    return mockDashboard;
  }
}
