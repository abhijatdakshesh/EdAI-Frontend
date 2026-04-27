import { apiClient } from '@/lib/api/client';
import { RiskScore, RiskSummary } from './types';

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? 'true') === 'true';

const MOCK_STUDENTS: RiskScore[] = [
  { studentUsn: '1RV21CS042',  name: 'Rahul Verma',    department: 'CSE', semester: 5, section: 'A', riskScore: 89, riskLevel: 'CRITICAL', attendancePct: 41.2, failingSubjectCount: 3, feeStatus: 'OVERDUE',  attTrendDelta: -18, breakdown: { attendanceScore: 45, marksScore: 36, feeScore: 20, trendScore: 12 }, computedAt: new Date().toISOString() },
  { studentUsn: '1RV22ME007',  name: 'Kiran Bhat',     department: 'ME',  semester: 3, section: 'B', riskScore: 83, riskLevel: 'CRITICAL', attendancePct: 47.8, failingSubjectCount: 2, feeStatus: 'OVERDUE',  attTrendDelta: -8,  breakdown: { attendanceScore: 45, marksScore: 24, feeScore: 20, trendScore: 6  }, computedAt: new Date().toISOString() },
  { studentUsn: '1RV21EC033',  name: 'Priya Nair',     department: 'ECE', semester: 5, section: 'A', riskScore: 77, riskLevel: 'CRITICAL', attendancePct: 53.1, failingSubjectCount: 2, feeStatus: 'PARTIAL',  attTrendDelta: -20, breakdown: { attendanceScore: 35, marksScore: 24, feeScore: 10, trendScore: 12 }, computedAt: new Date().toISOString() },
  { studentUsn: '1RV21CS088',  name: 'Arjun Reddy',    department: 'CSE', semester: 5, section: 'B', riskScore: 71, riskLevel: 'HIGH',     attendancePct: 58.6, failingSubjectCount: 2, feeStatus: 'PENDING',  attTrendDelta: -6,  breakdown: { attendanceScore: 35, marksScore: 24, feeScore: 5,  trendScore: 6  }, computedAt: new Date().toISOString() },
  { studentUsn: '1RV22CV014',  name: 'Sneha Patil',    department: 'CV',  semester: 3, section: 'A', riskScore: 68, riskLevel: 'HIGH',     attendancePct: 62.4, failingSubjectCount: 1, feeStatus: 'OVERDUE',  attTrendDelta: -2,  breakdown: { attendanceScore: 20, marksScore: 12, feeScore: 20, trendScore: 0  }, computedAt: new Date().toISOString() },
  { studentUsn: '1RV21ISE021', name: 'Ravi Kumar',     department: 'ISE', semester: 5, section: 'A', riskScore: 61, riskLevel: 'HIGH',     attendancePct: 67.0, failingSubjectCount: 2, feeStatus: 'PAID',     attTrendDelta: -16, breakdown: { attendanceScore: 20, marksScore: 24, feeScore: 0,  trendScore: 12 }, computedAt: new Date().toISOString() },
  { studentUsn: '1RV22CS055',  name: 'Divya Sharma',   department: 'CSE', semester: 3, section: 'C', riskScore: 55, riskLevel: 'HIGH',     attendancePct: 70.3, failingSubjectCount: 1, feeStatus: 'PARTIAL',  attTrendDelta: -8,  breakdown: { attendanceScore: 20, marksScore: 12, feeScore: 10, trendScore: 6  }, computedAt: new Date().toISOString() },
  { studentUsn: '1RV21EEE009', name: 'Suresh Hegde',   department: 'EEE', semester: 5, section: 'A', riskScore: 48, riskLevel: 'MEDIUM',   attendancePct: 74.1, failingSubjectCount: 1, feeStatus: 'PENDING',  attTrendDelta: -4,  breakdown: { attendanceScore: 20, marksScore: 12, feeScore: 5,  trendScore: 0  }, computedAt: new Date().toISOString() },
  { studentUsn: '1RV21CS014',  name: 'Mohammed Rafi',  department: 'CSE', semester: 5, section: 'A', riskScore: 41, riskLevel: 'MEDIUM',   attendancePct: 77.8, failingSubjectCount: 2, feeStatus: 'PAID',     attTrendDelta: -2,  breakdown: { attendanceScore: 8,  marksScore: 24, feeScore: 0,  trendScore: 0  }, computedAt: new Date().toISOString() },
  { studentUsn: '1RV22ME033',  name: 'Ananya Gowda',   department: 'ME',  semester: 3, section: 'A', riskScore: 28, riskLevel: 'MEDIUM',   attendancePct: 79.5, failingSubjectCount: 1, feeStatus: 'PARTIAL',  attTrendDelta: 2,   breakdown: { attendanceScore: 8,  marksScore: 12, feeScore: 10, trendScore: 0  }, computedAt: new Date().toISOString() },
];

const MOCK_SUMMARY: RiskSummary[] = [
  { department: 'CSE', total: 320, critical: 8,  high: 22, medium: 45, low: 245, avgRiskScore: 28.4 },
  { department: 'ME',  total: 180, critical: 6,  high: 15, medium: 38, low: 121, avgRiskScore: 26.1 },
  { department: 'ECE', total: 240, critical: 5,  high: 18, medium: 41, low: 176, avgRiskScore: 24.7 },
  { department: 'CV',  total: 120, critical: 3,  high: 9,  medium: 22, low: 86,  avgRiskScore: 22.3 },
  { department: 'ISE', total: 160, critical: 4,  high: 11, medium: 29, low: 116, avgRiskScore: 21.8 },
  { department: 'EEE', total: 140, critical: 2,  high: 8,  medium: 26, low: 104, avgRiskScore: 20.1 },
];

export async function getAtRiskStudents(filters: {
  department?: string;
  semester?: number;
  riskLevel?: string;
  minScore?: number;
}): Promise<RiskScore[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 500));
    return MOCK_STUDENTS.filter(s => {
      if (filters.department && s.department !== filters.department) return false;
      if (filters.semester && s.semester !== filters.semester) return false;
      if (filters.riskLevel && s.riskLevel !== filters.riskLevel) return false;
      if (filters.minScore && s.riskScore < filters.minScore) return false;
      return true;
    });
  }
  const params = new URLSearchParams();
  if (filters.department) params.set('department', filters.department);
  if (filters.semester) params.set('semester', String(filters.semester));
  if (filters.riskLevel) params.set('riskLevel', filters.riskLevel);
  if (filters.minScore) params.set('minScore', String(filters.minScore));
  try {
    return await apiClient.get<RiskScore[]>(`/risk/students?${params.toString()}`);
  } catch {
    return MOCK_STUDENTS;
  }
}

export async function getRiskSummary(): Promise<RiskSummary[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300));
    return MOCK_SUMMARY;
  }
  try {
    return await apiClient.get<RiskSummary[]>('/risk/summary');
  } catch {
    return MOCK_SUMMARY;
  }
}
