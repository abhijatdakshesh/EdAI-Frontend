import "package:flutter/material.dart";

import "../../core/theme/raycraft_colors.dart";
import "mentorship_models.dart";
import "mentorship_repository.dart";

Color _riskColor(String risk) {
  switch (risk) {
    case "high":
      return RaycraftColors.danger;
    case "medium":
      return RaycraftColors.warning;
    default:
      return RaycraftColors.success;
  }
}

class MentorshipScreen extends StatefulWidget {
  const MentorshipScreen({super.key});

  @override
  State<MentorshipScreen> createState() => _MentorshipScreenState();
}

class _MentorshipScreenState extends State<MentorshipScreen> {
  final MentorshipRepository _repository = MentorshipRepository();
  MentorshipDashboard? _dashboard;
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

  void _logFollowUp(String studentId) {
    final current = _dashboard;
    if (current == null) return;
    setState(() => _busyIds.add(studentId));
    Future<void>.delayed(const Duration(milliseconds: 300)).then((_) {
      if (!mounted) return;
      setState(() {
        _busyIds.remove(studentId);
        _dashboard = MentorshipDashboard(
          fetchedAt: current.fetchedAt,
          totalMentors: current.totalMentors,
          overdueFollowUps: current.overdueFollowUps - 1,
          mentees: current.mentees
              .map((m) => m.studentId == studentId ? m.copyWith(followUpDue: false) : m)
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
          Text("MENTORSHIP", style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 8),
          Text("Mentor and Mentee Tracker", style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 4),
          if (data != null)
            Text(
              "${data.totalMentors} mentors • ${data.overdueFollowUps} overdue follow-ups",
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          const SizedBox(height: 12),
          if (_loading) const LinearProgressIndicator(),
          if (data != null)
            for (final m in data.mentees)
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                  side: BorderSide(
                    color: m.followUpDue ? RaycraftColors.warning : RaycraftColors.border,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(m.studentName, style: Theme.of(context).textTheme.titleSmall),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: _riskColor(m.riskLevel).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              "${m.riskLevel} risk",
                              style: TextStyle(
                                fontSize: 10,
                                color: _riskColor(m.riskLevel),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        "${m.program} • ${m.mentorName} • Sessions: ${m.sessionCount}",
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      Text(
                        "Last: ${m.lastSessionDate} — ${m.lastOutcome.replaceAll('_', ' ')}",
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      if (m.followUpDue) ...[
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: _busyIds.contains(m.studentId)
                                ? null
                                : () => _logFollowUp(m.studentId),
                            child: const Text("Log Follow-Up"),
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
