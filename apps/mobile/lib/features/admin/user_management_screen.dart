import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _usersProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<Map<String, dynamic>>("/api/users?limit=50");
  return res.data ?? {"data": [], "total": 0};
});

class UserManagementScreen extends ConsumerWidget {
  const UserManagementScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_usersProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_usersProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (result) {
          final users = (result["data"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: users.length,
            separatorBuilder: (_, __) => const SizedBox(height: 6),
            itemBuilder: (_, i) {
              final u = users[i];
              final active = u["isActive"] as bool? ?? true;
              return Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: active ? Colors.green.shade100 : Colors.grey.shade200,
                    child: Text((u["name"] as String? ?? "?")[0].toUpperCase()),
                  ),
                  title: Text(u["name"] as String? ?? ""),
                  subtitle: Text("${u["email"] ?? ""} · ${u["role"] ?? ""}"),
                  trailing: Switch(value: active, onChanged: (_) => _toggleStatus(context, ref, u)),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _toggleStatus(BuildContext ctx, WidgetRef ref, Map<String, dynamic> user) async {
    try {
      final dio = ref.read(dioProvider);
      await dio.patch<dynamic>("/api/users/${user["id"]}/status", data: {"isActive": !(user["isActive"] as bool? ?? true)});
      ref.invalidate(_usersProvider);
    } catch (e) {
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }
}
