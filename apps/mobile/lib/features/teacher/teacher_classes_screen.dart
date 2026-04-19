import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _teacherClassesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/teacher/classes");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class TeacherClassesScreen extends ConsumerWidget {
  const TeacherClassesScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_teacherClassesProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_teacherClassesProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (classes) => classes.isEmpty
            ? const AppEmpty(message: "No classes assigned")
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: classes.length,
                itemBuilder: (_, i) {
                  final c = classes[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text(c["name"] as String? ?? ""),
                      subtitle: Text("${c["departmentCode"] ?? ""} · Sem ${c["semester"] ?? ""} · ${c["strength"] ?? 0} students"),
                      trailing: const Icon(Icons.chevron_right),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
