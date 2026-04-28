export type FeeRiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FeeRiskRow {
  feePaymentId: string;
  studentUsn: string;
  studentName: string;
  department: string;
  semester: number;
  parentPhone: string;
  language: string;
  feeType: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  dueDate: string;
  daysToDue: number;
  feeStatus: string;
  riskScore: number;
  riskLevel: FeeRiskLevel;
  historicalLateCount: number;
  historicalTotalFees: number;
  attendancePct: number;
}

export interface FeeDashboardSummary {
  totalOutstandingCount: number;
  totalOutstandingAmount: number;
  highRiskCount: number;
  highRiskAmount: number;
  mediumRiskCount: number;
  mediumRiskAmount: number;
  lowRiskCount: number;
  lowRiskAmount: number;
  overdueCount: number;
  overdueAmount: number;
  predictedAtRiskAmount: number;
}

export interface ReminderRecord {
  id: string;
  reminderType: string;
  channel: string;
  status: string;
  sentAt: string;
  notes?: string;
}

export const FEE_RISK_COLORS: Record<FeeRiskLevel, { bg: string; text: string; bar: string }> = {
  HIGH:   { bg: 'bg-[#F5E6E6]', text: 'text-[#8B2F2F]', bar: '#C0392B' },
  MEDIUM: { bg: 'bg-[#FFF3CD]', text: 'text-[#8B6914]', bar: '#E67E22' },
  LOW:    { bg: 'bg-[#EBF3EE]', text: 'text-[#3D6B4F]', bar: '#27AE60' },
};
