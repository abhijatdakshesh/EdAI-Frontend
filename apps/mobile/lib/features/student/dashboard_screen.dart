import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../core/api/dio_client.dart";
import "../../core/auth/auth_provider.dart";
import "../../core/router/app_router.dart";
import "../../shared/widgets/app_error.dart";

final _dashboardProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<Map<String, dynamic>>("/api/student/dashboard");
  return res.data!;
});

class StudentDashboardScreen extends ConsumerWidget {
  const StudentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final dashAsync = ref.watch(_dashboardProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_dashboardProvider),
      child: dashAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString(), onRetry: () => ref.invalidate(_dashboardProvider)),
        data: (data) {
          final stats = data["stats"] as Map<String, dynamic>? ?? {};
          final courses = (data["courses"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          final upcoming = (data["upcoming"] as List?)?.cast<Map<String, dynamic>>() ?? [];

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text("Welcome, ${session?.user.name ?? "Student"}",
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w300)),
              const SizedBox(height: 16),

              // KPIs
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
                childAspectRatio: 1.8,
                children: [
                  StatCard(label: "ATTENDANCE", value: "${stats["attendancePct"] ?? "—"}%",
                      color: _attColor(stats["attendancePct"] as num?)),
                  StatCard(label: "CGPA", value: "${stats["cgpa"] ?? "—"}"),
                  StatCard(label: "PENDING ASSIGNMENTS", value: "${stats["pendingAssignments"] ?? "—"}"),
                  StatCard(label: "FEE STATUS", value: "${stats["feeStatus"] ?? "—"}"),
                ],
              ),
              const SizedBox(height: 24),

              // Quick actions
              Text("Quick Actions", style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _QuickAction(Icons.check_circle_outline, "Attendance", () => context.go(AppRoutes.studentAttendance)),
                  _QuickAction(Icons.grade_outlined, "Results", () => context.go(AppRoutes.studentResults)),
                  _QuickAction(Icons.payment_outlined, "Fees", () => context.go(AppRoutes.studentFees)),
                  _QuickAction(Icons.smart_toy_outlined, "AI Chat", () => context.go(AppRoutes.studentChatbot)),
                  _QuickAction(Icons.how_to_reg_outlined, "VTU", () => context.go(AppRoutes.studentVtu)),
                  _QuickAction(Icons.psychology_outlined, "Counselor", () => context.go(AppRoutes.studentCounselor)),
                ],
              ),
              const SizedBox(height: 24),

              // Current courses
              Text("My Courses", style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              for (final c in courses) _CourseCard(course: c),
              if (courses.isEmpty) const AppEmpty(message: "No courses enrolled"),
              const SizedBox(height: 24),

              // Upcoming
              Text("Upcoming", style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              for (final u in upcoming) _UpcomingTile(item: u),
              if (upcoming.isEmpty) const AppEmpty(message: "Nothing upcoming"),
            ],
          );
        },
      ),
    );
  }

  Color _attColor(num? pct) {
    if (pct == null) return Colors.grey;
    if (pct >= 85) return Colors.green.shade700;
    if (pct >= 75) return Colors.orange.shade700;
    return Colors.red.shade700;
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction(this.icon, this.label, this.onTap);
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return ActionChip(
      avatar: Icon(icon, size: 18),
      label: Text(label),
      onPressed: onTap,
    );
  }
}

class _CourseCard extends StatelessWidget {
  const _CourseCard({required this.course});
  final Map<String, dynamic> course;
  @override
  Widget build(BuildContext context) {
    final pct = course["attendance"] as num?;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(course["name"] as String? ?? ""),
        subtitle: Text("${course["code"] ?? ""} · Next: ${course["nextClass"] ?? "—"}"),
        trailing: pct != null
            ? Chip(
                label: Text("$pct%"),
                backgroundColor: pct >= 85
                    ? Colors.green.shade100
                    : pct >= 75
                        ? Colors.orange.shade100
                        : Colors.red.shade100,
              )
            : null,
      ),
    );
  }
}

class _UpcomingTile extends StatelessWidget {
  const _UpcomingTile({required this.item});
  final Map<String, dynamic> item;
  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      leading: Text(item["date"] as String? ?? "", style: const TextStyle(fontSize: 12)),
      title: Text(item["event"] as String? ?? ""),
      trailing: Chip(
        label: Text((item["type"] as String? ?? "").toUpperCase(), style: const TextStyle(fontSize: 10)),
        padding: EdgeInsets.zero,
      ),
    );
  }
}
