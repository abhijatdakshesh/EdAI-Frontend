import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../../core/api/dio_client.dart";
import "../../../shared/widgets/app_error.dart";

final _classesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<List<dynamic>>("/api/teacher/classes");
  return (res.data ?? []).cast<Map<String, dynamic>>();
});

class MarkAttendanceScreen extends ConsumerStatefulWidget {
  const MarkAttendanceScreen({super.key});
  @override
  ConsumerState<MarkAttendanceScreen> createState() => _MarkAttendanceScreenState();
}

class _MarkAttendanceScreenState extends ConsumerState<MarkAttendanceScreen> {
  String? _selectedClassId;
  List<Map<String, dynamic>> _students = [];
  Map<String, String> _attendance = {}; // usn -> P/A/L
  bool _loading = false;
  bool _submitting = false;

  Future<void> _loadStudents(String classId) async {
    setState(() => _loading = true);
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get<List<dynamic>>("/api/teacher/classes/$classId/students");
      final students = (res.data ?? []).cast<Map<String, dynamic>>();
      setState(() {
        _students = students;
        _attendance = {for (final s in students) s["usn"] as String: "P"};
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _submitAttendance() async {
    if (_selectedClassId == null) return;
    setState(() => _submitting = true);
    try {
      final dio = ref.read(dioProvider);
      await dio.post<void>("/api/attendance", data: {
        "classId": _selectedClassId,
        "date": DateTime.now().toIso8601String().split("T").first,
        "records": _attendance.entries.map((e) => {"usn": e.key, "status": e.value}).toList(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Attendance submitted!")));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final classesAsync = ref.watch(_classesProvider);
    return Column(children: [
      Padding(
        padding: const EdgeInsets.all(16),
        child: classesAsync.when(
          loading: () => const LinearProgressIndicator(),
          error: (e, _) => AppError(message: e.toString()),
          data: (classes) => DropdownButtonFormField<String>(
            value: _selectedClassId,
            decoration: const InputDecoration(labelText: "Select Class", border: OutlineInputBorder()),
            items: classes.map((c) => DropdownMenuItem(
              value: c["id"] as String,
              child: Text("${c["name"] ?? ""} – ${c["subject"] ?? ""}"),
            )).toList(),
            onChanged: (v) {
              setState(() => _selectedClassId = v);
              if (v != null) _loadStudents(v);
            },
          ),
        ),
      ),
      if (_loading) const LinearProgressIndicator(),
      Expanded(
        child: _students.isEmpty
            ? const Center(child: Text("Select a class to mark attendance"))
            : ListView.builder(
                itemCount: _students.length,
                itemBuilder: (_, i) {
                  final s = _students[i];
                  final usn = s["usn"] as String;
                  return ListTile(
                    title: Text(s["name"] as String? ?? ""),
                    subtitle: Text(usn),
                    trailing: SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: "P", label: Text("P")),
                        ButtonSegment(value: "A", label: Text("A")),
                        ButtonSegment(value: "L", label: Text("L")),
                      ],
                      selected: {_attendance[usn] ?? "P"},
                      onSelectionChanged: (v) => setState(() => _attendance[usn] = v.first),
                    ),
                  );
                },
              ),
      ),
      if (_students.isNotEmpty)
        Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton.icon(
            onPressed: _submitting ? null : _submitAttendance,
            icon: _submitting ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.check),
            label: const Text("Submit Attendance"),
          ),
        ),
    ]);
  }
}
