import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "../../core/api/dio_client.dart";
import "../../core/auth/auth_provider.dart";
import "../../core/router/app_router.dart";
import "../../shared/widgets/app_error.dart";

final _parentDashProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<Map<String, dynamic>>("/api/parent/dashboard");
  return res.data ?? {};
});

class ParentDashboardScreen extends ConsumerWidget {
  const ParentDashboardScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final async = ref.watch(_parentDashProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_parentDashProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString(), onRetry: () => ref.invalidate(_parentDashProvider)),
        data: (data) {
          final children = (data["children"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          final unread = data["totalUnreadNotifications"] as int? ?? 0;
          final pendingFee = data["pendingFeeAmount"] as num? ?? 0;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text("Welcome, ${session?.user.name ?? "Parent"}",
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w300)),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(child: Card(child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text("NOTIFICATIONS", style: TextStyle(fontSize: 10, letterSpacing: 1, color: Colors.grey)),
                    Text("$unread", style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w300, color: unread > 0 ? Colors.orange : null)),
                  ]),
                ))),
                const SizedBox(width: 8),
                Expanded(child: Card(child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text("PENDING FEES", style: TextStyle(fontSize: 10, letterSpacing: 1, color: Colors.grey)),
                    Text("₹${pendingFee.round()}", style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w300, color: pendingFee > 0 ? Colors.red : null)),
                  ]),
                ))),
              ]),
              const SizedBox(height: 24),
              Wrap(spacing: 8, runSpacing: 8, children: [
                ActionChip(avatar: const Icon(Icons.child_care_outlined, size: 18), label: const Text("Children"), onPressed: () => context.go(AppRoutes.parentChildren)),
                ActionChip(avatar: const Icon(Icons.check_circle_outline, size: 18), label: const Text("Attendance"), onPressed: () => context.go(AppRoutes.parentAttendance)),
                ActionChip(avatar: const Icon(Icons.grade_outlined, size: 18), label: const Text("Results"), onPressed: () => context.go(AppRoutes.parentResults)),
                ActionChip(avatar: const Icon(Icons.payment_outlined, size: 18), label: const Text("Fees"), onPressed: () => context.go(AppRoutes.parentFees)),
                ActionChip(avatar: const Icon(Icons.call_outlined, size: 18), label: const Text("Call History"), onPressed: () => context.go(AppRoutes.parentCalls)),
              ]),
              const SizedBox(height: 24),
              Text("Children", style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              for (final child in children) _ChildCard(child: child),
              if (children.isEmpty) const AppEmpty(message: "No children linked"),
            ],
          );
        },
      ),
    );
  }
}

class _ChildCard extends StatelessWidget {
  const _ChildCard({required this.child});
  final Map<String, dynamic> child;
  @override
  Widget build(BuildContext context) {
    final att = child["attendancePct"] as num?;
    final cgpa = child["cgpa"] as num?;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(child["name"] as String? ?? "", style: const TextStyle(fontWeight: FontWeight.w600)),
          Text("${child["usn"] ?? ""} · ${child["dept"] ?? ""} · Sem ${child["semester"] ?? ""}",
              style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 8),
          Row(children: [
            if (att != null) Chip(
              label: Text("Att: $att%"),
              backgroundColor: att >= 75 ? Colors.green.shade100 : Colors.red.shade100,
              padding: EdgeInsets.zero,
            ),
            if (att != null) const SizedBox(width: 8),
            if (cgpa != null) Chip(
              label: Text("CGPA: $cgpa"),
              padding: EdgeInsets.zero,
            ),
          ]),
        ]),
      ),
    );
  }
}
