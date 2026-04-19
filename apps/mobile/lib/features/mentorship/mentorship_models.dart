class MenteeRecord {
  const MenteeRecord({
    required this.studentId,
    required this.studentName,
    required this.program,
    required this.mentorName,
    required this.riskLevel,
    required this.lastSessionDate,
    required this.sessionCount,
    required this.lastOutcome,
    required this.followUpDue,
  });

  final String studentId;
  final String studentName;
  final String program;
  final String mentorName;
  final String riskLevel;
  final String lastSessionDate;
  final int sessionCount;
  final String lastOutcome;
  final bool followUpDue;

  MenteeRecord copyWith({bool? followUpDue}) {
    return MenteeRecord(
      studentId: studentId,
      studentName: studentName,
      program: program,
      mentorName: mentorName,
      riskLevel: riskLevel,
      lastSessionDate: lastSessionDate,
      sessionCount: sessionCount,
      lastOutcome: lastOutcome,
      followUpDue: followUpDue ?? this.followUpDue,
    );
  }
}

class MentorshipDashboard {
  const MentorshipDashboard({
    required this.fetchedAt,
    required this.totalMentors,
    required this.overdueFollowUps,
    required this.mentees,
  });

  final DateTime fetchedAt;
  final int totalMentors;
  final int overdueFollowUps;
  final List<MenteeRecord> mentees;
}
