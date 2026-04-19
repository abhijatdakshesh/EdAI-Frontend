import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _studyPlanProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<Map<String, dynamic>>("/api/wellness/study-plan/me");
  return res.data ?? {};
});

class StudyPlanScreen extends ConsumerWidget {
  const StudyPlanScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_studyPlanProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_studyPlanProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AppError(message: "No study plan yet. Generate one."),
            FilledButton.icon(
              icon: const Icon(Icons.auto_awesome),
              label: const Text("Generate AI Plan"),
              onPressed: () async {
                try {
                  final dio = ref.read(dioProvider);
                  await dio.post<dynamic>("/api/wellness/study-plan/generate");
                  ref.invalidate(_studyPlanProvider);
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                  }
                }
              },
            ),
          ],
        ),
        data: (plan) {
          final tasks = (plan["tasks"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          final streak = plan["streakDays"] as int? ?? 0;
          final total = plan["totalTasks"] as int? ?? tasks.length;
          final completed = plan["completedTasks"] as int? ?? 0;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(child: Card(child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(children: [
                      Text("$streak", style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.w300)),
                      const Text("Day Streak"),
                    ]),
                  ))),
                  const SizedBox(width: 8),
                  Expanded(child: Card(child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(children: [
                      Text("$completed/$total", style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w300)),
                      const Text("Tasks Done"),
                    ]),
                  ))),
                ],
              ),
              const SizedBox(height: 16),
              LinearProgressIndicator(value: total > 0 ? completed / total : 0),
              const SizedBox(height: 16),
              Text("Today's Tasks", style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              for (final task in tasks) _TaskTile(task: task, ref: ref),
            ],
          );
        },
      ),
    );
  }
}

class _TaskTile extends StatelessWidget {
  const _TaskTile({required this.task, required this.ref});
  final Map<String, dynamic> task;
  final WidgetRef ref;
  @override
  Widget build(BuildContext context) {
    final done = task["completed"] as bool? ?? false;
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        leading: Checkbox(
          value: done,
          onChanged: done ? null : (_) async {
            try {
              final dio = ref.read(dioProvider);
              await dio.post<dynamic>("/api/wellness/study-plan/tasks/${task["id"]}/complete");
              ref.invalidate(_studyPlanProvider);
            } catch (_) {}
          },
        ),
        title: Text(task["topic"] as String? ?? "",
            style: TextStyle(decoration: done ? TextDecoration.lineThrough : null)),
        subtitle: Text("${task["subjectName"] ?? ""} · ${task["durationMins"] ?? 0} min"),
      ),
    );
  }
}
