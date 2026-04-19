import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "../../core/api/dio_client.dart";
import "../../core/auth/auth_provider.dart";
import "../../core/router/app_router.dart";
import "../../shared/widgets/app_error.dart";

final _teacherDashboardProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<Map<String, dynamic>>("/api/teacher/dashboard");
  return res.data!;
});

class TeacherDashboardScreen extends ConsumerWidget {
  const TeacherDashboardScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final async = ref.watch(_teacherDashboardProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_teacherDashboardProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString(), onRetry: () => ref.invalidate(_teacherDashboardProvider)),
        data: (data) {
          final stats = data["stats"] as Map<String, dynamic>? ?? {};
          final classes = (data["classes"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          final atRisk = (data["atRiskStudents"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text("Welcome, ${session?.user.name ?? "Faculty"}",
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w300)),
              const SizedBox(height: 16),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
                childAspectRatio: 1.8,
                children: [
                  StatCard(label: "CLASSES TODAY", value: "${stats["classesToday"] ?? "—"}"),
                  StatCard(label: "AT-RISK STUDENTS", value: "${stats["atRiskCount"] ?? "—"}",
                      color: (stats["atRiskCount"] as num? ?? 0) > 0 ? Colors.orange : null),
                  StatCard(label: "PENDING IA ENTRY", value: "${stats["pendingIaCount"] ?? "—"}"),
                  StatCard(label: "ASSIGNMENTS DUE", value: "${stats["assignmentsDue"] ?? "—"}"),
                ],
              ),
              const SizedBox(height: 24),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ActionChip(avatar: const Icon(Icons.how_to_reg_outlined, size: 18),
                      label: const Text("Mark Attendance"),
                      onPressed: () => context.go(AppRoutes.teacherMarkAttendance)),
                  ActionChip(avatar: const Icon(Icons.edit_note_outlined, size: 18),
                      label: const Text("IA Marks"),
                      onPressed: () => context.go(AppRoutes.teacherIaMarks)),
                  ActionChip(avatar: const Icon(Icons.assignment_outlined, size: 18),
                      label: const Text("Assignments"),
                      onPressed: () => context.go(AppRoutes.teacherAssignments)),
                  ActionChip(avatar: const Icon(Icons.phone_outlined, size: 18),
                      label: const Text("Call Panel"),
                      onPressed: () => context.go(AppRoutes.teacherCallPanel)),
                ],
              ),
              const SizedBox(height: 24),
              if (classes.isNotEmpty) ...[
                Text("My Classes", style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                for (final c in classes) ListTile(
                  title: Text(c["name"] as String? ?? ""),
                  subtitle: Text("${c["semester"] ?? ""} · ${c["strength"] ?? 0} students"),
                  trailing: const Icon(Icons.chevron_right),
                ),
              ],
              if (atRisk.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text("At-Risk Students", style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                for (final s in atRisk) ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.red.shade100,
                    child: Text("${s["pct"] ?? "?"}%", style: const TextStyle(fontSize: 11, color: Colors.red)),
                  ),
                  title: Text(s["name"] as String? ?? ""),
                  subtitle: Text(s["usn"] as String? ?? ""),
                  dense: true,
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class StatCard extends StatelessWidget {
  const StatCard({required this.label, required this.value, this.color, super.key});
  final String label;
  final String value;
  final Color? color;
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(fontSize: 10, letterSpacing: 1, color: Colors.grey)),
          const SizedBox(height: 4),
          Text(value, style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w300, color: color)),
        ]),
      ),
    );
  }
}
