import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";

class BulkImportScreen extends ConsumerStatefulWidget {
  const BulkImportScreen({super.key});
  @override
  ConsumerState<BulkImportScreen> createState() => _BulkImportScreenState();
}

class _BulkImportScreenState extends ConsumerState<BulkImportScreen> {
  String _type = "STUDENT";
  bool _processing = false;
  String? _result;

  Future<void> _startImport() async {
    setState(() { _processing = true; _result = null; });
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.post<Map<String, dynamic>>("/api/admin/bulk-import/trigger", data: {"type": _type});
      setState(() => _result = "Import completed: ${(res.data ?? {})["imported"] ?? 0} records");
    } catch (e) {
      setState(() => _result = "Error: $e");
    } finally {
      setState(() => _processing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text("Bulk Import", style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 24),
          DropdownButtonFormField<String>(
            value: _type,
            items: const [
              DropdownMenuItem(value: "STUDENT", child: Text("Students")),
              DropdownMenuItem(value: "FACULTY", child: Text("Faculty")),
              DropdownMenuItem(value: "CLASS", child: Text("Classes")),
              DropdownMenuItem(value: "COURSE", child: Text("Courses")),
            ],
            onChanged: (v) => setState(() => _type = v ?? _type),
            decoration: const InputDecoration(labelText: "Import Type", border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          const Card(child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text("Instructions", style: TextStyle(fontWeight: FontWeight.w600)),
              SizedBox(height: 8),
              Text("• Upload CSV files via the web portal"),
              Text("• Use this to trigger pending imports"),
              Text("• Duplicates are skipped automatically"),
            ]),
          )),
          const SizedBox(height: 16),
          FilledButton.icon(
            icon: const Icon(Icons.upload_file),
            label: Text(_processing ? "Processing…" : "Trigger Import"),
            onPressed: _processing ? null : _startImport,
          ),
          if (_result != null) ...[
            const SizedBox(height: 16),
            Card(
              color: _result!.startsWith("Error") ? Colors.red.shade50 : Colors.green.shade50,
              child: Padding(padding: const EdgeInsets.all(12), child: Text(_result!)),
            ),
          ],
        ],
      ),
    );
  }
}
