import "notification_models.dart";

class NotificationsRepository {
  Future<NotificationsDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    return NotificationsDashboard(
      generatedAt: DateTime.now(),
      totalSent: 14872,
      pendingRetries: 12,
      campaigns: const [
        NotificationCampaign(
          campaignId: "CAMP-301",
          title: "Attendance alert — April 18",
          channel: "whatsapp",
          audience: "Parents of at-risk students",
          status: "sent",
          sentCount: 82,
          failedCount: 3,
        ),
        NotificationCampaign(
          campaignId: "CAMP-302",
          title: "Fee reminder — batch 2",
          channel: "push",
          audience: "Students with overdue invoices",
          status: "sent",
          sentCount: 164,
          failedCount: 9,
        ),
        NotificationCampaign(
          campaignId: "CAMP-303",
          title: "Semester results announcement",
          channel: "in_app",
          audience: "All students",
          status: "scheduled",
          sentCount: 0,
          failedCount: 0,
        ),
        NotificationCampaign(
          campaignId: "CAMP-304",
          title: "Placement drive — eligibility notice",
          channel: "push",
          audience: "Final-year eligible students",
          status: "failed",
          sentCount: 41,
          failedCount: 17,
        ),
      ],
    );
  }
}
