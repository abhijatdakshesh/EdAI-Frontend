import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _callLogsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/comms/calls/recent");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class CallPanelScreen extends ConsumerWidget {
  const CallPanelScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_callLogsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_callLogsProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (logs) => logs.isEmpty
            ? const AppEmpty(message: "No recent AI calls")
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: logs.length,
                itemBuilder: (_, i) {
                  final log = logs[i];
                  final outcome = log["outcome"] as String? ?? "";
                  final color = outcome == "ANSWERED" ? Colors.green : outcome == "FAILED" ? Colors.red : Colors.orange;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: CircleAvatar(backgroundColor: color.withAlpha(50),
                          child: Icon(Icons.phone, color: color, size: 20)),
                      title: Text(log["studentName"] as String? ?? ""),
                      subtitle: Text("${log["parentPhone"] ?? ""} · ${log["calledAt"] ?? ""}\n${log["duration"] ?? 0}s"),
                      isThreeLine: true,
                      trailing: Chip(
                        label: Text(outcome.replaceAll("_", " "), style: const TextStyle(fontSize: 10)),
                        backgroundColor: color.withAlpha(50),
                        padding: EdgeInsets.zero,
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
