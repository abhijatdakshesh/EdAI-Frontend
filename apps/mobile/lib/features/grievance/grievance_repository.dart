import "grievance_models.dart";

class GrievanceRepository {
  Future<GrievanceDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    return GrievanceDashboard(
      fetchedAt: DateTime.now(),
      openCount: 7,
      slaBreachCount: 2,
      cases: const [
        GrievanceCase(
          caseId: "GRV-5001",
          studentName: "A. Nair",
          category: "academic",
          priority: "high",
          status: "open",
          summary: "Grade discrepancy in ENG2201 Internal Assessment 2.",
          assignedOfficer: null,
          slaBreach: false,
        ),
        GrievanceCase(
          caseId: "GRV-5002",
          studentName: "M. Gowda",
          category: "infrastructure",
          priority: "medium",
          status: "assigned",
          summary: "Laboratory equipment non-functional for 2 weeks.",
          assignedOfficer: "Dr. S. Padma",
          slaBreach: true,
        ),
        GrievanceCase(
          caseId: "GRV-5003",
          studentName: "P. Ayesha",
          category: "financial",
          priority: "critical",
          status: "in_review",
          summary: "Scholarship disbursement not received despite approval.",
          assignedOfficer: "Dr. R. Venkat",
          slaBreach: false,
        ),
      ],
    );
  }
}
