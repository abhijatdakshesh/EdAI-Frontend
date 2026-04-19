class BehaviorIncident {
  final String incidentId;
  final String studentName;
  final String studentId;
  final String className;
  final String category;
  final String severity;
  final String status;
  final String reportedBy;
  final DateTime reportedAt;
  final String description;
  final bool isRepeatOffender;

  const BehaviorIncident({
    required this.incidentId,
    required this.studentName,
    required this.studentId,
    required this.className,
    required this.category,
    required this.severity,
    required this.status,
    required this.reportedBy,
    required this.reportedAt,
    required this.description,
    required this.isRepeatOffender,
  });

  BehaviorIncident copyWith({String? status}) => BehaviorIncident(
        incidentId: incidentId,
        studentName: studentName,
        studentId: studentId,
        className: className,
        category: category,
        severity: severity,
        status: status ?? this.status,
        reportedBy: reportedBy,
        reportedAt: reportedAt,
        description: description,
        isRepeatOffender: isRepeatOffender,
      );
}

class BehaviorDashboard {
  final DateTime refreshedAt;
  final int openIncidents;
  final int criticalIncidents;
  final int repeatOffenders;
  final List<BehaviorIncident> incidents;

  const BehaviorDashboard({
    required this.refreshedAt,
    required this.openIncidents,
    required this.criticalIncidents,
    required this.repeatOffenders,
    required this.incidents,
  });
}
