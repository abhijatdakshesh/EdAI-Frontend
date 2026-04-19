import { apiClient } from "@/lib/api/client";

import { mockAttendanceDashboard } from "./mock-data";
import type { AttendanceDashboardResponse } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getAttendanceDashboard(): Promise<AttendanceDashboardResponse> {
  if (USE_MOCK) return mockAttendanceDashboard;
  try {
    return await apiClient.get<AttendanceDashboardResponse>("/attendance/dashboard");
  } catch {
    return mockAttendanceDashboard;
  }
}
