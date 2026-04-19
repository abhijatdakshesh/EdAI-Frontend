import type { FeesDashboardResponse } from "./types";

export const mockFeesDashboard: FeesDashboardResponse = {
  generatedAt: new Date().toISOString(),
  totalDueAmount: 1824500,
  overdueCount: 27,
  dues: [
    {
      invoiceId: "INV-8821",
      studentName: "D. Karthik",
      program: "BTech CSE",
      dueAmount: 45000,
      dueDate: "2026-04-25",
      status: "due"
    },
    {
      invoiceId: "INV-8824",
      studentName: "P. Ayesha",
      program: "MBA",
      dueAmount: 30000,
      dueDate: "2026-04-19",
      status: "partially_paid"
    }
  ]
};
