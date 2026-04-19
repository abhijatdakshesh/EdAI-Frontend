class AssessmentItem {
  const AssessmentItem({
    required this.assessmentId,
    required this.courseCode,
    required this.title,
    required this.maxMarks,
    required this.pendingVerification,
  });

  final String assessmentId;
  final String courseCode;
  final String title;
  final int maxMarks;
  final int pendingVerification;
}

class MarksDashboard {
  const MarksDashboard({
    required this.updatedAt,
    required this.flaggedSubmissions,
    required this.assessments,
  });

  final DateTime updatedAt;
  final int flaggedSubmissions;
  final List<AssessmentItem> assessments;
}
