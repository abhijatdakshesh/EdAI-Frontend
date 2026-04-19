import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _examPrepProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<Map<String, dynamic>>("/api/student/exam-prep");
  return res.data ?? {};
});

class ExamPrepScreen extends ConsumerWidget {
  const ExamPrepScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_examPrepProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_examPrepProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (data) {
          final stress = data["stressLevel"] as String? ?? "LOW";
          final tips = (data["tips"] as List?)?.cast<String>() ?? [];
          final subjects = (data["subjects"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          final stressColor = stress == "HIGH" ? Colors.red : stress == "MEDIUM" ? Colors.orange : Colors.green;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                color: stressColor.withAlpha(30),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.psychology, color: stressColor, size: 32),
                      const SizedBox(width: 12),
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text("EXAM STRESS LEVEL", style: TextStyle(fontSize: 11, letterSpacing: 1)),
                        Text(stress, style: TextStyle(fontSize: 22, color: stressColor, fontWeight: FontWeight.w600)),
                      ]),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (tips.isNotEmpty) ...[
                Text("AI Tips", style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                for (final tip in tips) ListTile(
                  leading: const Icon(Icons.lightbulb_outline, size: 20),
                  title: Text(tip, style: const TextStyle(fontSize: 14)),
                  dense: true,
                ),
                const SizedBox(height: 16),
              ],
              Text("Subject Readiness", style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              for (final sub in subjects) _SubjectReadiness(sub: sub),
            ],
          );
        },
      ),
    );
  }
}

class _SubjectReadiness extends StatelessWidget {
  const _SubjectReadiness({required this.sub});
  final Map<String, dynamic> sub;
  @override
  Widget build(BuildContext context) {
    final pct = (sub["readinessPct"] as num? ?? 0).toDouble();
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(child: Text(sub["name"] as String? ?? "", style: const TextStyle(fontWeight: FontWeight.w500))),
              Text("${pct.round()}%"),
            ]),
            const SizedBox(height: 6),
            LinearProgressIndicator(value: pct / 100,
                color: pct >= 70 ? Colors.green : pct >= 50 ? Colors.orange : Colors.red),
          ],
        ),
      ),
    );
  }
}
