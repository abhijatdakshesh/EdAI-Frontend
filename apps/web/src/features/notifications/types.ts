export type NotificationChannel = "push" | "whatsapp" | "in_app";
export type NotificationStatus = "draft" | "scheduled" | "sent" | "failed";

export interface NotificationCampaign {
  campaignId: string;
  title: string;
  channel: NotificationChannel;
  audience: string;
  status: NotificationStatus;
  sentCount: number;
  failedCount: number;
  scheduledAt: string;
}

export interface NotificationsDashboardResponse {
  generatedAt: string;
  totalSent: number;
  pendingRetries: number;
  campaigns: NotificationCampaign[];
}
