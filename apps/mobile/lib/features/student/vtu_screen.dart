import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

final _activeWindowProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  try {
    final dio = ref.read(dioProvider);
    final res = await dio.get<Map<String, dynamic>>("/api/vtu/windows/active");
    return res.data;
  } catch (_) {
    return null;
  }
});

final _vtuStatusProvider = FutureProvider.autoDispose.family<Map<String, dynamic>?, String>((ref, windowId) async {
  if (windowId.isEmpty) return null;
  final dio = ref.read(dioProvider);
  final res = await dio.get<Map<String, dynamic>>("/api/vtu/student/status?windowId=$windowId");
  return res.data;
});

class StudentVtuScreen extends ConsumerStatefulWidget {
  const StudentVtuScreen({super.key});
  @override
  ConsumerState<StudentVtuScreen> createState() => _StudentVtuScreenState();
}

class _StudentVtuScreenState extends ConsumerState<StudentVtuScreen> {
  final Set<String> _selected = {};
  bool _submitting = false;

  @override
  Widget build(BuildContext context) {
    final windowAsync = ref.watch(_activeWindowProvider);

    return windowAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => AppError(message: e.toString()),
      data: (window) {
        if (window == null) {
          return const AppEmpty(message: "No VTU registration window is currently open");
        }
        final windowId = window["id"] as String? ?? "";
        final statusAsync = ref.watch(_vtuStatusProvider(windowId));
        return statusAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => AppError(message: e.toString()),
          data: (status) => _buildBody(context, window, status),
        );
      },
    );
  }

  Widget _buildBody(BuildContext context, Map<String, dynamic> window, Map<String, dynamic>? status) {
    final windowId = window["id"] as String? ?? "";
    final statusStr = status?["status"] as String? ?? "NOT_STARTED";
    final eligible = (status?["eligibleSubjects"] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final ineligible = (status?["ineligibleSubjects"] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final alreadyDone = ["REGISTERED", "SUBMITTED", "CONFIRMED"].contains(statusStr);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          color: Colors.blue.shade50,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(window["title"] as String? ?? "", style: const TextStyle(fontWeight: FontWeight.w600)),
              Text("Closes: ${window["closeDate"] ?? ""}", style: const TextStyle(fontSize: 12)),
            ]),
          ),
        ),
        const SizedBox(height: 16),
        if (alreadyDone) ...[
          Card(
            color: Colors.green.shade50,
            child: ListTile(
              leading: const Icon(Icons.check_circle, color: Colors.green),
              title: Text("Status: $statusStr"),
              subtitle: const Text("Your registration has been recorded"),
            ),
          ),
        ] else ...[
          if (eligible.isNotEmpty) ...[
            Text("Eligible Subjects (${eligible.length})",
                style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.green)),
            const SizedBox(height: 8),
            for (final s in eligible) CheckboxListTile(
              title: Text(s["subjectName"] as String? ?? ""),
              subtitle: Text("${s["subjectCode"] ?? ""} · ${s["attendancePct"] ?? 0}%"),
              value: _selected.contains(s["subjectId"]),
              onChanged: (v) => setState(() {
                if (v == true) _selected.add(s["subjectId"] as String? ?? "");
                else _selected.remove(s["subjectId"]);
              }),
            ),
          ],
          if (ineligible.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text("Ineligible Subjects (${ineligible.length})",
                style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.red)),
            const SizedBox(height: 8),
            for (final s in ineligible) ListTile(
              leading: const Icon(Icons.cancel_outlined, color: Colors.red),
              title: Text(s["subjectName"] as String? ?? "",
                  style: const TextStyle(color: Colors.grey)),
              subtitle: Text((s["reasons"] as List?)?.cast<String>().join(", ") ?? ""),
            ),
          ],
          if (_selected.isNotEmpty) ...[
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _submitting ? null : () => _register(context, windowId),
              child: _submitting
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text("Register ${_selected.length} Subject${_selected.length > 1 ? "s" : ""}"),
            ),
          ],
        ],
      ],
    );
  }

  Future<void> _register(BuildContext context, String windowId) async {
    setState(() => _submitting = true);
    try {
      final dio = ref.read(dioProvider);
      await dio.post<dynamic>("/api/vtu/student/register",
          data: {"windowId": windowId, "subjectIds": _selected.toList()});
      ref.invalidate(_vtuStatusProvider(windowId));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Registration submitted!")));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      setState(() => _submitting = false);
    }
  }
}
