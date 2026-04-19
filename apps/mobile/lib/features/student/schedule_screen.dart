import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _scheduleProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/student/schedule");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class ScheduleScreen extends ConsumerWidget {
  const ScheduleScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_scheduleProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_scheduleProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString(), onRetry: () => ref.invalidate(_scheduleProvider)),
        data: (schedule) => schedule.isEmpty
            ? const AppEmpty(message: "No schedule found")
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: schedule.length,
                itemBuilder: (_, i) {
                  final slot = schedule[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(slot["day"] as String? ?? "", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                          Text(slot["time"] as String? ?? "", style: const TextStyle(fontSize: 10, color: Colors.grey)),
                        ],
                      ),
                      title: Text(slot["subjectName"] as String? ?? ""),
                      subtitle: Text("${slot["faculty"] ?? ""} · ${slot["room"] ?? ""}"),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
