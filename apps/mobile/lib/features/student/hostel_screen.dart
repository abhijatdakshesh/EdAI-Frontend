import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _hostelProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<Map<String, dynamic>>("/api/student/hostel");
  return res.data ?? {};
});

class HostelScreen extends ConsumerWidget {
  const HostelScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_hostelProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_hostelProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (data) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _InfoSection("Hostel", [
              ["Block", data["hostelBlock"] as String? ?? "—"],
              ["Room", data["roomNumber"] as String? ?? "—"],
              ["Floor", "${data["floor"] ?? "—"}"],
              ["Warden", data["warden"] as String? ?? "—"],
              ["Warden Phone", data["wardenPhone"] as String? ?? "—"],
            ]),
            const SizedBox(height: 16),
            _InfoSection("Transport", [
              ["Route", data["busRoute"] as String? ?? "—"],
              ["Stop", data["busStop"] as String? ?? "—"],
              ["Bus Number", data["busNumber"] as String? ?? "—"],
              ["Driver Phone", data["driverPhone"] as String? ?? "—"],
            ]),
          ],
        ),
      ),
    );
  }
}

class _InfoSection extends StatelessWidget {
  const _InfoSection(this.title, this.rows);
  final String title;
  final List<List<String>> rows;
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const Divider(),
            for (final row in rows)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    SizedBox(width: 120, child: Text(row[0], style: const TextStyle(color: Colors.grey))),
                    Text(row[1], style: const TextStyle(fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
