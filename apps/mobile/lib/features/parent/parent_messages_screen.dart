import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../core/auth/auth_provider.dart";
import "../../shared/widgets/app_error.dart";

final _messagesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final session = ref.read(sessionProvider);
  final parentId = session?.user.id ?? "";
  final res = await dio.get<List<dynamic>>("/api/parent-comms/messages?parentId=$parentId");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class ParentMessagesScreen extends ConsumerWidget {
  const ParentMessagesScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_messagesProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.edit),
        label: const Text("New Message"),
        onPressed: () {},
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_messagesProvider),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => AppError(message: e.toString()),
          data: (messages) => messages.isEmpty
              ? const AppEmpty(message: "No messages yet")
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (_, i) {
                    final m = messages[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(m["subject"] as String? ?? ""),
                        subtitle: Text("To: ${m["recipientName"] ?? ""} · ${m["createdAt"] ?? ""}"),
                        trailing: Chip(
                          label: Text(m["status"] as String? ?? ""),
                          padding: EdgeInsets.zero,
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
