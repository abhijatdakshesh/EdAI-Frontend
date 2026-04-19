class VoiceQueueItem {
  const VoiceQueueItem({
    required this.callId,
    required this.guardianName,
    required this.studentName,
    required this.language,
    required this.priority,
    required this.status,
  });

  final String callId;
  final String guardianName;
  final String studentName;
  final String language;
  final String priority;
  final String status;
}

class VoiceTranscript {
  const VoiceTranscript({
    required this.callId,
    required this.summary,
    required this.sentiment,
    required this.requiresEscalation,
  });

  final String callId;
  final String summary;
  final String sentiment;
  final bool requiresEscalation;
}

class VoiceDashboard {
  const VoiceDashboard({
    required this.refreshedAt,
    required this.queue,
    required this.transcripts,
  });

  final DateTime refreshedAt;
  final List<VoiceQueueItem> queue;
  final List<VoiceTranscript> transcripts;
}
