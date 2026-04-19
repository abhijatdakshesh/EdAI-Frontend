import "attendance_models.dart";

class AttendanceRepository {
  Future<AttendanceDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return AttendanceDashboard(
      syncedAt: DateTime.now(),
      campuses: const [
        AttendanceCampusSnapshot(
          campusName: "RVCE Main Campus",
          totalStudents: 4210,
          presentCount: 3912,
          absenteeCount: 298,
          atRiskCount: 41,
        ),
        AttendanceCampusSnapshot(
          campusName: "RVPU Bangalore",
          totalStudents: 2380,
          presentCount: 2215,
          absenteeCount: 165,
          atRiskCount: 19,
        ),
      ],
      alerts: const [
        AttendanceAlert(
          studentName: "A. Nair",
          campusName: "RVCE Main Campus",
          streakAbsentDays: 4,
          guardianNotified: true,
        ),
        AttendanceAlert(
          studentName: "M. Gowda",
          campusName: "RVPU Bangalore",
          streakAbsentDays: 3,
          guardianNotified: false,
        ),
      ],
    );
  }
}
