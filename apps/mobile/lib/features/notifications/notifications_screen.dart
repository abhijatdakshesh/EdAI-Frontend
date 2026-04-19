import "package:flutter/material.dart";

import "../../core/theme/raycraft_colors.dart";
import "notification_models.dart";
import "notifications_repository.dart";

Color _statusColor(String status) {
  switch (status) {
    case "sent":
      return RaycraftColors.success;
    case "failed":
      return RaycraftColors.danger;
    case "scheduled":
      return RaycraftColors.info;
    default:
      return RaycraftColors.textMuted;
  }
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationsRepository _repository = NotificationsRepository();
  NotificationsDashboard? _dashboard;
  bool _loading = true;
  final Set<String> _busyIds = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await _repository.getDashboard();
    if (!mounted) return;
    setState(() {
      _dashboard = data;
      _loading = false;
    });
  }

  void _retryOrSend(String campaignId) {
    final current = _dashboard;
    if (current == null) return;
    setState(() => _busyIds.add(campaignId));
    Future<void>.delayed(const Duration(milliseconds: 400)).then((_) {
      if (!mounted) return;
      setState(() {
        _busyIds.remove(campaignId);
        _dashboard = NotificationsDashboard(
          generatedAt: current.generatedAt,
          totalSent: current.totalSent,
          pendingRetries: current.pendingRetries,
          campaigns: current.campaigns
              .map((c) => c.campaignId == campaignId ? c.copyWith(status: "sent") : c)
              .toList(),
        );
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final data = _dashboard;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text("NOTIFICATIONS", style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 8),
          Text("Communication Centre", style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 4),
          if (data != null)
            Text(
              "Total sent ${data.totalSent} • Pending retries ${data.pendingRetries}",
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          const SizedBox(height: 12),
          if (_loading) const LinearProgressIndicator(),
          if (data != null)
            for (final campaign in data.campaigns)
              Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: _statusColor(campaign.status).withOpacity(0.15),
                    child: Icon(
                      campaign.channel == "whatsapp"
                          ? Icons.chat
                          : campaign.channel == "push"
                              ? Icons.notifications
                              : Icons.inbox,
                      size: 18,
                      color: _statusColor(campaign.status),
                    ),
                  ),
                  title: Text(campaign.title),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(campaign.audience),
                      Text(
                        "Sent ${campaign.sentCount} • Failed ${campaign.failedCount}",
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                  trailing: (campaign.status == "failed" || campaign.status == "scheduled")
                      ? TextButton(
                          onPressed: _busyIds.contains(campaign.campaignId)
                              ? null
                              : () => _retryOrSend(campaign.campaignId),
                          child: Text(campaign.status == "failed" ? "Retry" : "Send"),
                        )
                      : Text(
                          campaign.status,
                          style: TextStyle(
                            color: _statusColor(campaign.status),
                            fontWeight: FontWeight.w500,
                            fontSize: 12,
                          ),
                        ),
                ),
              ),
        ],
      ),
    );
  }
}
