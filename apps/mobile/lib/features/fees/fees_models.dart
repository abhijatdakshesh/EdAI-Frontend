class FeeInvoice {
  const FeeInvoice({
    required this.invoiceId,
    required this.studentName,
    required this.program,
    required this.dueAmount,
    required this.status,
  });

  final String invoiceId;
  final String studentName;
  final String program;
  final int dueAmount;
  final String status;
}

class FeesDashboard {
  const FeesDashboard({
    required this.generatedAt,
    required this.totalDueAmount,
    required this.overdueCount,
    required this.invoices,
  });

  final DateTime generatedAt;
  final int totalDueAmount;
  final int overdueCount;
  final List<FeeInvoice> invoices;
}
