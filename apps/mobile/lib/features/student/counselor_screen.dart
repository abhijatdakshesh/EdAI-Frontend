import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _slotsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final now = DateTime.now();
  final from = "${now.year}-${now.month.toString().padLeft(2, "0")}-${now.day.toString().padLeft(2, "0")}";
  final toDate = now.add(const Duration(days: 14));
  final to = "${toDate.year}-${toDate.month.toString().padLeft(2, "0")}-${toDate.day.toString().padLeft(2, "0")}";
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/counselor/slots?from=$from&to=$to");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

final _mySessionsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/counselor/sessions/me");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class CounselorScreen extends ConsumerStatefulWidget {
  const CounselorScreen({super.key});
  @override
  ConsumerState<CounselorScreen> createState() => _CounselorScreenState();
}

class _CounselorScreenState extends ConsumerState<CounselorScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }
  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(controller: _tabs, tabs: const [
          Tab(text: "Book Session"),
          Tab(text: "My Sessions"),
        ]),
        Expanded(child: TabBarView(controller: _tabs, children: [
          _SlotsTab(ref: ref),
          _SessionsTab(),
        ])),
      ],
    );
  }
}

class _SlotsTab extends StatelessWidget {
  const _SlotsTab({required this.ref});
  final WidgetRef ref;
  @override
  Widget build(BuildContext context) {
    final async = ref.watch(_slotsProvider);
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => AppError(message: e.toString()),
      data: (slots) {
        final available = slots.where((s) => s["available"] == true).toList();
        if (available.isEmpty) return const AppEmpty(message: "No slots available in the next 14 days");
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: available.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, i) {
            final slot = available[i];
            return Card(
              child: ListTile(
                title: Text("${slot["date"] ?? ""} · ${slot["startTime"] ?? ""}–${slot["endTime"] ?? ""}"),
                subtitle: Text(slot["counselorName"] as String? ?? ""),
                trailing: FilledButton(
                  onPressed: () => _bookSlot(context, ref, slot["id"] as String? ?? ""),
                  child: const Text("Book"),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _bookSlot(BuildContext context, WidgetRef ref, String slotId) async {
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) {
        String r = "";
        return AlertDialog(
          title: const Text("Reason for booking"),
          content: TextField(
            onChanged: (v) => r = v,
            decoration: const InputDecoration(hintText: "e.g. Academic stress, career guidance"),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
            FilledButton(onPressed: () => Navigator.pop(ctx, r), child: const Text("Book")),
          ],
        );
      },
    );
    if (reason == null || reason.isEmpty) return;
    try {
      final dio = ref.read(dioProvider);
      await dio.post<dynamic>("/api/counselor/book", data: {"slotId": slotId, "reason": reason});
      ref.invalidate(_slotsProvider);
      ref.invalidate(_mySessionsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Session booked!")));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }
}

class _SessionsTab extends ConsumerWidget {
  const _SessionsTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_mySessionsProvider);
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => AppError(message: e.toString()),
      data: (sessions) => sessions.isEmpty
          ? const AppEmpty(message: "No counseling sessions booked yet")
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: sessions.length,
              itemBuilder: (_, i) {
                final s = sessions[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text("${s["date"] ?? ""} at ${s["startTime"] ?? ""}"),
                    subtitle: Text("${s["counselorName"] ?? ""} · ${s["reason"] ?? ""}"),
                    trailing: Chip(label: Text(s["status"] as String? ?? "")),
                  ),
                );
              },
            ),
    );
  }
}
