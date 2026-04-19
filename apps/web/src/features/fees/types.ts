export interface FeeDueItem {
  invoiceId: string;
  studentName: string;
  program: string;
  dueAmount: number;
  dueDate: string;
  status: "due" | "partially_paid" | "paid";
}

export interface FeesDashboardResponse {
  generatedAt: string;
  totalDueAmount: number;
  overdueCount: number;
  dues: FeeDueItem[];
}
