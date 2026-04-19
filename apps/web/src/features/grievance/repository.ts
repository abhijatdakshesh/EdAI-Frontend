import { apiClient } from "@/lib/api/client";

import { mockGrievanceDashboard } from "./mock-data";
import type { GrievanceDashboardResponse, GrievanceStatus } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getGrievanceDashboard(): Promise<GrievanceDashboardResponse> {
  if (USE_MOCK) return mockGrievanceDashboard;
  try {
    return await apiClient.get<GrievanceDashboardResponse>("/grievance/dashboard");
  } catch {
    return mockGrievanceDashboard;
  }
}

export async function assignGrievance(caseId: string, officerName: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/grievance/assign", { caseId, officerName });
  } catch {
    // no-op if endpoint not yet implemented
  }
}

export async function updateGrievanceStatus(caseId: string, status: GrievanceStatus): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/grievance/status", { caseId, status });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
