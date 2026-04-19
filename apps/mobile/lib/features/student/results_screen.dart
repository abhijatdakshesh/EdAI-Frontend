import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../core/auth/auth_provider.dart";
import "../../shared/widgets/app_error.dart";

final _resultsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final session = ref.read(sessionProvider);
  final usn = session?.user.sapId ?? session?.user.id ?? "";
  final res = await dio.get<Map<String, dynamic>>("/api/academics/results/student/$usn");
  return res.data!;
});

class ResultsScreen extends ConsumerWidget {
  const ResultsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_resultsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_resultsProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString(), onRetry: () => ref.invalidate(_resultsProvider)),
        data: (data) {
          final cgpa = data["cgpa"] as num?;
          final semesters = (data["semesters"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (cgpa != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        const Icon(Icons.grade_outlined, size: 32),
                        const SizedBox(width: 16),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("CGPA", style: TextStyle(letterSpacing: 1, fontSize: 12)),
                            Text(cgpa.toStringAsFixed(2),
                                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w300)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              for (final sem in semesters.reversed.toList()) ...[
                _SemesterCard(sem: sem),
                const SizedBox(height: 8),
              ],
              if (semesters.isEmpty) const AppEmpty(message: "No results available yet"),
            ],
          );
        },
      ),
    );
  }
}

class _SemesterCard extends StatelessWidget {
  const _SemesterCard({required this.sem});
  final Map<String, dynamic> sem;
  @override
  Widget build(BuildContext context) {
    final subjects = (sem["subjects"] as List?)?.cast<Map<String, dynamic>>() ?? [];
    return Card(
      child: ExpansionTile(
        title: Text("Semester ${sem["semester"] ?? ""}"),
        trailing: Text("SGPA: ${sem["sgpa"] ?? "—"}",
            style: const TextStyle(fontWeight: FontWeight.w600)),
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              columnSpacing: 24,
              columns: const [
                DataColumn(label: Text("Subject")),
                DataColumn(label: Text("IA")),
                DataColumn(label: Text("Exam")),
                DataColumn(label: Text("Total")),
                DataColumn(label: Text("Grade")),
              ],
              rows: subjects
                  .map((s) => DataRow(cells: [
                        DataCell(Text("${s["code"] ?? ""}")),
                        DataCell(Text("${s["ia"] ?? "—"}")),
                        DataCell(Text("${s["exam"] ?? "—"}")),
                        DataCell(Text("${s["total"] ?? "—"}")),
                        DataCell(Text("${s["grade"] ?? "—"}")),
                      ]))
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }
}
