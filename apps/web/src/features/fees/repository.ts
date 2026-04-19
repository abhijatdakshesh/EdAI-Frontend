import { apiClient } from "@/lib/api/client";

import { mockFeesDashboard } from "./mock-data";
import type { FeesDashboardResponse } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getFeesDashboard(): Promise<FeesDashboardResponse> {
  if (USE_MOCK) return mockFeesDashboard;
  try {
    return await apiClient.get<FeesDashboardResponse>("/fees/dashboard");
  } catch {
    return mockFeesDashboard;
  }
}

export async function collectPayment(invoiceId: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/fees/collect", { invoiceId });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
