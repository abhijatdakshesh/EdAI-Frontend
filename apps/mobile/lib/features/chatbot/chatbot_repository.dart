import 'chatbot_models.dart';

class ChatbotRepository {
  Future<ChatbotDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    final now = DateTime.now();
    return ChatbotDashboard(
      refreshedAt: now,
      totalSessions: 312,
      resolvedToday: 48,
      escalatedToday: 4,
      activeSessions: [
        ChatbotSession(
          sessionId: 'CSESS-001',
          userType: 'student',
          userName: 'Ravi Kumar',
          language: 'kn',
          intent: 'Assignment deadline query',
          messageCount: 4,
          startedAt: now.subtract(const Duration(minutes: 8)),
          lastMessageAt: now.subtract(const Duration(minutes: 2)),
          status: 'active',
        ),
        ChatbotSession(
          sessionId: 'CSESS-002',
          userType: 'parent',
          userName: 'Meena Krishnamurthy',
          language: 'kn',
          intent: 'Fee payment query',
          messageCount: 7,
          startedAt: now.subtract(const Duration(minutes: 15)),
          lastMessageAt: now.subtract(const Duration(minutes: 1)),
          status: 'active',
        ),
      ],
      recentEscalations: [
        ChatbotSession(
          sessionId: 'CSESS-003',
          userType: 'parent',
          userName: 'Suresh Nayak',
          language: 'hi',
          intent: 'Complaint about teacher',
          messageCount: 12,
          startedAt: now.subtract(const Duration(hours: 2)),
          lastMessageAt: now.subtract(const Duration(minutes: 45)),
          status: 'escalated',
        ),
      ],
    );
  }
}
