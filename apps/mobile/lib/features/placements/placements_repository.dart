import "placements_models.dart";

class PlacementsRepository {
  Future<PlacementsDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return PlacementsDashboard(
      refreshedAt: DateTime.now(),
      activeDrives: 3,
      totalOffers: 142,
      drives: const [
        PlacementDrive(
          driveId: "DRV-2041",
          company: "Infosys",
          role: "Systems Engineer",
          ctcLpa: 6.5,
          appliedCount: 312,
          offersCount: 52,
          status: "active",
          scheduledDate: "2026-04-22",
        ),
        PlacementDrive(
          driveId: "DRV-2043",
          company: "Amazon",
          role: "SDE-1",
          ctcLpa: 24,
          appliedCount: 87,
          offersCount: 8,
          status: "active",
          scheduledDate: "2026-04-28",
        ),
      ],
      candidates: const [
        PlacementCandidate(
          studentId: "STU3390",
          studentName: "S. Priya",
          company: "Infosys",
          status: "shortlisted",
          currentRound: "technical",
        ),
        PlacementCandidate(
          studentId: "STU2288",
          studentName: "D. Karthik",
          company: "Amazon",
          status: "offered",
          currentRound: null,
        ),
      ],
    );
  }
}
