import { apiClient } from "@/lib/api/client";

import { mockStudentsDashboard } from "./mock-data";
import type { StudentsDashboardResponse } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getStudentsDashboard(): Promise<StudentsDashboardResponse> {
  if (USE_MOCK) return mockStudentsDashboard;
  try {
    return await apiClient.get<StudentsDashboardResponse>("/students/risk-dashboard");
  } catch {
    return mockStudentsDashboard;
  }
}

export async function triggerStudentIntervention(studentId: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/students/interventions", { studentId });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
