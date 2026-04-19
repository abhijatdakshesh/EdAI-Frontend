import 'assignments_models.dart';

class AssignmentsRepository {
  Future<AssignmentsDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    final now = DateTime.now();
    return AssignmentsDashboard(
      refreshedAt: now,
      openAssignments: 5,
      overdueCount: 2,
      assignments: [
        Assignment(
          assignmentId: 'ASG-001',
          courseCode: 'CS401',
          title: 'Neural Network Implementation',
          dueDate: now.add(const Duration(days: 3)),
          submittedCount: 34,
          lateCount: 2,
          missedCount: 0,
          totalStudents: 62,
          status: 'open',
        ),
        Assignment(
          assignmentId: 'ASG-002',
          courseCode: 'EC301',
          title: 'Analog Circuits Lab Report',
          dueDate: now.subtract(const Duration(hours: 12)),
          submittedCount: 48,
          lateCount: 7,
          missedCount: 5,
          totalStudents: 60,
          status: 'late',
        ),
        Assignment(
          assignmentId: 'ASG-003',
          courseCode: 'ME201',
          title: 'Thermodynamics Problem Set 4',
          dueDate: now.subtract(const Duration(days: 2)),
          submittedCount: 42,
          lateCount: 5,
          missedCount: 11,
          totalStudents: 58,
          status: 'missed',
        ),
      ],
    );
  }
}
