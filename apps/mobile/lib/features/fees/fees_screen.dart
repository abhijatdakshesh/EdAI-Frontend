import "package:flutter/material.dart";

import "fees_models.dart";
import "fees_repository.dart";

class FeesScreen extends StatefulWidget {
  const FeesScreen({super.key});

  @override
  State<FeesScreen> createState() => _FeesScreenState();
}

class _FeesScreenState extends State<FeesScreen> {
  final FeesRepository _repository = FeesRepository();
  FeesDashboard? _dashboard;
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

  String _inr(int value) {
    return "INR ${value.toString()}";
  }

  @override
  Widget build(BuildContext context) {
    final data = _dashboard;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text("FEES", style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 8),
          Text("Fees and Aid", style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 12),
          if (_loading) const LinearProgressIndicator(),
          if (data != null) ...[
            Text(
              "Total due ${_inr(data.totalDueAmount)} • Overdue ${data.overdueCount}",
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 12),
            for (final invoice in data.invoices)
              Card(
                child: ListTile(
                  title: Text(invoice.studentName),
                  subtitle: Text("${invoice.program} • ${_inr(invoice.dueAmount)}"),
                  trailing: TextButton(
                    onPressed: invoice.status == "paid" ? null : () {},
                    child: Text(invoice.status == "paid" ? "Paid" : "Collect"),
                  ),
                ),
              ),
          ]
        ],
      ),
    );
  }
}
