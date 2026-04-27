import { mockComplianceDashboard } from "./mock-data";
import type { ComplianceDashboardResponse, EvidenceStatus } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "false") === "true";

export async function getComplianceDashboard(academicYear = '2024-25'): Promise<ComplianceDashboardResponse> {
  if (USE_MOCK) return mockComplianceDashboard;
  try {
    const res = await fetch(`/api/compliance/dashboard?academicYear=${encodeURIComponent(academicYear)}`);
    if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
    return (await res.json()) as ComplianceDashboardResponse;
  } catch {
    return mockComplianceDashboard;
  }
}

export async function updateEvidenceStatus(evidenceId: string, status: EvidenceStatus): Promise<void> {
  if (USE_MOCK) return;
  try {
    await fetch('/api/compliance/evidence/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidenceId, status }),
    });
  } catch {
    // no-op if endpoint not yet implemented
  }
}

export async function generateReport(framework: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await fetch('/api/compliance/report/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ framework }),
    });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
