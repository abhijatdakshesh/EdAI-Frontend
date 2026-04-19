import "timeline_models.dart";

class TimelineRepository {
  Future<TimelineDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return TimelineDashboard(
      fetchedAt: DateTime.now(),
      events: [
        TimelineEvent(
          eventId: "EVT-9001",
          studentName: "A. Nair",
          kind: "attendance",
          priority: "critical",
          title: "4-day absence streak",
          detail: "Guardian notified via voice agent.",
          occurredAt: DateTime.now().subtract(const Duration(minutes: 30)),
          pinned: true,
          acknowledged: false,
        ),
        TimelineEvent(
          eventId: "EVT-9002",
          studentName: "M. Gowda",
          kind: "marks",
          priority: "medium",
          title: "Assessment submission delayed",
          detail: "MAT1103 pending verification for 3 days.",
          occurredAt: DateTime.now().subtract(const Duration(hours: 2)),
          pinned: false,
          acknowledged: false,
        ),
        TimelineEvent(
          eventId: "EVT-9003",
          studentName: "D. Karthik",
          kind: "fees",
          priority: "high",
          title: "Fee overdue — 3rd reminder",
          detail: "INV-8821 due 2026-04-25.",
          occurredAt: DateTime.now().subtract(const Duration(hours: 4)),
          pinned: false,
          acknowledged: true,
        ),
      ],
    );
  }
}
