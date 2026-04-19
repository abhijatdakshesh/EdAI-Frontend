import "package:flutter/material.dart";

import "../../core/theme/raycraft_text_styles.dart";
import "attendance_models.dart";
import "attendance_repository.dart";

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  final AttendanceRepository _repository = AttendanceRepository();
  AttendanceDashboard? _dashboard;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      setState(() {
        _loading = true;
        _error = null;
      });
      final data = await _repository.getDashboard();
      if (!mounted) return;
      setState(() => _dashboard = data);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = "Failed to load attendance data");
    } finally {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = _dashboard;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text("ATTENDANCE", style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 8),
          Text("Attendance Intelligence", style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 12),
          if (_loading) const LinearProgressIndicator(),
          if (_error != null) ...[
            Text(_error!, style: RaycraftTextStyles.bodySm.copyWith(color: Colors.red.shade700)),
            const SizedBox(height: 12),
          ],
          if (data != null) ...[
            Text(
              "Last synced: ${data.syncedAt.toLocal()}",
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            for (final campus in data.campuses)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(campus.campusName, style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      Text(
                        "Present ${campus.presentCount}/${campus.totalStudents} • Absent ${campus.absenteeCount} • At Risk ${campus.atRiskCount}",
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 12),
            Text("Escalation Alerts", style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (final alert in data.alerts)
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text("${alert.studentName} (${alert.campusName})"),
                subtitle: Text("${alert.streakAbsentDays} day absence streak"),
                trailing: Text(alert.guardianNotified ? "Notified" : "Pending"),
              ),
          ],
        ],
      ),
    );
  }
}
