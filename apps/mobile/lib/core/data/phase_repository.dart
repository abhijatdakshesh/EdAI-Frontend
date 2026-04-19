class PhaseRepository {
  static const Map<String, List<String>> checklistByModule = {
    "attendance": ["Daily view", "Absent alerts", "Leave request flow"],
    "timeline": ["Unified feed", "Event priority", "Parent visibility"],
    "fees": ["Dues card", "Payment state", "Aid tags"],
    "notifications": ["Inbox list", "Read/unread", "Priority badge"],
    "voice_calls": ["Call logs", "Transcripts", "Escalation notes"],
    "grievance": ["Issue intake", "Case status", "Closure confirmation"],
    "profile": ["Consent center", "Language preference", "Notification toggles"],
    "mentorship": ["Mentor allocation", "Session notes", "Follow-up reminders"],
    "integrations": ["Sync status", "Failure queue", "Retry action"]
  };
}
