import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _coursesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/courses");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class CoursesScreen extends ConsumerWidget {
  const CoursesScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_coursesProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_coursesProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString(), onRetry: () => ref.invalidate(_coursesProvider)),
        data: (courses) => courses.isEmpty
            ? const AppEmpty(message: "No courses found")
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: courses.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final c = courses[i];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(child: Text(c["name"] as String? ?? "",
                                  style: const TextStyle(fontWeight: FontWeight.w600))),
                              Chip(
                                label: Text(c["type"] as String? ?? ""),
                                padding: EdgeInsets.zero,
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text("${c["code"] ?? ""} · Sem ${c["semester"] ?? ""} · ${c["credits"] ?? ""} cr",
                              style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                          if (c["syllabusUrl"] != null) ...[
                            const SizedBox(height: 8),
                            TextButton.icon(
                              icon: const Icon(Icons.download_outlined, size: 16),
                              label: const Text("Syllabus"),
                              onPressed: () {},
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
