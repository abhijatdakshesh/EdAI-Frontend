import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "../../core/api/dio_client.dart";
import "../../core/auth/auth_provider.dart";
import "../../core/router/app_router.dart";
import "../../shared/widgets/app_error.dart";

final _adminDashProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<Map<String, dynamic>>("/api/analytics/admin/dashboard");
  return res.data ?? {};
});

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final async = ref.watch(_adminDashProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_adminDashProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString(), onRetry: () => ref.invalidate(_adminDashProvider)),
        data: (stats) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text("Welcome, ${session?.user.name ?? "Admin"}",
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
                _StatCard("STUDENTS", "${stats["totalStudents"] ?? "—"}"),
                _StatCard("FACULTY", "${stats["totalFaculty"] ?? "—"}"),
                _StatCard("AVG ATTENDANCE", "${stats["avgAttendance"] ?? "—"}%",
                    color: (stats["avgAttendance"] as num? ?? 100) < 75 ? Colors.red : null),
                _StatCard("FEE COLLECTION", "${stats["feeCollectionPct"] ?? "—"}%"),
              ],
            ),
            const SizedBox(height: 24),
            Text("Quick Actions", style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              ActionChip(avatar: const Icon(Icons.manage_accounts_outlined, size: 18), label: const Text("Users"), onPressed: () => context.go(AppRoutes.adminUsers)),
              ActionChip(avatar: const Icon(Icons.grading_outlined, size: 18), label: const Text("IA Submission"), onPressed: () => context.go(AppRoutes.adminIaSubmission)),
              ActionChip(avatar: const Icon(Icons.how_to_reg_outlined, size: 18), label: const Text("VTU"), onPressed: () => context.go(AppRoutes.adminVtu)),
              ActionChip(avatar: const Icon(Icons.analytics_outlined, size: 18), label: const Text("Reports"), onPressed: () => context.go(AppRoutes.adminReports)),
              ActionChip(avatar: const Icon(Icons.upload_file_outlined, size: 18), label: const Text("Bulk Import"), onPressed: () => context.go(AppRoutes.adminBulkImport)),
            ]),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard(this.label, this.value, {this.color});
  final String label;
  final String value;
  final Color? color;
  @override
  Widget build(BuildContext context) => Card(
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
