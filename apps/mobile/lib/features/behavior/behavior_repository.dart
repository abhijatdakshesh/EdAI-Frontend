import 'behavior_models.dart';

class BehaviorRepository {
  Future<BehaviorDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    final now = DateTime.now();
    return BehaviorDashboard(
      refreshedAt: now,
      openIncidents: 5,
      criticalIncidents: 1,
      repeatOffenders: 2,
      incidents: [
        BehaviorIncident(
          incidentId: 'INC-001',
          studentName: 'Arun Patel',
          studentId: 'USN001',
          className: 'CSE Year 3 Sec A',
          category: 'academic_dishonesty',
          severity: 'high',
          status: 'under_investigation',
          reportedBy: 'Prof. K. Sharma',
          reportedAt: now.subtract(const Duration(hours: 5)),
          description: 'Copied during mid-term examination paper CS401.',
          isRepeatOffender: true,
        ),
        BehaviorIncident(
          incidentId: 'INC-002',
          studentName: 'Priya Reddy',
          studentId: 'USN002',
          className: 'ME Year 2 Sec B',
          category: 'bullying',
          severity: 'critical',
          status: 'open',
          reportedBy: 'Student Welfare Cell',
          reportedAt: now.subtract(const Duration(hours: 2)),
          description: 'Repeated verbal harassment reported by classmate.',
          isRepeatOffender: true,
        ),
        BehaviorIncident(
          incidentId: 'INC-003',
          studentName: 'Kiran Nair',
          studentId: 'USN003',
          className: 'EC Year 1 Sec A',
          category: 'attendance_fraud',
          severity: 'medium',
          status: 'action_taken',
          reportedBy: 'Dr. A. Bhat',
          reportedAt: now.subtract(const Duration(hours: 24)),
          description: 'Proxy attendance marked by another student.',
          isRepeatOffender: false,
        ),
      ],
    );
  }
}
