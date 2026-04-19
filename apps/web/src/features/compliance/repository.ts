import { apiClient } from "@/lib/api/client";

import { mockComplianceDashboard } from "./mock-data";
import type { ComplianceDashboardResponse, EvidenceStatus } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getComplianceDashboard(): Promise<ComplianceDashboardResponse> {
  if (USE_MOCK) return mockComplianceDashboard;
  try {
    return await apiClient.get<ComplianceDashboardResponse>("/compliance/dashboard");
  } catch {
    return mockComplianceDashboard;
  }
}

export async function updateEvidenceStatus(evidenceId: string, status: EvidenceStatus): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/compliance/evidence/status", { evidenceId, status });
  } catch {
    // no-op if endpoint not yet implemented
  }
}

export async function generateReport(framework: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/compliance/report/generate", { framework });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
