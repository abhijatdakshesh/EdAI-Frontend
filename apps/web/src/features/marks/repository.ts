import { apiClient } from "@/lib/api/client";

import { mockMarksDashboard } from "./mock-data";
import type { MarksDashboardResponse } from "./types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export async function getMarksDashboard(): Promise<MarksDashboardResponse> {
  if (USE_MOCK) return mockMarksDashboard;
  try {
    return await apiClient.get<MarksDashboardResponse>("/academics/marks/dashboard");
  } catch {
    return mockMarksDashboard;
  }
}

export async function verifyAssessment(assessmentId: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/academics/marks/verify", { assessmentId });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
