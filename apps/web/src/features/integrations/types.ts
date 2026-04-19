export type ConnectorStatus = "connected" | "degraded" | "disconnected" | "syncing";
export type ConnectorKind = "erp" | "sms" | "whatsapp" | "telephony" | "auth" | "storage";

export interface SyncLogEntry {
  logId: string;
  connectorId: string;
  startedAt: string;
  completedAt: string | null;
  recordsSync: number;
  errorCount: number;
  success: boolean;
}

export interface Connector {
  connectorId: string;
  name: string;
  kind: ConnectorKind;
  vendor: string;
  status: ConnectorStatus;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  errorMessage: string | null;
  recentLogs: SyncLogEntry[];
}

export interface IntegrationsDashboardResponse {
  refreshedAt: string;
  connectors: Connector[];
}
