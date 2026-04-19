import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _classesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/classes");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class ClassManagementScreen extends ConsumerWidget {
  const ClassManagementScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_classesProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text("Add Class"),
        onPressed: () {},
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_classesProvider),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => AppError(message: e.toString()),
          data: (classes) => classes.isEmpty
              ? const AppEmpty(message: "No classes found")
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
      ),
    );
  }
}
