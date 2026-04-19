import type { NotificationsDashboardResponse } from "./types";

export const mockNotificationsDashboard: NotificationsDashboardResponse = {
  generatedAt: new Date().toISOString(),
  totalSent: 14872,
  pendingRetries: 12,
  campaigns: [
    {
      campaignId: "CAMP-301",
      title: "Attendance alert — April 18",
      channel: "whatsapp",
      audience: "Parents of at-risk students",
      status: "sent",
      sentCount: 82,
      failedCount: 3,
      scheduledAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    },
    {
      campaignId: "CAMP-302",
      title: "Fee reminder — batch 2",
      channel: "push",
      audience: "Students with overdue invoices",
      status: "sent",
      sentCount: 164,
      failedCount: 9,
      scheduledAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    {
      campaignId: "CAMP-303",
      title: "Semester results announcement",
      channel: "in_app",
      audience: "All students",
      status: "scheduled",
      sentCount: 0,
      failedCount: 0,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
    },
    {
      campaignId: "CAMP-304",
      title: "Placement drive — eligibility notice",
      channel: "push",
      audience: "Final-year eligible students",
      status: "failed",
      sentCount: 41,
      failedCount: 17,
      scheduledAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
    }
  ]
};
