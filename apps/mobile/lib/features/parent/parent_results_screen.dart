import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _parentResultsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final childrenRes = await dio.get<List<dynamic>>("/api/parent/children");
  final children = (childrenRes.data ?? []).cast<Map<String, dynamic>>();
  if (children.isEmpty) return {};
  final usn = children.first["usn"] as String? ?? "";
  final res = await dio.get<Map<String, dynamic>>("/api/parent/children/$usn/results");
  return res.data ?? {};
});

class ParentResultsScreen extends ConsumerWidget {
  const ParentResultsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_parentResultsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_parentResultsProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (data) {
          if (data.isEmpty) return const AppEmpty(message: "No results found");
          final cgpa = data["cgpa"] as num?;
          final semesters = (data["semesters"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (cgpa != null) Card(
                child: ListTile(
                  leading: const Icon(Icons.grade, size: 32),
                  title: const Text("CGPA"),
                  trailing: Text(cgpa.toStringAsFixed(2),
                      style: Theme.of(context).textTheme.headlineSmall),
                ),
              ),
              const SizedBox(height: 8),
              for (final sem in semesters.reversed.toList()) ExpansionTile(
                title: Text("Semester ${sem["semester"] ?? ""}"),
                trailing: Text("SGPA: ${sem["sgpa"] ?? "—"}"),
                children: [
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(columns: const [
                      DataColumn(label: Text("Subject")),
                      DataColumn(label: Text("IA")),
                      DataColumn(label: Text("Grade")),
                    ], rows: ((sem["subjects"] as List?)?.cast<Map<String, dynamic>>() ?? []).map((s) =>
                      DataRow(cells: [
                        DataCell(Text("${s["code"] ?? ""}")),
                        DataCell(Text("${s["ia"] ?? "—"}")),
                        DataCell(Text("${s["grade"] ?? "—"}")),
                      ])
                    ).toList()),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}
