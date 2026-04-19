class Assignment {
  final String assignmentId;
  final String courseCode;
  final String title;
  final DateTime dueDate;
  final int submittedCount;
  final int lateCount;
  final int missedCount;
  final int totalStudents;
  final String status;

  const Assignment({
    required this.assignmentId,
    required this.courseCode,
    required this.title,
    required this.dueDate,
    required this.submittedCount,
    required this.lateCount,
    required this.missedCount,
    required this.totalStudents,
    required this.status,
  });
}

class AssignmentsDashboard {
  final DateTime refreshedAt;
  final int openAssignments;
  final int overdueCount;
  final List<Assignment> assignments;

  const AssignmentsDashboard({
    required this.refreshedAt,
    required this.openAssignments,
    required this.overdueCount,
    required this.assignments,
  });
}
