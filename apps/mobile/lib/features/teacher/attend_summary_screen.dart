import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _attendSummaryProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/teacher/attendance/summary");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class AttendSummaryScreen extends ConsumerWidget {
  const AttendSummaryScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_attendSummaryProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_attendSummaryProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (summaries) => summaries.isEmpty
            ? const AppEmpty(message: "No attendance summaries available")
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: summaries.length,
                itemBuilder: (_, i) {
                  final s = summaries[i];
                  final pct = s["pct"] as num? ?? 0;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Expanded(child: Text(s["className"] as String? ?? "", style: const TextStyle(fontWeight: FontWeight.w600))),
                          Text("${pct.round()}%"),
                        ]),
                        const SizedBox(height: 6),
                        LinearProgressIndicator(value: pct / 100,
                            color: pct >= 75 ? Colors.green : Colors.red),
                        const SizedBox(height: 4),
                        Text("${s["present"] ?? 0} present · ${s["absent"] ?? 0} absent · ${s["totalStudents"] ?? 0} total",
                            style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      ]),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
