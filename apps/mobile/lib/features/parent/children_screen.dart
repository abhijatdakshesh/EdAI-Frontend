import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _childrenProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/parent/children");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class ChildrenScreen extends ConsumerWidget {
  const ChildrenScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_childrenProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_childrenProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (children) => children.isEmpty
            ? const AppEmpty(message: "No children linked to your account")
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: children.length,
                itemBuilder: (_, i) {
                  final c = children[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          CircleAvatar(child: Text((c["name"] as String? ?? "?")[0].toUpperCase())),
                          const SizedBox(width: 12),
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(c["name"] as String? ?? "", style: const TextStyle(fontWeight: FontWeight.w600)),
                            Text(c["usn"] as String? ?? "", style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          ])),
                        ]),
                        const SizedBox(height: 12),
                        Row(children: [
                          _InfoChip("Dept", c["dept"] as String? ?? "—"),
                          const SizedBox(width: 8),
                          _InfoChip("Sem", "${c["semester"] ?? "—"}"),
                          const SizedBox(width: 8),
                          _InfoChip("CGPA", "${c["cgpa"] ?? "—"}"),
                        ]),
                        const SizedBox(height: 8),
                        _InfoChip("Fee Status", c["feeStatus"] as String? ?? "—"),
                      ]),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip(this.label, this.value);
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey, letterSpacing: 1)),
      Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
    ]);
  }
}
