import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

class UploadResultsScreen extends ConsumerStatefulWidget {
  const UploadResultsScreen({super.key});
  @override
  ConsumerState<UploadResultsScreen> createState() => _UploadResultsScreenState();
}

class _UploadResultsScreenState extends ConsumerState<UploadResultsScreen> {
  final _subjectCtrl = TextEditingController();
  final _semCtrl = TextEditingController();
  bool _uploading = false;
  bool _done = false;

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _semCtrl.dispose();
    super.dispose();
  }

  Future<void> _upload() async {
    setState(() => _uploading = true);
    try {
      final dio = ref.read(dioProvider);
      await dio.post<dynamic>("/api/teacher/results/upload", data: {
        "subjectCode": _subjectCtrl.text.trim(),
        "semester": int.tryParse(_semCtrl.text.trim()) ?? 0,
      });
      setState(() => _done = true);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_done) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.check_circle, color: Colors.green, size: 64),
      const SizedBox(height: 16),
      const Text("Results Uploaded"),
      const SizedBox(height: 16),
      TextButton(onPressed: () => setState(() { _done = false; _subjectCtrl.clear(); _semCtrl.clear(); }), child: const Text("Upload Another")),
    ]));
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(children: [
        TextField(controller: _subjectCtrl, decoration: const InputDecoration(labelText: "Subject Code", border: OutlineInputBorder())),
        const SizedBox(height: 8),
        TextField(controller: _semCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: "Semester", border: OutlineInputBorder())),
        const SizedBox(height: 16),
        FilledButton.icon(
          icon: const Icon(Icons.upload),
          label: Text(_uploading ? "Uploading…" : "Upload Results"),
          onPressed: _uploading ? null : _upload,
        ),
        const SizedBox(height: 24),
        const Card(child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text("Instructions", style: TextStyle(fontWeight: FontWeight.w600)),
            SizedBox(height: 8),
            Text("• Marks should be entered in the IA Marks Entry screen first"),
            Text("• Submit your draft before using this upload trigger"),
            Text("• Results are synced with VTU portal after admin confirmation"),
          ]),
        )),
      ]),
    );
  }
}
