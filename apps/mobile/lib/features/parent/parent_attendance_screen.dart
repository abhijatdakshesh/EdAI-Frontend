import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _parentAttProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  // Fetch first child's attendance; proper implementation uses child selector
  final childrenRes = await dio.get<List<dynamic>>("/api/parent/children");
  final children = (childrenRes.data ?? []).cast<Map<String, dynamic>>();
  if (children.isEmpty) return {"children": [], "attendance": []};
  final usn = children.first["usn"] as String? ?? "";
  final attRes = await dio.get<List<dynamic>>("/api/parent/children/$usn/attendance");
  return {"children": children, "attendance": attRes.data ?? [], "selectedUsn": usn};
});

class ParentAttendanceScreen extends ConsumerStatefulWidget {
  const ParentAttendanceScreen({super.key});
  @override
  ConsumerState<ParentAttendanceScreen> createState() => _ParentAttendanceScreenState();
}

class _ParentAttendanceScreenState extends ConsumerState<ParentAttendanceScreen> {
  String _selectedUsn = "";

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(_parentAttProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_parentAttProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(message: e.toString()),
        data: (data) {
          final children = (data["children"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          final attendance = (data["attendance"] as List?)?.cast<Map<String, dynamic>>() ?? [];
          if (_selectedUsn.isEmpty && children.isNotEmpty) {
            _selectedUsn = children.first["usn"] as String? ?? "";
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (children.length > 1) DropdownButtonFormField<String>(
                value: _selectedUsn.isEmpty ? null : _selectedUsn,
                items: children.map((c) => DropdownMenuItem(
                  value: c["usn"] as String?,
                  child: Text(c["name"] as String? ?? ""),
                )).toList(),
                onChanged: (v) => setState(() => _selectedUsn = v ?? ""),
                decoration: const InputDecoration(labelText: "Select Child", border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              for (final att in attendance) _AttCard(att: att),
              if (attendance.isEmpty) const AppEmpty(message: "No attendance data"),
            ],
          );
        },
      ),
    );
  }
}

class _AttCard extends StatelessWidget {
  const _AttCard({required this.att});
  final Map<String, dynamic> att;
  @override
  Widget build(BuildContext context) {
    final pct = (att["pct"] as num? ?? 0).toDouble();
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(att["courseName"] as String? ?? "", style: const TextStyle(fontWeight: FontWeight.w500))),
            Text("${pct.round()}%", style: TextStyle(color: pct >= 75 ? Colors.green : Colors.red)),
          ]),
          const SizedBox(height: 4),
          LinearProgressIndicator(value: pct / 100, color: pct >= 75 ? Colors.green : Colors.red),
          const SizedBox(height: 4),
          Text("${att["attended"] ?? 0}/${att["totalClasses"] ?? 0} classes",
              style: const TextStyle(fontSize: 12, color: Colors.grey)),
          if ((att["mustAttend"] as int? ?? 0) > 0)
            Text("Need ${att["mustAttend"]} more to reach 75%",
                style: const TextStyle(fontSize: 12, color: Colors.red)),
        ]),
      ),
    );
  }
}
