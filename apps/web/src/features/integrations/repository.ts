import { apiClient } from "@/lib/api/client";

import { mockIntegrationsDashboard } from "./mock-data";
import type { IntegrationsDashboardResponse } from "./types";

const USE_MOCK = true; // integrations backend not yet implemented

export async function getIntegrationsDashboard(): Promise<IntegrationsDashboardResponse> {
  if (USE_MOCK) return mockIntegrationsDashboard;
  try {
    return await apiClient.get<IntegrationsDashboardResponse>("/api/integrations/dashboard");
  } catch {
    return mockIntegrationsDashboard;
  }
}

export async function retryConnector(connectorId: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/integrations/connectors/retry", { connectorId });
  } catch {
    // no-op if endpoint not yet implemented
  }
}

export async function triggerSync(connectorId: string): Promise<void> {
  if (USE_MOCK) return;
  try {
    await apiClient.post("/integrations/connectors/sync", { connectorId });
  } catch {
    // no-op if endpoint not yet implemented
  }
}
