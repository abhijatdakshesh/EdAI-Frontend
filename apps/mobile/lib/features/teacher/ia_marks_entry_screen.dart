import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../shared/widgets/app_error.dart";

class IaMarksEntryScreen extends ConsumerStatefulWidget {
  const IaMarksEntryScreen({super.key});
  @override
  ConsumerState<IaMarksEntryScreen> createState() => _IaMarksEntryScreenState();
}

class _IaMarksEntryScreenState extends ConsumerState<IaMarksEntryScreen> {
  final _subjectCtrl = TextEditingController(text: "");
  bool _loaded = false;
  bool _loading = false;
  bool _saving = false;
  bool _submitting = false;
  bool _done = false;
  List<Map<String, dynamic>> _rows = [];
  final Map<String, TextEditingController> _ia1 = {};
  final Map<String, TextEditingController> _ia2 = {};

  @override
  void dispose() {
    _subjectCtrl.dispose();
    for (final c in [..._ia1.values, ..._ia2.values]) c.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final subjectId = _subjectCtrl.text.trim();
    if (subjectId.isEmpty) return;
    setState(() => _loading = true);
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get<List<dynamic>>("/api/ia/teacher/marks?subjectId=$subjectId");
      final rows = (res.data ?? []).cast<Map<String, dynamic>>();
      for (final r in rows) {
        final usn = r["studentUsn"] as String? ?? "";
        _ia1[usn] = TextEditingController(text: r["ia1"] != null ? "${r["ia1"]}" : "");
        _ia2[usn] = TextEditingController(text: r["ia2"] != null ? "${r["ia2"]}" : "");
      }
      setState(() { _rows = rows; _loaded = true; });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final dio = ref.read(dioProvider);
      final entries = _rows.map((r) {
        final usn = r["studentUsn"] as String? ?? "";
        return {"studentUsn": usn, "studentName": r["studentName"], "ia1": int.tryParse(_ia1[usn]?.text ?? ""), "ia2": int.tryParse(_ia2[usn]?.text ?? "")};
      }).toList();
      await dio.post<dynamic>("/api/ia/teacher/marks", data: {"subjectId": _subjectCtrl.text.trim(), "entries": entries});
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Draft saved")));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _saving = false);
    }
  }

  Future<void> _submit() async {
    final confirm = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text("Submit for Review?"),
      content: const Text("IA marks will be sent to admin for confirmation."),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Cancel")),
        FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text("Submit")),
      ],
    ));
    if (confirm != true) return;
    setState(() => _submitting = true);
    try {
      final dio = ref.read(dioProvider);
      await dio.post<dynamic>("/api/ia/teacher/marks/${_subjectCtrl.text.trim()}/submit");
      setState(() => _done = true);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_done) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.check_circle, color: Colors.green, size: 64),
        const SizedBox(height: 16),
        const Text("IA Marks Submitted", style: TextStyle(fontSize: 18)),
        const SizedBox(height: 16),
        TextButton(onPressed: () => setState(() { _done = false; _loaded = false; _rows = []; }), child: const Text("Enter Another")),
      ]));
    }
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(children: [
        Row(children: [
          Expanded(child: TextField(
            controller: _subjectCtrl,
            decoration: const InputDecoration(labelText: "Subject Code (e.g. 21CS61)", border: OutlineInputBorder()),
          )),
          const SizedBox(width: 8),
          FilledButton(onPressed: _loading ? null : _load, child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text("Load")),
        ]),
        if (!_loaded) const Expanded(child: Center(child: Text("Enter a subject code and tap Load"))),
        if (_loaded) ...[
          const SizedBox(height: 8),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text("${_rows.length} students"),
            Row(children: [
              TextButton(onPressed: _saving ? null : _save, child: Text(_saving ? "Saving…" : "Save Draft")),
              const SizedBox(width: 8),
              FilledButton(onPressed: _submitting ? null : _submit, child: Text(_submitting ? "Submitting…" : "Submit")),
            ]),
          ]),
          Expanded(child: ListView.separated(
            itemCount: _rows.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final r = _rows[i];
              final usn = r["studentUsn"] as String? ?? "";
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(r["studentName"] as String? ?? "", style: const TextStyle(fontWeight: FontWeight.w500)),
                    Text(usn, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  ])),
                  SizedBox(width: 64, child: TextField(
                    controller: _ia1[usn],
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: "IA1", border: OutlineInputBorder(), isDense: true),
                  )),
                  const SizedBox(width: 8),
                  SizedBox(width: 64, child: TextField(
                    controller: _ia2[usn],
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: "IA2", border: OutlineInputBorder(), isDense: true),
                  )),
                ]),
              );
            },
          )),
        ],
      ]),
    );
  }
}
