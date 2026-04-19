import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _vtuWindowsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/vtu/windows");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class VtuAdminScreen extends ConsumerWidget {
  const VtuAdminScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_vtuWindowsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_vtuWindowsProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (windows) => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: windows.length,
          itemBuilder: (_, i) {
            final w = windows[i];
            final status = w["status"] as String? ?? "";
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(w["title"] as String? ?? ""),
                subtitle: Text("${w["examMonth"] ?? ""} · ${w["openDate"] ?? ""} – ${w["closeDate"] ?? ""}"),
                trailing: Chip(
                  label: Text(status),
                  backgroundColor: status == "OPEN" ? Colors.green.shade100 : Colors.grey.shade200,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
