import "package:flutter/material.dart";

import "../../core/theme/raycraft_colors.dart";
import "placements_models.dart";
import "placements_repository.dart";

Color _statusColor(String status) {
  switch (status) {
    case "offered":
      return RaycraftColors.success;
    case "shortlisted":
      return RaycraftColors.info;
    case "applied":
      return RaycraftColors.warning;
    case "rejected":
      return RaycraftColors.danger;
    default:
      return RaycraftColors.textMuted;
  }
}

class PlacementsScreen extends StatefulWidget {
  const PlacementsScreen({super.key});

  @override
  State<PlacementsScreen> createState() => _PlacementsScreenState();
}

class _PlacementsScreenState extends State<PlacementsScreen> {
  final PlacementsRepository _repository = PlacementsRepository();
  PlacementsDashboard? _dashboard;
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
          Text("PLACEMENTS", style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 8),
          Text("Drive and Candidate Tracker", style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 4),
          if (data != null)
            Text(
              "${data.activeDrives} active drives • ${data.totalOffers} total offers",
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          const SizedBox(height: 12),
          if (_loading) const LinearProgressIndicator(),
          if (data != null) ...[
            Text("Active Drives", style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (final drive in data.drives)
              Card(
                child: ListTile(
                  title: Text("${drive.company} — ${drive.role}"),
                  subtitle: Text(
                    "₹${drive.ctcLpa} LPA • Applied ${drive.appliedCount} • Offers ${drive.offersCount} • ${drive.scheduledDate}",
                  ),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: drive.status == "active"
                          ? RaycraftColors.successLight
                          : RaycraftColors.surface2,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(drive.status, style: const TextStyle(fontSize: 11)),
                  ),
                ),
              ),
            const SizedBox(height: 12),
            Text("Candidate Status", style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (final c in data.candidates)
              Card(
                child: ListTile(
                  title: Text(c.studentName),
                  subtitle: Text("${c.company}${c.currentRound != null ? ' • Round: ${c.currentRound}' : ''}"),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _statusColor(c.status).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      c.status,
                      style: TextStyle(
                        fontSize: 11,
                        color: _statusColor(c.status),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}
