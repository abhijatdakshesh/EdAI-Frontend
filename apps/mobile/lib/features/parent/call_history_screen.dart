import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../core/auth/auth_provider.dart";
import "../../shared/widgets/app_error.dart";

final _callHistoryProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final session = ref.read(sessionProvider);
  final parentId = session?.user.id ?? "";
  final res = await dio.get<List<dynamic>>("/api/parent-comms/calls?parentId=$parentId");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class CallHistoryScreen extends ConsumerWidget {
  const CallHistoryScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_callHistoryProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_callHistoryProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (logs) => logs.isEmpty
            ? const AppEmpty(message: "No AI call history")
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: logs.length,
                itemBuilder: (_, i) {
                  final log = logs[i];
                  final outcome = log["outcome"] as String? ?? "";
                  final color = outcome == "ANSWERED" ? Colors.green : outcome == "FAILED" ? Colors.red : Colors.orange;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ExpansionTile(
                      leading: Icon(Icons.phone, color: color),
                      title: Text(log["studentName"] as String? ?? ""),
                      subtitle: Text("${log["calledAt"] ?? ""} · ${log["duration"] ?? 0}s"),
                      trailing: Chip(
                        label: Text(outcome.replaceAll("_", " "), style: const TextStyle(fontSize: 10)),
                        backgroundColor: color.withAlpha(50),
                      ),
                      children: [
                        if (log["transcript"] != null) Padding(
                          padding: const EdgeInsets.all(12),
                          child: Text(log["transcript"] as String, style: const TextStyle(fontSize: 12)),
                        ),
                        if (log["summary"] != null) Padding(
                          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                          child: Text("Summary: ${log["summary"]}", style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}
