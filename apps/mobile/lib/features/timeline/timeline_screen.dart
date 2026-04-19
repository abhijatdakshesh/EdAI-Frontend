import "package:flutter/material.dart";

import "../../core/theme/raycraft_colors.dart";
import "timeline_models.dart";
import "timeline_repository.dart";

Color _priorityColor(String priority) {
  switch (priority) {
    case "critical":
      return RaycraftColors.danger;
    case "high":
      return RaycraftColors.warning;
    case "medium":
      return RaycraftColors.info;
    default:
      return RaycraftColors.border;
  }
}

class TimelineScreen extends StatefulWidget {
  const TimelineScreen({super.key});

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen> {
  final TimelineRepository _repository = TimelineRepository();
  TimelineDashboard? _dashboard;
  bool _loading = true;
  String _filter = "all";

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

  void _acknowledge(String eventId) {
    final current = _dashboard;
    if (current == null) return;
    setState(() {
      _dashboard = TimelineDashboard(
        fetchedAt: current.fetchedAt,
        events: current.events
            .map((e) => e.eventId == eventId ? e.copyWith(acknowledged: true) : e)
            .toList(),
      );
    });
  }

  void _togglePin(String eventId) {
    final current = _dashboard;
    if (current == null) return;
    setState(() {
      _dashboard = TimelineDashboard(
        fetchedAt: current.fetchedAt,
        events: current.events
            .map((e) => e.eventId == eventId ? e.copyWith(pinned: !e.pinned) : e)
            .toList(),
      );
    });
  }

  List<TimelineEvent> get _filteredEvents {
    final all = _dashboard?.events ?? [];
    switch (_filter) {
      case "pinned":
        return all.where((e) => e.pinned).toList();
      case "unacknowledged":
        return all.where((e) => !e.acknowledged).toList();
      default:
        return all;
    }
  }

  @override
  Widget build(BuildContext context) {
    final events = _filteredEvents;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text("TIMELINE", style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 8),
          Text("Unified Student Timeline", style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 8),
          Row(
            children: [
              for (final f in ["all", "pinned", "unacknowledged"])
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text(f),
                    selected: _filter == f,
                    onSelected: (_) => setState(() => _filter = f),
                  ),
                )
            ],
          ),
          const SizedBox(height: 12),
          if (_loading) const LinearProgressIndicator(),
          if (events.isEmpty && !_loading)
            const Card(
              child: ListTile(title: Text("No events match the current filter.")),
            ),
          for (final event in events)
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(6),
                side: BorderSide(
                  color: _priorityColor(event.priority),
                  width: 2,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          event.kind.toUpperCase(),
                          style: Theme.of(context).textTheme.labelSmall,
                        ),
                        const SizedBox(width: 8),
                        if (event.pinned)
                          const Icon(Icons.push_pin, size: 14, color: RaycraftColors.textMuted),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(event.title, style: Theme.of(context).textTheme.titleSmall),
                    Text(
                      "${event.studentName} — ${event.detail}",
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    Text(
                      event.occurredAt.toLocal().toString().substring(0, 16),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        TextButton(
                          onPressed: event.acknowledged ? null : () => _acknowledge(event.eventId),
                          child: Text(event.acknowledged ? "Acknowledged" : "Acknowledge"),
                        ),
                        TextButton(
                          onPressed: () => _togglePin(event.eventId),
                          child: Text(event.pinned ? "Unpin" : "Pin"),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
