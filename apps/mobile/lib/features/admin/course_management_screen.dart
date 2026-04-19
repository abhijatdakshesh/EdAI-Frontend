import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _coursesAdminProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/courses");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class CourseManagementScreen extends ConsumerWidget {
  const CourseManagementScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_coursesAdminProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(icon: const Icon(Icons.add), label: const Text("Add Course"), onPressed: () {}),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_coursesAdminProvider),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => AppError(message: e.toString()),
          data: (courses) => courses.isEmpty
              ? const AppEmpty(message: "No courses found")
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: courses.length,
                  itemBuilder: (_, i) {
                    final c = courses[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(c["name"] as String? ?? ""),
                        subtitle: Text("${c["code"] ?? ""} · ${c["type"] ?? ""} · ${c["credits"] ?? 0} cr"),
                        trailing: Switch(value: c["active"] as bool? ?? true, onChanged: (_) {}),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
