import { apiClient } from "@/lib/api/client";

import { mockPlacementsDashboard } from "./mock-data";
import type { CandidateStatus, PlacementsDashboardResponse } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getPlacementsDashboard(): Promise<PlacementsDashboardResponse> {
  if (USE_MOCK) return mockPlacementsDashboard;
  try {
    return await apiClient.get<PlacementsDashboardResponse>("/placements/dashboard");
  } catch {
    return mockPlacementsDashboard;
  }
}

export async function updateCandidateStatus(
  studentId: string,
  driveId: string,
  status: CandidateStatus
): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/placements/candidate/status", { studentId, driveId, status });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
