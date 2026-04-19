import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _iaSubmissionsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/ia/submissions");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class IaSubmissionScreen extends ConsumerWidget {
  const IaSubmissionScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_iaSubmissionsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_iaSubmissionsProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (subs) => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: subs.length,
          itemBuilder: (_, i) {
            final s = subs[i];
            final status = s["status"] as String? ?? "";
            final color = status == "CONFIRMED" ? Colors.green : status == "SUBMITTED" ? Colors.blue : status == "DRAFT" ? Colors.orange : Colors.grey;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text("${s["subjectName"] ?? ""}"),
                subtitle: Text("${s["teacherName"] ?? ""} · ${s["dept"] ?? ""}\n${s["marksEntered"] ?? 0}/${s["studentCount"] ?? 0} entered"),
                isThreeLine: true,
                trailing: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Chip(label: Text(status.replaceAll("_", " "), style: const TextStyle(fontSize: 10)), backgroundColor: color.withAlpha(50), padding: EdgeInsets.zero),
                  if (status == "SUBMITTED") TextButton(
                    onPressed: () => _confirm(context, ref, s["id"] as String? ?? ""),
                    style: TextButton.styleFrom(padding: EdgeInsets.zero),
                    child: const Text("Confirm", style: TextStyle(fontSize: 12)),
                  ),
                ]),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _confirm(BuildContext ctx, WidgetRef ref, String id) async {
    try {
      final dio = ref.read(dioProvider);
      await dio.post<dynamic>("/api/ia/submissions/$id/confirm");
      ref.invalidate(_iaSubmissionsProvider);
    } catch (e) {
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }
}
