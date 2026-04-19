import { apiClient } from "@/lib/api/client";

import { mockAssignmentsDashboard } from "./mock-data";
import type { AssignmentsDashboardResponse } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getAssignmentsDashboard(): Promise<AssignmentsDashboardResponse> {
  if (USE_MOCK) return mockAssignmentsDashboard;
  try {
    return await apiClient.get<AssignmentsDashboardResponse>("/assignments/dashboard");
  } catch {
    return mockAssignmentsDashboard;
  }
}

export async function sendMissedReminders(assignmentId: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/assignments/remind", { assignmentId });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
