class TimelineEvent {
  const TimelineEvent({
    required this.eventId,
    required this.studentName,
    required this.kind,
    required this.priority,
    required this.title,
    required this.detail,
    required this.occurredAt,
    required this.pinned,
    required this.acknowledged,
  });

  final String eventId;
  final String studentName;
  final String kind;
  final String priority;
  final String title;
  final String detail;
  final DateTime occurredAt;
  final bool pinned;
  final bool acknowledged;

  TimelineEvent copyWith({bool? pinned, bool? acknowledged}) {
    return TimelineEvent(
      eventId: eventId,
      studentName: studentName,
      kind: kind,
      priority: priority,
      title: title,
      detail: detail,
      occurredAt: occurredAt,
      pinned: pinned ?? this.pinned,
      acknowledged: acknowledged ?? this.acknowledged,
    );
  }
}

class TimelineDashboard {
  const TimelineDashboard({
    required this.fetchedAt,
    required this.events,
  });

  final DateTime fetchedAt;
  final List<TimelineEvent> events;
}
