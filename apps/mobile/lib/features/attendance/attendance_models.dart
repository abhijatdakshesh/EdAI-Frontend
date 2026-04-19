class AttendanceCampusSnapshot {
  const AttendanceCampusSnapshot({
    required this.campusName,
    required this.totalStudents,
    required this.presentCount,
    required this.absenteeCount,
    required this.atRiskCount,
  });

  final String campusName;
  final int totalStudents;
  final int presentCount;
  final int absenteeCount;
  final int atRiskCount;
}

class AttendanceAlert {
  const AttendanceAlert({
    required this.studentName,
    required this.campusName,
    required this.streakAbsentDays,
    required this.guardianNotified,
  });

  final String studentName;
  final String campusName;
  final int streakAbsentDays;
  final bool guardianNotified;
}

class AttendanceDashboard {
  const AttendanceDashboard({
    required this.syncedAt,
    required this.campuses,
    required this.alerts,
  });

  final DateTime syncedAt;
  final List<AttendanceCampusSnapshot> campuses;
  final List<AttendanceAlert> alerts;
}
