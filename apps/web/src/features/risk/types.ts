export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskScore {
  studentUsn: string;
  name: string;
  department: string;
  semester: number;
  section: string;
  riskScore: number;
  riskLevel: RiskLevel;
  attendancePct: number;
  failingSubjectCount: number;
  feeStatus: string;
  attTrendDelta: number;
  breakdown: {
    attendanceScore: number;
    marksScore: number;
    feeScore: number;
    trendScore: number;
  };
  computedAt: string;
}

export interface RiskSummary {
  department: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  avgRiskScore: number;
}

export const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; bar: string }> = {
  CRITICAL: { bg: 'bg-[#F5E6E6]', text: 'text-[#8B2F2F]', bar: '#C0392B' },
  HIGH:     { bg: 'bg-[#FFF3CD]', text: 'text-[#8B6914]', bar: '#E67E22' },
  MEDIUM:   { bg: 'bg-[#F5EDDB]', text: 'text-[#8B6914]', bar: '#F39C12' },
  LOW:      { bg: 'bg-[#EBF3EE]', text: 'text-[#3D6B4F]', bar: '#27AE60' },
};
