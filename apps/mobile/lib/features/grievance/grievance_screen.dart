import "package:flutter/material.dart";

import "../../core/theme/raycraft_colors.dart";
import "grievance_models.dart";
import "grievance_repository.dart";

Color _priorityColor(String priority) {
  switch (priority) {
    case "critical":
      return RaycraftColors.danger;
    case "high":
      return RaycraftColors.warning;
    case "medium":
      return RaycraftColors.info;
    default:
      return RaycraftColors.textMuted;
  }
}

const _nextStatus = <String, String>{
  "open": "assigned",
  "assigned": "in_review",
  "in_review": "resolved",
};

class GrievanceScreen extends StatefulWidget {
  const GrievanceScreen({super.key});

  @override
  State<GrievanceScreen> createState() => _GrievanceScreenState();
}

class _GrievanceScreenState extends State<GrievanceScreen> {
  final GrievanceRepository _repository = GrievanceRepository();
  GrievanceDashboard? _dashboard;
  bool _loading = true;
  final Set<String> _busyIds = {};

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

  void _advance(String caseId, String currentStatus) {
    final next = _nextStatus[currentStatus];
    if (next == null) return;
    final current = _dashboard;
    if (current == null) return;
    setState(() => _busyIds.add(caseId));
    Future<void>.delayed(const Duration(milliseconds: 300)).then((_) {
      if (!mounted) return;
      setState(() {
        _busyIds.remove(caseId);
        _dashboard = GrievanceDashboard(
          fetchedAt: current.fetchedAt,
          openCount: next == "resolved" ? current.openCount - 1 : current.openCount,
          slaBreachCount: current.slaBreachCount,
          cases: current.cases
              .map((c) => c.caseId == caseId ? c.copyWith(status: next) : c)
              .toList(),
        );
      });
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
          Text("GRIEVANCE", style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 8),
          Text("Case Management", style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 4),
          if (data != null)
            Text(
              "${data.openCount} open • ${data.slaBreachCount} SLA breaches",
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          const SizedBox(height: 12),
          if (_loading) const LinearProgressIndicator(),
          if (data != null)
            for (final c in data.cases)
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                  side: BorderSide(
                    color: c.slaBreach ? RaycraftColors.danger : RaycraftColors.border,
                    width: c.slaBreach ? 2 : 1,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            c.caseId,
                            style: const TextStyle(
                              fontFamily: "JetBrains Mono",
                              fontSize: 11,
                              color: RaycraftColors.textMuted,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: _priorityColor(c.priority).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              c.priority,
                              style: TextStyle(
                                fontSize: 10,
                                color: _priorityColor(c.priority),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          if (c.slaBreach) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: RaycraftColors.dangerLight,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                "SLA breached",
                                style: TextStyle(
                                  fontSize: 10,
                                  color: RaycraftColors.danger,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(c.studentName, style: Theme.of(context).textTheme.titleSmall),
                      Text(c.summary, style: Theme.of(context).textTheme.bodyMedium),
                      Text(
                        "${c.category} • ${c.assignedOfficer ?? 'Unassigned'} • ${c.status.replaceAll('_', ' ')}",
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      if (_nextStatus.containsKey(c.status)) ...[
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: _busyIds.contains(c.caseId)
                                ? null
                                : () => _advance(c.caseId, c.status),
                            child: Text("Advance → ${_nextStatus[c.status]!.replaceAll('_', ' ')}"),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
        ],
      ),
    );
  }
}
