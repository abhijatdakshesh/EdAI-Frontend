import 'package:flutter/material.dart';
import '../../core/theme/raycraft_colors.dart';
import '../../core/theme/raycraft_text_styles.dart';
import 'assignments_models.dart';
import 'assignments_repository.dart';

class AssignmentsScreen extends StatefulWidget {
  const AssignmentsScreen({super.key});

  @override
  State<AssignmentsScreen> createState() => _AssignmentsScreenState();
}

class _AssignmentsScreenState extends State<AssignmentsScreen> {
  final _repo = AssignmentsRepository();
  AssignmentsDashboard? _dashboard;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _repo.getDashboard();
      setState(() { _dashboard = data; });
    } catch (e) {
      setState(() { _error = e.toString(); });
    } finally {
      setState(() { _loading = false; });
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'open': return RaycraftColors.info;
      case 'late': return RaycraftColors.warning;
      case 'missed': return RaycraftColors.error;
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
                  Text('Assignment Intelligence', style: RaycraftTextStyles.displaySm),
                  const SizedBox(height: 4),
                  if (_dashboard != null)
                    Text(
                      '${_dashboard!.openAssignments} open · ${_dashboard!.overdueCount} overdue',
                      style: RaycraftTextStyles.body.copyWith(color: RaycraftColors.textSecondary),
                    ),
                ],
              ),
            ),
          ),
          if (_loading)
            const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
          else if (_error != null)
            SliverFillRemaining(
              child: Center(child: Text(_error!, style: RaycraftTextStyles.body.copyWith(color: RaycraftColors.error))),
            )
          else if (_dashboard != null)
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final a = _dashboard!.assignments[index];
                  final completionPct = a.submittedCount / a.totalStudents;
                  final isPast = a.dueDate.isBefore(DateTime.now());
                  return Container(
                    margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: RaycraftColors.surface,
                      border: Border.all(color: RaycraftColors.border),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(a.courseCode,
                                style: RaycraftTextStyles.mono.copyWith(color: RaycraftColors.textMuted)),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: _statusColor(a.status).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(2),
                              ),
                              child: Text(a.status,
                                  style: RaycraftTextStyles.caption.copyWith(color: _statusColor(a.status))),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(a.title, style: RaycraftTextStyles.uiMd),
                        const SizedBox(height: 2),
                        Text(
                          'Due ${a.dueDate.toLocal().toString().substring(0, 10)}${isPast ? " (past due)" : ""} · '
                          '${a.submittedCount}/${a.totalStudents} submitted · ${a.missedCount} missed',
                          style: RaycraftTextStyles.body.copyWith(color: RaycraftColors.textSecondary),
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(2),
                          child: LinearProgressIndicator(
                            value: completionPct,
                            backgroundColor: RaycraftColors.border,
                            color: completionPct >= 0.8
                                ? RaycraftColors.success
                                : completionPct >= 0.5
                                    ? RaycraftColors.warning
                                    : RaycraftColors.error,
                            minHeight: 6,
                          ),
                        ),
                      ],
                    ),
                  );
                },
                childCount: _dashboard!.assignments.length,
              ),
            ),
        ],
      ),
    );
  }
}
