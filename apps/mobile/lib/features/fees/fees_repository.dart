import "fees_models.dart";

class FeesRepository {
  Future<FeesDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    return FeesDashboard(
      generatedAt: DateTime.now(),
      totalDueAmount: 1824500,
      overdueCount: 27,
      invoices: const [
        FeeInvoice(
          invoiceId: "INV-8821",
          studentName: "D. Karthik",
          program: "BTech CSE",
          dueAmount: 45000,
          status: "due",
        ),
        FeeInvoice(
          invoiceId: "INV-8824",
          studentName: "P. Ayesha",
          program: "MBA",
          dueAmount: 30000,
          status: "partially_paid",
        ),
      ],
    );
  }
}
