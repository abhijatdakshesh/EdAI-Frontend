import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _teacherVtuProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/vtu/windows");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class TeacherVtuScreen extends ConsumerWidget {
  const TeacherVtuScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_teacherVtuProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_teacherVtuProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (windows) => windows.isEmpty
            ? const AppEmpty(message: "No VTU registration windows")
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: windows.length,
                itemBuilder: (_, i) {
                  final w = windows[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text(w["title"] as String? ?? ""),
                      subtitle: Text("${w["examMonth"] ?? ""} · ${w["openDate"] ?? ""} – ${w["closeDate"] ?? ""}"),
                      trailing: Chip(label: Text(w["status"] as String? ?? "")),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
