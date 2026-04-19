import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _reportsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<Map<String, dynamic>>("/api/analytics/admin/reports");
  return res.data ?? {};
});

class AdminReportsScreen extends ConsumerWidget {
  const AdminReportsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_reportsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_reportsProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (data) {
          final deptStats = (data["departmentStats"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text("Reports", style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              if (deptStats.isNotEmpty) ...[
                Text("Department Attendance", style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                for (final d in deptStats) Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(child: Text(d["dept"] as String? ?? "")),
                        Text("${d["avgPct"] ?? "—"}%"),
                      ]),
                      const SizedBox(height: 6),
                      LinearProgressIndicator(value: ((d["avgPct"] as num? ?? 0) / 100).clamp(0.0, 1.0)),
                      const SizedBox(height: 4),
                      Text("${d["belowThreshold"] ?? 0} students below 75%",
                          style: const TextStyle(fontSize: 12, color: Colors.orange)),
                    ]),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.download_outlined),
                title: const Text("Download Attendance Report"),
                subtitle: const Text("PDF / CSV"),
                onTap: () {},
              ),
              ListTile(
                leading: const Icon(Icons.download_outlined),
                title: const Text("Download Fee Collection Report"),
                subtitle: const Text("PDF / CSV"),
                onTap: () {},
              ),
            ],
          );
        },
      ),
    );
  }
}
