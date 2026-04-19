import type { IntegrationsDashboardResponse } from "./types";

const now = new Date();
const pastH = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
const futureH = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();

export const mockIntegrationsDashboard: IntegrationsDashboardResponse = {
  refreshedAt: now.toISOString(),
  connectors: [
    {
      connectorId: "SAP-SFTP",
      name: "SAP ERP (SFTP Bridge)",
      kind: "erp",
      vendor: "SAP",
      status: "connected",
      lastSyncAt: pastH(2),
      nextSyncAt: futureH(4),
      errorMessage: null,
      recentLogs: [
        {
          logId: "LOG-001",
          connectorId: "SAP-SFTP",
          startedAt: pastH(2.1),
          completedAt: pastH(2),
          recordsSync: 3214,
          errorCount: 0,
          success: true
        }
      ]
    },
    {
      connectorId: "EXOTEL-SIP",
      name: "Exotel Voice (SIP Bridge)",
      kind: "telephony",
      vendor: "Exotel",
      status: "connected",
      lastSyncAt: pastH(0.5),
      nextSyncAt: null,
      errorMessage: null,
      recentLogs: [
        {
          logId: "LOG-002",
          connectorId: "EXOTEL-SIP",
          startedAt: pastH(0.6),
          completedAt: pastH(0.5),
          recordsSync: 47,
          errorCount: 0,
          success: true
        }
      ]
    },
    {
      connectorId: "META-WA",
      name: "WhatsApp Business Cloud API",
      kind: "whatsapp",
      vendor: "Meta",
      status: "degraded",
      lastSyncAt: pastH(1),
      nextSyncAt: futureH(1),
      errorMessage: "API rate limit exceeded. Retry scheduled.",
      recentLogs: [
        {
          logId: "LOG-003",
          connectorId: "META-WA",
          startedAt: pastH(1.2),
          completedAt: pastH(1),
          recordsSync: 112,
          errorCount: 8,
          success: false
        }
      ]
    },
    {
      connectorId: "KARIX-SMS",
      name: "Karix SMS Gateway",
      kind: "sms",
      vendor: "Karix",
      status: "connected",
      lastSyncAt: pastH(0.25),
      nextSyncAt: null,
      errorMessage: null,
      recentLogs: [
        {
          logId: "LOG-004",
          connectorId: "KARIX-SMS",
          startedAt: pastH(0.3),
          completedAt: pastH(0.25),
          recordsSync: 256,
          errorCount: 0,
          success: true
        }
      ]
    },
    {
      connectorId: "KEYCLOAK-OIDC",
      name: "Keycloak Identity Provider",
      kind: "auth",
      vendor: "Keycloak",
      status: "connected",
      lastSyncAt: pastH(0.1),
      nextSyncAt: null,
      errorMessage: null,
      recentLogs: [
        {
          logId: "LOG-005",
          connectorId: "KEYCLOAK-OIDC",
          startedAt: pastH(0.15),
          completedAt: pastH(0.1),
          recordsSync: 1,
          errorCount: 0,
          success: true
        }
      ]
    },
    {
      connectorId: "AWS-S3",
      name: "Amazon S3 (ap-south-1)",
      kind: "storage",
      vendor: "AWS",
      status: "syncing",
      lastSyncAt: pastH(0.05),
      nextSyncAt: null,
      errorMessage: null,
      recentLogs: [
        {
          logId: "LOG-006",
          connectorId: "AWS-S3",
          startedAt: pastH(0.05),
          completedAt: null,
          recordsSync: 0,
          errorCount: 0,
          success: false
        }
      ]
    }
  ]
};
