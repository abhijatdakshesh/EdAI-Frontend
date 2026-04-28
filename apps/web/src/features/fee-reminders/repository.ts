import { apiGet, apiPost } from '@/lib/api/client';
import { FeeRiskRow, FeeDashboardSummary, ReminderRecord } from './types';

const USE_MOCKS = process.env['NEXT_PUBLIC_USE_MOCKS'] === 'true';

const MOCK_SUMMARY: FeeDashboardSummary = {
  totalOutstandingCount: 148,
  totalOutstandingAmount: 4820000,
  highRiskCount: 23,
  highRiskAmount: 1240000,
  mediumRiskCount: 47,
  mediumRiskAmount: 1680000,
  lowRiskCount: 78,
  lowRiskAmount: 1900000,
  overdueCount: 12,
  overdueAmount: 580000,
  predictedAtRiskAmount: 1240000,
};

const MOCK_ROWS: FeeRiskRow[] = [
  { feePaymentId: 'f1', studentUsn: '1RV21CS042', studentName: 'Rahul Verma',  department: 'CSE', semester: 5, parentPhone: '+919876543210', language: 'kn', feeType: 'TUITION', amountDue: 95000, amountPaid: 0,     balance: 95000, dueDate: new Date(Date.now() - 3*86400000).toISOString(), daysToDue: -3, feeStatus: 'OVERDUE',  riskScore: 88, riskLevel: 'HIGH',   historicalLateCount: 3, historicalTotalFees: 4, attendancePct: 52.1 },
  { feePaymentId: 'f2', studentUsn: '1RV22ME007', studentName: 'Kiran Bhat',   department: 'ME',  semester: 3, parentPhone: '+919876543211', language: 'kn', feeType: 'TUITION', amountDue: 88000, amountPaid: 0,     balance: 88000, dueDate: new Date(Date.now() + 2*86400000).toISOString(), daysToDue: 2,  feeStatus: 'PENDING',  riskScore: 76, riskLevel: 'HIGH',   historicalLateCount: 2, historicalTotalFees: 3, attendancePct: 61.4 },
  { feePaymentId: 'f3', studentUsn: '1RV21EC033', studentName: 'Priya Nair',   department: 'ECE', semester: 5, parentPhone: '+919876543212', language: 'ta', feeType: 'TUITION', amountDue: 92000, amountPaid: 40000, balance: 52000, dueDate: new Date(Date.now() + 4*86400000).toISOString(), daysToDue: 4,  feeStatus: 'PARTIAL',  riskScore: 69, riskLevel: 'HIGH',   historicalLateCount: 2, historicalTotalFees: 4, attendancePct: 67.2 },
  { feePaymentId: 'f4', studentUsn: '1RV21CS088', studentName: 'Arjun Reddy',  department: 'CSE', semester: 5, parentPhone: '+919876543213', language: 'te', feeType: 'TUITION', amountDue: 95000, amountPaid: 20000, balance: 75000, dueDate: new Date(Date.now() + 7*86400000).toISOString(), daysToDue: 7,  feeStatus: 'PARTIAL',  riskScore: 55, riskLevel: 'MEDIUM', historicalLateCount: 1, historicalTotalFees: 3, attendancePct: 74.1 },
  { feePaymentId: 'f5', studentUsn: '1RV22CV014', studentName: 'Sneha Patil',  department: 'CV',  semester: 3, parentPhone: '+919876543214', language: 'kn', feeType: 'HOSTEL',  amountDue: 45000, amountPaid: 0,     balance: 45000, dueDate: new Date(Date.now() + 5*86400000).toISOString(), daysToDue: 5,  feeStatus: 'PENDING',  riskScore: 48, riskLevel: 'MEDIUM', historicalLateCount: 1, historicalTotalFees: 2, attendancePct: 78.5 },
  { feePaymentId: 'f6', studentUsn: '1RV21ISE021', studentName: 'Ravi Kumar',  department: 'ISE', semester: 5, parentPhone: '+919876543215', language: 'hi', feeType: 'TUITION', amountDue: 95000, amountPaid: 0,     balance: 95000, dueDate: new Date(Date.now() + 9*86400000).toISOString(), daysToDue: 9,  feeStatus: 'PENDING',  riskScore: 35, riskLevel: 'MEDIUM', historicalLateCount: 0, historicalTotalFees: 2, attendancePct: 82.0 },
  { feePaymentId: 'f7', studentUsn: '1RV22CS055', studentName: 'Divya Sharma', department: 'CSE', semester: 3, parentPhone: '+919876543216', language: 'en', feeType: 'TUITION', amountDue: 88000, amountPaid: 0,     balance: 88000, dueDate: new Date(Date.now() + 8*86400000).toISOString(), daysToDue: 8,  feeStatus: 'PENDING',  riskScore: 22, riskLevel: 'LOW',    historicalLateCount: 0, historicalTotalFees: 1, attendancePct: 89.3 },
];

const MOCK_HISTORY: ReminderRecord[] = [
  { id: 'r1', reminderType: 'WHATSAPP_10D', channel: 'WHATSAPP', status: 'DELIVERED', sentAt: new Date(Date.now() - 5*86400000).toISOString() },
  { id: 'r2', reminderType: 'CALL_5D',      channel: 'VOICE',    status: 'ANSWERED',  sentAt: new Date(Date.now() - 86400000).toISOString() },
];

export async function getFeeDashboardSummary(): Promise<FeeDashboardSummary> {
  if (USE_MOCKS) { await delay(400); return MOCK_SUMMARY; }
  try { return await apiGet<FeeDashboardSummary>('/fee-reminders/summary'); }
  catch { return MOCK_SUMMARY; }
}

export async function getOutstandingFees(filters: {
  riskLevel?: string;
  department?: string;
  overdueOnly?: boolean;
} = {}): Promise<FeeRiskRow[]> {
  if (USE_MOCKS) {
    await delay(500);
    return MOCK_ROWS.filter(r => {
      if (filters.riskLevel && r.riskLevel !== filters.riskLevel) return false;
      if (filters.department && r.department !== filters.department) return false;
      if (filters.overdueOnly && r.daysToDue >= 0) return false;
      return true;
    });
  }
  const p = new URLSearchParams();
  if (filters.riskLevel)   p.set('riskLevel', filters.riskLevel);
  if (filters.department)  p.set('department', filters.department);
  if (filters.overdueOnly) p.set('overdueOnly', 'true');
  try { return await apiGet<FeeRiskRow[]>(`/api/fee-reminders/outstanding?${p.toString()}`); }
  catch { return MOCK_ROWS; }
}

export async function getReminderHistory(feePaymentId: string): Promise<ReminderRecord[]> {
  if (USE_MOCKS) { return MOCK_HISTORY; }
  try { return await apiGet<ReminderRecord[]>(`/fee-reminders/${feePaymentId}/history`); }
  catch { return []; }
}

export async function triggerManualCall(feePaymentId: string): Promise<{ message: string }> {
  if (USE_MOCKS) {
    await delay(800);
    return { message: 'Call initiated successfully (mock)' };
  }
  return apiPost<{ message: string }>(`/fee-reminders/${feePaymentId}/call-now`, {});
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
