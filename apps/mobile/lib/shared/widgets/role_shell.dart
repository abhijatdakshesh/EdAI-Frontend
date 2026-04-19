import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../core/auth/auth_provider.dart";
import "../../core/auth/session_store.dart";
import "../../core/router/app_router.dart";

// ── Nav item model ─────────────────────────────────────────────────────────────

class _NavItem {
  const _NavItem({
    required this.label,
    required this.route,
    required this.icon,
  });
  final String label;
  final String route;
  final IconData icon;
}

// ── Role nav maps ─────────────────────────────────────────────────────────────

const _studentNav = [
  _NavItem(label: "Dashboard", route: AppRoutes.studentDashboard, icon: Icons.dashboard_outlined),
  _NavItem(label: "My Courses", route: AppRoutes.studentCourses, icon: Icons.book_outlined),
  _NavItem(label: "Schedule", route: AppRoutes.studentSchedule, icon: Icons.calendar_today_outlined),
  _NavItem(label: "Results", route: AppRoutes.studentResults, icon: Icons.grade_outlined),
  _NavItem(label: "Attendance", route: AppRoutes.studentAttendance, icon: Icons.check_circle_outline),
  _NavItem(label: "Assignments", route: AppRoutes.studentAssignments, icon: Icons.assignment_outlined),
  _NavItem(label: "Announcements", route: AppRoutes.studentChatbot, icon: Icons.campaign_outlined),
  _NavItem(label: "Job Portal", route: AppRoutes.studentJobs, icon: Icons.work_outline),
  _NavItem(label: "Fees & Scholarships", route: AppRoutes.studentFees, icon: Icons.payment_outlined),
  _NavItem(label: "Hostel & Transport", route: AppRoutes.studentHostel, icon: Icons.home_outlined),
  _NavItem(label: "AI Assistant", route: AppRoutes.studentChatbot, icon: Icons.smart_toy_outlined),
  _NavItem(label: "HR & Staff", route: AppRoutes.studentHr, icon: Icons.people_outlined),
  _NavItem(label: "Study Plan", route: AppRoutes.studentStudyPlan, icon: Icons.lightbulb_outline),
  _NavItem(label: "Exam Prep", route: AppRoutes.studentExamPrep, icon: Icons.fitness_center_outlined),
  _NavItem(label: "Counselor", route: AppRoutes.studentCounselor, icon: Icons.psychology_outlined),
  _NavItem(label: "VTU Registration", route: AppRoutes.studentVtu, icon: Icons.how_to_reg_outlined),
  _NavItem(label: "Profile", route: AppRoutes.studentProfile, icon: Icons.person_outline),
];

const _teacherNav = [
  _NavItem(label: "Dashboard", route: AppRoutes.teacherDashboard, icon: Icons.dashboard_outlined),
  _NavItem(label: "Mark Attendance", route: AppRoutes.teacherMarkAttendance, icon: Icons.how_to_reg_outlined),
  _NavItem(label: "Attend Summary", route: AppRoutes.teacherAttendSummary, icon: Icons.bar_chart_outlined),
  _NavItem(label: "My Classes", route: AppRoutes.teacherClasses, icon: Icons.class_outlined),
  _NavItem(label: "Assignments", route: AppRoutes.teacherAssignments, icon: Icons.assignment_outlined),
  _NavItem(label: "IA Marks Entry", route: AppRoutes.teacherIaMarks, icon: Icons.edit_note_outlined),
  _NavItem(label: "Upload Results", route: AppRoutes.teacherUploadResults, icon: Icons.upload_outlined),
  _NavItem(label: "Call Panel", route: AppRoutes.teacherCallPanel, icon: Icons.phone_outlined),
  _NavItem(label: "VTU Registration", route: AppRoutes.teacherVtu, icon: Icons.fact_check_outlined),
  _NavItem(label: "Profile", route: AppRoutes.teacherProfile, icon: Icons.person_outline),
];

const _adminNav = [
  _NavItem(label: "Dashboard", route: AppRoutes.adminDashboard, icon: Icons.dashboard_outlined),
  _NavItem(label: "User Management", route: AppRoutes.adminUsers, icon: Icons.manage_accounts_outlined),
  _NavItem(label: "Class Management", route: AppRoutes.adminClasses, icon: Icons.class_outlined),
  _NavItem(label: "Course Management", route: AppRoutes.adminCourses, icon: Icons.book_outlined),
  _NavItem(label: "IA Submission", route: AppRoutes.adminIaSubmission, icon: Icons.grading_outlined),
  _NavItem(label: "VTU Registration", route: AppRoutes.adminVtu, icon: Icons.how_to_reg_outlined),
  _NavItem(label: "Bulk Import", route: AppRoutes.adminBulkImport, icon: Icons.upload_file_outlined),
  _NavItem(label: "Reports", route: AppRoutes.adminReports, icon: Icons.analytics_outlined),
  _NavItem(label: "Profile", route: AppRoutes.adminProfile, icon: Icons.person_outline),
];

const _parentNav = [
  _NavItem(label: "Dashboard", route: AppRoutes.parentDashboard, icon: Icons.dashboard_outlined),
  _NavItem(label: "My Children", route: AppRoutes.parentChildren, icon: Icons.child_care_outlined),
  _NavItem(label: "Attendance", route: AppRoutes.parentAttendance, icon: Icons.check_circle_outline),
  _NavItem(label: "Results", route: AppRoutes.parentResults, icon: Icons.grade_outlined),
  _NavItem(label: "Fees", route: AppRoutes.parentFees, icon: Icons.payment_outlined),
  _NavItem(label: "VTU Registration", route: AppRoutes.parentVtu, icon: Icons.fact_check_outlined),
  _NavItem(label: "AI Call History", route: AppRoutes.parentCalls, icon: Icons.call_outlined),
  _NavItem(label: "Messages", route: AppRoutes.parentMessages, icon: Icons.message_outlined),
  _NavItem(label: "Profile", route: AppRoutes.parentProfile, icon: Icons.person_outline),
];

// ── Shell widget ──────────────────────────────────────────────────────────────

class RoleShell extends ConsumerWidget {
  const RoleShell({
    required this.role,
    required this.child,
    super.key,
  });

  final UserRole role;
  final Widget child;

  List<_NavItem> get _nav {
    switch (role) {
      case UserRole.student:
        return _studentNav;
      case UserRole.faculty:
      case UserRole.hod:
      case UserRole.counsellor:
        return _teacherNav;
      case UserRole.admin:
      case UserRole.principal:
      case UserRole.dean:
      case UserRole.trustee:
        return _adminNav;
      case UserRole.parent:
        return _parentNav;
    }
  }

  String get _portalLabel {
    switch (role) {
      case UserRole.student:
        return "Student Portal";
      case UserRole.faculty:
      case UserRole.hod:
      case UserRole.counsellor:
        return "Teacher Portal";
      case UserRole.admin:
      case UserRole.principal:
      case UserRole.dean:
      case UserRole.trustee:
        return "Admin Portal";
      case UserRole.parent:
        return "Parent Portal";
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final location = GoRouterState.of(context).matchedLocation;

    if (session == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.go(AppRoutes.auth);
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final nav = _nav;

    return Scaffold(
      appBar: AppBar(
        title: Text(_titleForRoute(location, nav)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(session.user.name,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        )),
                Text(session.user.role.label,
                    style: Theme.of(context).textTheme.labelSmall),
              ],
            ),
          ),
        ],
      ),
      drawer: Drawer(
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              accountName: Text(session.user.name),
              accountEmail: Text(session.user.email),
              currentAccountPicture: CircleAvatar(
                child: Text(
                  session.user.name.isNotEmpty
                      ? session.user.name[0].toUpperCase()
                      : "?",
                  style: const TextStyle(fontSize: 20),
                ),
              ),
              otherAccountsPictures: [
                Chip(
                  label: Text(_portalLabel,
                      style: const TextStyle(fontSize: 10)),
                  padding: EdgeInsets.zero,
                ),
              ],
            ),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  for (final item in nav)
                    ListTile(
                      leading: Icon(item.icon, size: 20),
                      title: Text(item.label),
                      selected: location == item.route,
                      onTap: () {
                        Navigator.of(context).pop();
                        context.go(item.route);
                      },
                    ),
                ],
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.logout, size: 20),
              title: const Text("Logout"),
              onTap: () async {
                Navigator.of(context).pop();
                await ref.read(authProvider.notifier).logout();
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
      body: child,
    );
  }

  String _titleForRoute(String location, List<_NavItem> nav) {
    final item = nav.where((n) => n.route == location).firstOrNull;
    return item?.label ?? "EdAI";
  }
}
