class NotificationCampaign {
  const NotificationCampaign({
    required this.campaignId,
    required this.title,
    required this.channel,
    required this.audience,
    required this.status,
    required this.sentCount,
    required this.failedCount,
  });

  final String campaignId;
  final String title;
  final String channel;
  final String audience;
  final String status;
  final int sentCount;
  final int failedCount;

  NotificationCampaign copyWith({String? status}) {
    return NotificationCampaign(
      campaignId: campaignId,
      title: title,
      channel: channel,
      audience: audience,
      status: status ?? this.status,
      sentCount: sentCount,
      failedCount: failedCount,
    );
  }
}

class NotificationsDashboard {
  const NotificationsDashboard({
    required this.generatedAt,
    required this.totalSent,
    required this.pendingRetries,
    required this.campaigns,
  });

  final DateTime generatedAt;
  final int totalSent;
  final int pendingRetries;
  final List<NotificationCampaign> campaigns;
}
