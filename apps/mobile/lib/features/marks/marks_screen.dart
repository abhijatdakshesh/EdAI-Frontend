import "package:flutter/material.dart";

import "marks_models.dart";
import "marks_repository.dart";

class MarksScreen extends StatefulWidget {
  const MarksScreen({super.key});

  @override
  State<MarksScreen> createState() => _MarksScreenState();
}

class _MarksScreenState extends State<MarksScreen> {
  final MarksRepository _repository = MarksRepository();
  MarksDashboard? _dashboard;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await _repository.getDashboard();
    if (!mounted) return;
    setState(() {
      _dashboard = data;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final data = _dashboard;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text("MARKS", style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 8),
          Text("Assessment Verification", style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 12),
          if (_loading) const LinearProgressIndicator(),
          if (data != null) ...[
            Text(
              "Flagged submissions: ${data.flaggedSubmissions}",
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 10),
            for (final item in data.assessments)
              Card(
                child: ListTile(
                  title: Text(item.title),
                  subtitle: Text(
                    "${item.courseCode} • Max ${item.maxMarks} • Pending ${item.pendingVerification}",
                  ),
                  trailing: TextButton(onPressed: () {}, child: const Text("Verify")),
                ),
              ),
          ]
        ],
      ),
    );
  }
}
