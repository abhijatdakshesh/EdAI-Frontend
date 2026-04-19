import "package:flutter/material.dart";

import "voice_models.dart";
import "voice_repository.dart";

class VoiceCallsScreen extends StatefulWidget {
  const VoiceCallsScreen({super.key});

  @override
  State<VoiceCallsScreen> createState() => _VoiceCallsScreenState();
}

class _VoiceCallsScreenState extends State<VoiceCallsScreen> {
  final VoiceRepository _repository = VoiceRepository();
  VoiceDashboard? _dashboard;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      setState(() {
        _loading = true;
        _error = null;
      });
      final data = await _repository.getDashboard();
      if (!mounted) return;
      setState(() => _dashboard = data);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = "Unable to load voice queue");
    } finally {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  void _escalate(String callId) {
    final current = _dashboard;
    if (current == null) return;
    setState(() {
      _dashboard = VoiceDashboard(
        refreshedAt: current.refreshedAt,
        transcripts: current.transcripts,
        queue: current.queue
            .map((item) => item.callId == callId
                ? VoiceQueueItem(
                    callId: item.callId,
                    guardianName: item.guardianName,
                    studentName: item.studentName,
                    language: item.language,
                    priority: item.priority,
                    status: "escalated",
                  )
                : item)
            .toList(),
      );
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
          Text("VOICE AGENT", style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 8),
          Text("Call Queue and Transcripts", style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 8),
          if (_loading) const LinearProgressIndicator(),
          if (_error != null) Text(_error!),
          const SizedBox(height: 12),
          if (data != null)
            ...data.queue.map(
              (item) => Card(
                child: ListTile(
                  title: Text("${item.guardianName} - ${item.studentName}"),
                  subtitle: Text("${item.language} • ${item.priority} • ${item.status}"),
                  trailing: TextButton(
                    onPressed: item.status == "escalated" ? null : () => _escalate(item.callId),
                    child: Text(item.status == "escalated" ? "Escalated" : "Escalate"),
                  ),
                ),
              ),
            ),
          const SizedBox(height: 12),
          Text("Transcript Insights", style: Theme.of(context).textTheme.titleMedium),
          if (data != null)
            ...data.transcripts.map(
              (t) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(t.callId),
                subtitle: Text("${t.sentiment}: ${t.summary}"),
                trailing: Text(t.requiresEscalation ? "Needs action" : "OK"),
              ),
            ),
        ],
      ),
    );
  }
}
