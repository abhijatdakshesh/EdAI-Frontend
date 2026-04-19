import "mentorship_models.dart";

class MentorshipRepository {
  Future<MentorshipDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    return MentorshipDashboard(
      fetchedAt: DateTime.now(),
      totalMentors: 48,
      overdueFollowUps: 11,
      mentees: const [
        MenteeRecord(
          studentId: "STU1044",
          studentName: "A. Nair",
          program: "BTech CSE",
          mentorName: "Dr. R. Venkat",
          riskLevel: "high",
          lastSessionDate: "2026-04-01",
          sessionCount: 4,
          lastOutcome: "needs_followup",
          followUpDue: true,
        ),
        MenteeRecord(
          studentId: "STU3390",
          studentName: "S. Priya",
          program: "BTech CSE",
          mentorName: "Dr. R. Venkat",
          riskLevel: "low",
          lastSessionDate: "2026-04-10",
          sessionCount: 7,
          lastOutcome: "productive",
          followUpDue: false,
        ),
        MenteeRecord(
          studentId: "STU5521",
          studentName: "M. Gowda",
          program: "BTech ME",
          mentorName: "Dr. S. Padma",
          riskLevel: "medium",
          lastSessionDate: "2026-03-28",
          sessionCount: 3,
          lastOutcome: "escalated",
          followUpDue: true,
        ),
      ],
    );
  }
}
