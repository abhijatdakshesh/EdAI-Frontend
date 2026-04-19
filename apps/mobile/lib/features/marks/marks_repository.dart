import "marks_models.dart";

class MarksRepository {
  Future<MarksDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    return MarksDashboard(
      updatedAt: DateTime.now(),
      flaggedSubmissions: 14,
      assessments: const [
        AssessmentItem(
          assessmentId: "ASM-ENG-2201",
          courseCode: "ENG2201",
          title: "Internal Assessment 2",
          maxMarks: 30,
          pendingVerification: 5,
        ),
        AssessmentItem(
          assessmentId: "ASM-MAT-1103",
          courseCode: "MAT1103",
          title: "Quiz Cycle",
          maxMarks: 20,
          pendingVerification: 9,
        ),
      ],
    );
  }
}
