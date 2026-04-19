import type { ModuleRuntimeStatus } from "./types";

export const moduleRuntimeStatusMap: Record<string, ModuleRuntimeStatus> = {
  attendance: {
    moduleKey: "attendance",
    healthy: true,
    lastSyncAt: new Date().toISOString(),
    pendingActions: 2,
    note: "Biometric ingestion running normally"
  },
  voice: {
    moduleKey: "voice",
    healthy: true,
    lastSyncAt: new Date().toISOString(),
    pendingActions: 5,
    note: "Transcript verification queue pending"
  },
  marks: {
    moduleKey: "marks",
    healthy: true,
    lastSyncAt: new Date().toISOString(),
    pendingActions: 8,
    note: "Awaiting dual verification closures"
  },
  fees: {
    moduleKey: "fees",
    healthy: true,
    lastSyncAt: new Date().toISOString(),
    pendingActions: 3,
    note: "Payment gateway retries within threshold"
  },
  timeline: {
    moduleKey: "timeline",
    healthy: true,
    lastSyncAt: new Date().toISOString(),
    pendingActions: 0,
    note: "Event stream up to date"
  },
  notifications: {
    moduleKey: "notifications",
    healthy: true,
    lastSyncAt: new Date().toISOString(),
    pendingActions: 12,
    note: "Delivery report ingest delayed by 2 minutes"
  },
  placements: {
    moduleKey: "placements",
    healthy: true,
    lastSyncAt: new Date().toISOString(),
    pendingActions: 4,
    note: "Interview rounds awaiting updates"
  },
  mentorship: {
    moduleKey: "mentorship",
    healthy: true,
    lastSyncAt: new Date().toISOString(),
    pendingActions: 6,
    note: "Counselling follow-up reminders active"
  },
  grievance: {
    moduleKey: "grievance",
    healthy: true,
    lastSyncAt: new Date().toISOString(),
    pendingActions: 7,
    note: "SLA breach watchlist generated"
  },
  compliance: {
    moduleKey: "compliance",
    healthy: true,
    lastSyncAt: new Date().toISOString(),
    pendingActions: 9,
    note: "Evidence mapping review in progress"
  },
  dashboard: {
    moduleKey: "dashboard",
    healthy: true,
    lastSyncAt: new Date().toISOString(),
    pendingActions: 1,
    note: "KPI snapshots refreshed"
  },
  integrations: {
    moduleKey: "integrations",
    healthy: false,
    lastSyncAt: new Date().toISOString(),
    pendingActions: 11,
    note: "SAP bridge retry queue elevated"
  }
};
