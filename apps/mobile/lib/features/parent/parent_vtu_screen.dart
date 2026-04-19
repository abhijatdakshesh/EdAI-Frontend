import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

class ParentVtuScreen extends ConsumerWidget {
  const ParentVtuScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _loadData(ref),
      builder: (_, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) return AppError(message: snap.error.toString());
        final data = snap.data ?? {};
        final status = data["status"] as Map<String, dynamic>? ?? {};
        final statusStr = status["status"] as String? ?? "NOT_STARTED";
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: ListTile(
                title: Text(data["windowTitle"] as String? ?? "No Active Window"),
                subtitle: Text("Status: $statusStr"),
                trailing: Chip(label: Text(statusStr.replaceAll("_", " "))),
              ),
            ),
            const SizedBox(height: 16),
            const Text("Eligible Subjects", style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            for (final s in (status["eligibleSubjects"] as List?)?.cast<Map<String, dynamic>>() ?? [])
              ListTile(
                leading: const Icon(Icons.check_circle_outline, color: Colors.green),
                title: Text(s["subjectName"] as String? ?? ""),
                subtitle: Text("${s["subjectCode"] ?? ""} · ${s["attendancePct"] ?? 0}%"),
                dense: true,
              ),
          ],
        );
      },
    );
  }

  Future<Map<String, dynamic>> _loadData(WidgetRef ref) async {
    final dio = ref.read(dioProvider);
    try {
      final windowRes = await dio.get<Map<String, dynamic>>("/api/vtu/windows/active");
      final window = windowRes.data;
      if (window == null) return {"windowTitle": null};
      final childrenRes = await dio.get<List<dynamic>>("/api/parent/children");
      final children = (childrenRes.data ?? []).cast<Map<String, dynamic>>();
      if (children.isEmpty) return {"windowTitle": window["title"]};
      final usn = children.first["usn"] as String? ?? "";
      final statusRes = await dio.get<Map<String, dynamic>>("/api/parent/children/$usn/vtu-status?windowId=${window["id"]}");
      return {"windowTitle": window["title"], "status": statusRes.data};
    } catch (_) {
      return {};
    }
  }
}
