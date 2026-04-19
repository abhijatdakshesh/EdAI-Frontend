import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _parentFeesProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final childrenRes = await dio.get<List<dynamic>>("/api/parent/children");
  final children = (childrenRes.data ?? []).cast<Map<String, dynamic>>();
  if (children.isEmpty) return {};
  final usn = children.first["usn"] as String? ?? "";
  final res = await dio.get<Map<String, dynamic>>("/api/parent/children/$usn/fees");
  return res.data ?? {};
});

class ParentFeesScreen extends ConsumerWidget {
  const ParentFeesScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_parentFeesProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_parentFeesProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (fees) {
          if (fees.isEmpty) return const AppEmpty(message: "No fee information");
          final items = (fees["items"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          final pending = items.where((i) => i["status"] != "PAID").toList();
          final paid = items.where((i) => i["status"] == "PAID").toList();
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(children: [
                    Expanded(child: Column(children: [
                      const Text("Total Due"),
                      Text("₹${fees["totalDue"] ?? 0}", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w300)),
                    ])),
                    Expanded(child: Column(children: [
                      const Text("Outstanding"),
                      Text("₹${fees["totalOutstanding"] ?? 0}",
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w300,
                              color: (fees["totalOutstanding"] as num? ?? 0) > 0 ? Colors.red : null)),
                    ])),
                  ]),
                ),
              ),
              const SizedBox(height: 16),
              if (pending.isNotEmpty) ...[
                const Text("Pending Dues", style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                for (final item in pending) ListTile(
                  title: Text(item["component"] as String? ?? ""),
                  subtitle: Text("Sem ${item["semester"] ?? ""} · Due ${item["dueDate"] ?? ""}"),
                  trailing: Text("₹${item["amount"] ?? 0}", style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
              ],
              if (paid.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text("Payment History", style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                for (final item in paid) ListTile(
                  leading: const Icon(Icons.check_circle, color: Colors.green),
                  title: Text(item["component"] as String? ?? ""),
                  subtitle: Text("Paid: ${item["paidDate"] ?? "—"}"),
                  trailing: Text("₹${item["amount"] ?? 0}"),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}
