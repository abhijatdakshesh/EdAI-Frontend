import 'package:flutter/material.dart';
import '../../core/theme/raycraft_colors.dart';
import '../../core/theme/raycraft_text_styles.dart';
import 'behavior_models.dart';
import 'behavior_repository.dart';

class BehaviorScreen extends StatefulWidget {
  const BehaviorScreen({super.key});

  @override
  State<BehaviorScreen> createState() => _BehaviorScreenState();
}

class _BehaviorScreenState extends State<BehaviorScreen> {
  final _repo = BehaviorRepository();
  BehaviorDashboard? _dashboard;
  bool _loading = true;
  String? _busyId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; });
    try {
      final data = await _repo.getDashboard();
      setState(() { _dashboard = data; });
    } finally {
      setState(() { _loading = false; });
    }
  }

  Future<void> _advance(BehaviorIncident inc) async {
    final nextMap = {
      'open': 'under_investigation',
      'under_investigation': 'action_taken',
      'action_taken': 'closed',
    };
    final next = nextMap[inc.status];
    if (next == null) return;
    setState(() { _busyId = inc.incidentId; });
    await Future<void>.delayed(const Duration(milliseconds: 600));
    setState(() {
      _busyId = null;
      if (_dashboard == null) return;
      _dashboard = BehaviorDashboard(
        refreshedAt: _dashboard!.refreshedAt,
        openIncidents: _dashboard!.openIncidents,
        criticalIncidents: _dashboard!.criticalIncidents,
        repeatOffenders: _dashboard!.repeatOffenders,
        incidents: _dashboard!.incidents
            .map((i) => i.incidentId == inc.incidentId ? i.copyWith(status: next) : i)
            .toList(),
      );
    });
  }

  Color _severityColor(String severity) {
    switch (severity) {
      case 'critical': return RaycraftColors.error;
      case 'high': return const Color(0xFF8B2F2F);
      case 'medium': return RaycraftColors.warning;
      default: return RaycraftColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      color: RaycraftColors.espresso,
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Behavioral Intelligence', style: RaycraftTextStyles.displaySm),
                  if (_dashboard != null)
                    Text(
                      '${_dashboard!.openIncidents} open · ${_dashboard!.criticalIncidents} critical · ${_dashboard!.repeatOffenders} repeat offenders',
                      style: RaycraftTextStyles.body.copyWith(color: RaycraftColors.textSecondary),
                    ),
                ],
              ),
            ),
          ),
          if (_loading)
            const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
          else if (_dashboard != null)
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, index) {
                  final inc = _dashboard!.incidents[index];
                  final nextMap = {
                    'open': 'Investigate',
                    'under_investigation': 'Take Action',
                    'action_taken': 'Close',
                  };
                  final nextLabel = nextMap[inc.status];
                  final isBusy = _busyId == inc.incidentId;
                  return Container(
                    margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    decoration: BoxDecoration(
                      color: RaycraftColors.surface,
                      border: Border(
                        left: BorderSide(color: _severityColor(inc.severity), width: 3),
                        right: BorderSide(color: RaycraftColors.border),
                        top: BorderSide(color: RaycraftColors.border),
                        bottom: BorderSide(color: RaycraftColors.border),
                      ),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: _severityColor(inc.severity).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(2),
                              ),
                              child: Text(inc.severity,
                                  style: RaycraftTextStyles.caption.copyWith(
                                      color: _severityColor(inc.severity))),
                            ),
                            const SizedBox(width: 6),
                            Text(inc.status.replaceAll('_', ' '),
                                style: RaycraftTextStyles.caption.copyWith(
                                    color: RaycraftColors.textMuted)),
                            if (inc.isRepeatOffender) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: RaycraftColors.error,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                                child: Text('Repeat',
                                    style: RaycraftTextStyles.caption
                                        .copyWith(color: Colors.white)),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text('${inc.studentName} · ${inc.className}',
                            style: RaycraftTextStyles.uiMd),
                        Text(
                          '${inc.category.replaceAll("_", " ")} · ${inc.reportedBy}',
                          style: RaycraftTextStyles.body.copyWith(color: RaycraftColors.textSecondary),
                        ),
                        const SizedBox(height: 4),
                        Text(inc.description, style: RaycraftTextStyles.body),
                        if (nextLabel != null) ...[
                          const SizedBox(height: 8),
                          Align(
                            alignment: Alignment.centerRight,
                            child: isBusy
                                ? const SizedBox(
                                    width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                : OutlinedButton(
                                    onPressed: () => _advance(inc),
                                    child: Text(nextLabel),
                                  ),
                          ),
                        ],
                      ],
                    ),
                  );
                },
                childCount: _dashboard!.incidents.length,
              ),
            ),
        ],
      ),
    );
  }
}
