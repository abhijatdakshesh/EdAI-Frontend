import "voice_models.dart";

class VoiceRepository {
  Future<VoiceDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    return VoiceDashboard(
      refreshedAt: DateTime.now(),
      queue: const [
        VoiceQueueItem(
          callId: "CALL-1031",
          guardianName: "Lakshmi Rao",
          studentName: "R. Nikhil",
          language: "Kannada",
          priority: "high",
          status: "queued",
        ),
        VoiceQueueItem(
          callId: "CALL-1032",
          guardianName: "Meera Iyer",
          studentName: "A. Tejas",
          language: "English",
          priority: "medium",
          status: "in_progress",
        ),
      ],
      transcripts: const [
        VoiceTranscript(
          callId: "CALL-1003",
          summary: "Attendance counselling requested.",
          sentiment: "neutral",
          requiresEscalation: true,
        ),
        VoiceTranscript(
          callId: "CALL-1004",
          summary: "Fee due clarification completed.",
          sentiment: "positive",
          requiresEscalation: false,
        ),
      ],
    );
  }
}
