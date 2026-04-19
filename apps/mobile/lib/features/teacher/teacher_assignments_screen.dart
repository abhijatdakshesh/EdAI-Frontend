import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _assignmentsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/teacher/assignments");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class TeacherAssignmentsScreen extends ConsumerWidget {
  const TeacherAssignmentsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_assignmentsProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text("New Assignment"),
        onPressed: () => _showCreate(context, ref),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_assignmentsProvider),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => AppError(message: e.toString()),
          data: (assignments) => assignments.isEmpty
              ? const AppEmpty(message: "No assignments yet. Create one.")
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: assignments.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final a = assignments[i];
                    final subCount = a["submissionCount"] as int? ?? 0;
                    final total = a["totalStudents"] as int? ?? 0;
                    return Card(
                      child: ListTile(
                        title: Text(a["title"] as String? ?? ""),
                        subtitle: Text("${a["courseCode"] ?? ""} · Due ${a["dueDate"] ?? ""}\n$subCount/$total submitted"),
                        isThreeLine: true,
                        trailing: Chip(
                          label: Text(a["status"] as String? ?? ""),
                          backgroundColor: (a["status"] == "PUBLISHED")
                              ? Colors.green.shade100
                              : Colors.grey.shade200,
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }

  void _showCreate(BuildContext context, WidgetRef ref) {
    final titleCtrl = TextEditingController();
    final codeCtrl = TextEditingController();
    final dateCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text("New Assignment", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 16),
          TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: "Title", border: OutlineInputBorder())),
          const SizedBox(height: 8),
          TextField(controller: codeCtrl, decoration: const InputDecoration(labelText: "Course Code", border: OutlineInputBorder())),
          const SizedBox(height: 8),
          TextField(controller: dateCtrl, decoration: const InputDecoration(labelText: "Due Date (YYYY-MM-DD)", border: OutlineInputBorder())),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final dio = ref.read(dioProvider);
                await dio.post<dynamic>("/api/teacher/assignments", data: {
                  "title": titleCtrl.text,
                  "courseCode": codeCtrl.text,
                  "dueDate": dateCtrl.text,
                  "status": "DRAFT",
                  "maxMarks": 25,
                });
                ref.invalidate(_assignmentsProvider);
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
              }
            },
            child: const Text("Create"),
          ),
        ]),
      ),
    );
  }
}
