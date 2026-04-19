import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _staffProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/institution/staff");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class HrStaffScreen extends ConsumerWidget {
  const HrStaffScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_staffProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_staffProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (staff) => staff.isEmpty
            ? const AppEmpty(message: "No staff directory available")
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: staff.length,
                itemBuilder: (_, i) {
                  final s = staff[i];
                  return ListTile(
                    leading: CircleAvatar(child: Text((s["name"] as String? ?? "?")[0].toUpperCase())),
                    title: Text(s["name"] as String? ?? ""),
                    subtitle: Text("${s["role"] ?? ""} · ${s["department"] ?? ""}"),
                    trailing: s["phone"] != null
                        ? IconButton(icon: const Icon(Icons.phone_outlined), onPressed: () {})
                        : null,
                  );
                },
              ),
      ),
    );
  }
}
