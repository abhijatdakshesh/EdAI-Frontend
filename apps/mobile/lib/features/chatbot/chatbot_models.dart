class ChatbotSession {
  final String sessionId;
  final String userType;
  final String userName;
  final String language;
  final String intent;
  final int messageCount;
  final DateTime startedAt;
  final DateTime lastMessageAt;
  final String status;

  const ChatbotSession({
    required this.sessionId,
    required this.userType,
    required this.userName,
    required this.language,
    required this.intent,
    required this.messageCount,
    required this.startedAt,
    required this.lastMessageAt,
    required this.status,
  });

  ChatbotSession copyWith({String? status}) => ChatbotSession(
        sessionId: sessionId,
        userType: userType,
        userName: userName,
        language: language,
        intent: intent,
        messageCount: messageCount,
        startedAt: startedAt,
        lastMessageAt: lastMessageAt,
        status: status ?? this.status,
      );
}

class ChatbotDashboard {
  final DateTime refreshedAt;
  final int totalSessions;
  final int resolvedToday;
  final int escalatedToday;
  final List<ChatbotSession> activeSessions;
  final List<ChatbotSession> recentEscalations;

  const ChatbotDashboard({
    required this.refreshedAt,
    required this.totalSessions,
    required this.resolvedToday,
    required this.escalatedToday,
    required this.activeSessions,
    required this.recentEscalations,
  });
}
