class GrievanceCase {
  const GrievanceCase({
    required this.caseId,
    required this.studentName,
    required this.category,
    required this.priority,
    required this.status,
    required this.summary,
    required this.assignedOfficer,
    required this.slaBreach,
  });

  final String caseId;
  final String studentName;
  final String category;
  final String priority;
  final String status;
  final String summary;
  final String? assignedOfficer;
  final bool slaBreach;

  GrievanceCase copyWith({String? status}) {
    return GrievanceCase(
      caseId: caseId,
      studentName: studentName,
      category: category,
      priority: priority,
      status: status ?? this.status,
      summary: summary,
      assignedOfficer: assignedOfficer,
      slaBreach: slaBreach,
    );
  }
}

class GrievanceDashboard {
  const GrievanceDashboard({
    required this.fetchedAt,
    required this.openCount,
    required this.slaBreachCount,
    required this.cases,
  });

  final DateTime fetchedAt;
  final int openCount;
  final int slaBreachCount;
  final List<GrievanceCase> cases;
}
