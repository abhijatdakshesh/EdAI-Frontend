import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../auth/auth_provider.dart";
import "../auth/session_store.dart";
import "../../features/auth/auth_screen.dart";
import "../../shared/widgets/role_shell.dart";

// ── Student screens ───────────────────────────────────────────────────────────
import "../../features/attendance/attendance_screen.dart";
import "../../features/assignments/assignments_screen.dart";
import "../../features/marks/marks_screen.dart";
import "../../features/fees/fees_screen.dart";
import "../../features/chatbot/chatbot_screen.dart";
import "../../features/notifications/notifications_screen.dart";
import "../../features/placements/placements_screen.dart";
import "../../features/profile/profile_screen.dart";
import "../../features/student/courses_screen.dart";
import "../../features/student/schedule_screen.dart";
import "../../features/student/results_screen.dart";
import "../../features/student/hostel_screen.dart";
import "../../features/student/study_plan_screen.dart";
import "../../features/student/exam_prep_screen.dart";
import "../../features/student/counselor_screen.dart";
import "../../features/student/vtu_screen.dart";
import "../../features/student/dashboard_screen.dart" as stu;
import "../../features/student/hr_staff_screen.dart";
import "../../features/learn/learn_screen.dart";

// ── Teacher screens ───────────────────────────────────────────────────────────
import "../../features/teacher/teacher_dashboard_screen.dart";
import "../../features/teacher/mark_attendance_screen.dart";
import "../../features/teacher/teacher_assignments_screen.dart";
import "../../features/teacher/ia_marks_entry_screen.dart";
import "../../features/teacher/teacher_vtu_screen.dart";
import "../../features/teacher/call_panel_screen.dart";
import "../../features/teacher/teacher_classes_screen.dart";
import "../../features/teacher/attend_summary_screen.dart";
import "../../features/teacher/upload_results_screen.dart";

// ── Admin screens ─────────────────────────────────────────────────────────────
import "../../features/admin/admin_dashboard_screen.dart";
import "../../features/admin/user_management_screen.dart";
import "../../features/admin/class_management_screen.dart";
import "../../features/admin/course_management_screen.dart";
import "../../features/admin/ia_submission_screen.dart";
import "../../features/admin/vtu_admin_screen.dart";
import "../../features/admin/bulk_import_screen.dart";
import "../../features/admin/admin_reports_screen.dart";

// ── Parent screens ────────────────────────────────────────────────────────────
import "../../features/parent/parent_dashboard_screen.dart";
import "../../features/parent/children_screen.dart";
import "../../features/parent/parent_attendance_screen.dart";
import "../../features/parent/parent_results_screen.dart";
import "../../features/parent/parent_fees_screen.dart";
import "../../features/parent/parent_vtu_screen.dart";
import "../../features/parent/call_history_screen.dart";
import "../../features/parent/parent_messages_screen.dart";

// ── Route constants ───────────────────────────────────────────────────────────

abstract class AppRoutes {
  static const auth = "/auth";

  // Student
  static const studentDashboard = "/student/dashboard";
  static const studentAttendance = "/student/attendance";
  static const studentAssignments = "/student/assignments";
  static const studentCourses = "/student/courses";
  static const studentSchedule = "/student/schedule";
  static const studentResults = "/student/results";
  static const studentFees = "/student/fees";
  static const studentHostel = "/student/hostel";
  static const studentJobs = "/student/jobs";
  static const studentChatbot = "/student/chatbot";
  static const studentStudyPlan = "/student/study-plan";
  static const studentExamPrep = "/student/exam-prep";
  static const studentCounselor = "/student/counselor";
  static const studentVtu = "/student/vtu";
  static const studentProfile = "/student/profile";
  static const studentHr = "/student/hr";
  static const studentLearn = "/student/learn";

  // Teacher
  static const teacherDashboard = "/teacher/dashboard";
  static const teacherMarkAttendance = "/teacher/attendance";
  static const teacherAssignments = "/teacher/assignments";
  static const teacherIaMarks = "/teacher/ia-marks";
  static const teacherVtu = "/teacher/vtu";
  static const teacherCallPanel = "/teacher/calls";
  static const teacherClasses = "/teacher/classes";
  static const teacherAttendSummary = "/teacher/attend-summary";
  static const teacherUploadResults = "/teacher/upload-results";
  static const teacherProfile = "/teacher/profile";

  // Admin
  static const adminDashboard = "/admin/dashboard";
  static const adminUsers = "/admin/users";
  static const adminClasses = "/admin/classes";
  static const adminCourses = "/admin/courses";
  static const adminIaSubmission = "/admin/ia-submission";
  static const adminVtu = "/admin/vtu";
  static const adminBulkImport = "/admin/bulk-import";
  static const adminReports = "/admin/reports";
  static const adminProfile = "/admin/profile";

  // Parent
  static const parentDashboard = "/parent/dashboard";
  static const parentChildren = "/parent/children";
  static const parentAttendance = "/parent/attendance";
  static const parentResults = "/parent/results";
  static const parentFees = "/parent/fees";
  static const parentVtu = "/parent/vtu";
  static const parentCalls = "/parent/calls";
  static const parentMessages = "/parent/messages";
  static const parentProfile = "/parent/profile";
}

// ── Router builder ────────────────────────────────────────────────────────────

GoRouter buildAppRouter(WidgetRef ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    debugLogDiagnostics: false,
    initialLocation: AppRoutes.auth,
    redirect: (context, state) {
      final isLoading = authState.isLoading;
      if (isLoading) return null;

      final session = authState.value?.session;
      final isAuth = session != null;
      final onAuthScreen = state.matchedLocation.startsWith(AppRoutes.auth);

      if (!isAuth && !onAuthScreen) return AppRoutes.auth;
      if (isAuth && onAuthScreen) return _homeForRole(session.user.role);
      return null;
    },
    routes: [
      // ── Auth ────────────────────────────────────────────────────────────────
      GoRoute(
        path: AppRoutes.auth,
        builder: (_, __) => const AuthScreenPage(),
      ),

      // ── Student shell ────────────────────────────────────────────────────────
      ShellRoute(
        builder: (_, __, child) => RoleShell(role: UserRole.student, child: child),
        routes: _studentRoutes(),
      ),

      // ── Teacher shell ────────────────────────────────────────────────────────
      ShellRoute(
        builder: (_, __, child) => RoleShell(role: UserRole.faculty, child: child),
        routes: _teacherRoutes(),
      ),

      // ── Admin shell ──────────────────────────────────────────────────────────
      ShellRoute(
        builder: (_, __, child) => RoleShell(role: UserRole.admin, child: child),
        routes: _adminRoutes(),
      ),

      // ── Parent shell ─────────────────────────────────────────────────────────
      ShellRoute(
        builder: (_, __, child) => RoleShell(role: UserRole.parent, child: child),
        routes: _parentRoutes(),
      ),
    ],
  );
}

String _homeForRole(UserRole role) {
  switch (role) {
    case UserRole.admin:
    case UserRole.principal:
    case UserRole.dean:
    case UserRole.trustee:
    case UserRole.hod:
      return AppRoutes.adminDashboard;
    case UserRole.faculty:
    case UserRole.counsellor:
      return AppRoutes.teacherDashboard;
    case UserRole.student:
      return AppRoutes.studentDashboard;
    case UserRole.parent:
      return AppRoutes.parentDashboard;
  }
}

// ── Route lists ───────────────────────────────────────────────────────────────

List<RouteBase> _studentRoutes() => [
  GoRoute(path: AppRoutes.studentDashboard, builder: (_, __) => const stu.StudentDashboardScreen()),
  GoRoute(path: AppRoutes.studentAttendance, builder: (_, __) => const AttendanceScreen()),
  GoRoute(path: AppRoutes.studentAssignments, builder: (_, __) => const AssignmentsScreen()),
  GoRoute(path: AppRoutes.studentCourses, builder: (_, __) => const CoursesScreen()),
  GoRoute(path: AppRoutes.studentSchedule, builder: (_, __) => const ScheduleScreen()),
  GoRoute(path: AppRoutes.studentResults, builder: (_, __) => const ResultsScreen()),
  GoRoute(path: AppRoutes.studentFees, builder: (_, __) => const FeesScreen()),
  GoRoute(path: AppRoutes.studentHostel, builder: (_, __) => const HostelScreen()),
  GoRoute(path: AppRoutes.studentJobs, builder: (_, __) => const PlacementsScreen()),
  GoRoute(path: AppRoutes.studentChatbot, builder: (_, __) => const ChatbotScreen()),
  GoRoute(path: AppRoutes.studentStudyPlan, builder: (_, __) => const StudyPlanScreen()),
  GoRoute(path: AppRoutes.studentExamPrep, builder: (_, __) => const ExamPrepScreen()),
  GoRoute(path: AppRoutes.studentCounselor, builder: (_, __) => const CounselorScreen()),
  GoRoute(path: AppRoutes.studentVtu, builder: (_, __) => const StudentVtuScreen()),
  GoRoute(path: AppRoutes.studentProfile, builder: (_, __) => const ProfileScreen()),
  GoRoute(path: AppRoutes.studentHr, builder: (_, __) => const HrStaffScreen()),
  GoRoute(path: AppRoutes.studentLearn, builder: (_, __) => const LearnScreen()),
];

List<RouteBase> _teacherRoutes() => [
  GoRoute(path: AppRoutes.teacherDashboard, builder: (_, __) => const TeacherDashboardScreen()),
  GoRoute(path: AppRoutes.teacherMarkAttendance, builder: (_, __) => const MarkAttendanceScreen()),
  GoRoute(path: AppRoutes.teacherAssignments, builder: (_, __) => const TeacherAssignmentsScreen()),
  GoRoute(path: AppRoutes.teacherIaMarks, builder: (_, __) => const IaMarksEntryScreen()),
  GoRoute(path: AppRoutes.teacherVtu, builder: (_, __) => const TeacherVtuScreen()),
  GoRoute(path: AppRoutes.teacherCallPanel, builder: (_, __) => const CallPanelScreen()),
  GoRoute(path: AppRoutes.teacherClasses, builder: (_, __) => const TeacherClassesScreen()),
  GoRoute(path: AppRoutes.teacherAttendSummary, builder: (_, __) => const AttendSummaryScreen()),
  GoRoute(path: AppRoutes.teacherUploadResults, builder: (_, __) => const UploadResultsScreen()),
  GoRoute(path: AppRoutes.teacherProfile, builder: (_, __) => const ProfileScreen()),
];

List<RouteBase> _adminRoutes() => [
  GoRoute(path: AppRoutes.adminDashboard, builder: (_, __) => const AdminDashboardScreen()),
  GoRoute(path: AppRoutes.adminUsers, builder: (_, __) => const UserManagementScreen()),
  GoRoute(path: AppRoutes.adminClasses, builder: (_, __) => const ClassManagementScreen()),
  GoRoute(path: AppRoutes.adminCourses, builder: (_, __) => const CourseManagementScreen()),
  GoRoute(path: AppRoutes.adminIaSubmission, builder: (_, __) => const IaSubmissionScreen()),
  GoRoute(path: AppRoutes.adminVtu, builder: (_, __) => const VtuAdminScreen()),
  GoRoute(path: AppRoutes.adminBulkImport, builder: (_, __) => const BulkImportScreen()),
  GoRoute(path: AppRoutes.adminReports, builder: (_, __) => const AdminReportsScreen()),
  GoRoute(path: AppRoutes.adminProfile, builder: (_, __) => const ProfileScreen()),
];

List<RouteBase> _parentRoutes() => [
  GoRoute(path: AppRoutes.parentDashboard, builder: (_, __) => const ParentDashboardScreen()),
  GoRoute(path: AppRoutes.parentChildren, builder: (_, __) => const ChildrenScreen()),
  GoRoute(path: AppRoutes.parentAttendance, builder: (_, __) => const ParentAttendanceScreen()),
  GoRoute(path: AppRoutes.parentResults, builder: (_, __) => const ParentResultsScreen()),
  GoRoute(path: AppRoutes.parentFees, builder: (_, __) => const ParentFeesScreen()),
  GoRoute(path: AppRoutes.parentVtu, builder: (_, __) => const ParentVtuScreen()),
  GoRoute(path: AppRoutes.parentCalls, builder: (_, __) => const CallHistoryScreen()),
  GoRoute(path: AppRoutes.parentMessages, builder: (_, __) => const ParentMessagesScreen()),
  GoRoute(path: AppRoutes.parentProfile, builder: (_, __) => const ProfileScreen()),
];

// ── Router provider ──────────────────────────────────────────────────────────

final routerProvider = Provider<GoRouter>((ref) {
  return buildAppRouter(ref as WidgetRef);
});
