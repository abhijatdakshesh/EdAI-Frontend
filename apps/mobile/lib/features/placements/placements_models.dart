class PlacementDrive {
  const PlacementDrive({
    required this.driveId,
    required this.company,
    required this.role,
    required this.ctcLpa,
    required this.appliedCount,
    required this.offersCount,
    required this.status,
    required this.scheduledDate,
  });

  final String driveId;
  final String company;
  final String role;
  final double ctcLpa;
  final int appliedCount;
  final int offersCount;
  final String status;
  final String scheduledDate;
}

class PlacementCandidate {
  const PlacementCandidate({
    required this.studentId,
    required this.studentName,
    required this.company,
    required this.status,
    required this.currentRound,
  });

  final String studentId;
  final String studentName;
  final String company;
  final String status;
  final String? currentRound;

  PlacementCandidate copyWith({String? status}) {
    return PlacementCandidate(
      studentId: studentId,
      studentName: studentName,
      company: company,
      status: status ?? this.status,
      currentRound: currentRound,
    );
  }
}

class PlacementsDashboard {
  const PlacementsDashboard({
    required this.refreshedAt,
    required this.activeDrives,
    required this.totalOffers,
    required this.drives,
    required this.candidates,
  });

  final DateTime refreshedAt;
  final int activeDrives;
  final int totalOffers;
  final List<PlacementDrive> drives;
  final List<PlacementCandidate> candidates;
}
