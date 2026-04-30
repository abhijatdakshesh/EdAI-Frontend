export interface StudentPlacementProfile {
  usn: string;
  name: string;
  department: string;
  semester: number;
  cgpa: number;
  attendancePct: number;
  backlogs: number;
  readinessScore: number;
  placementStatus: 'PLACEMENT_READY' | 'NEEDS_COACHING' | 'HIGH_RISK';
  scoreBreakdown: {
    cgpaPts: number;
    attendancePts: number;
    backlogPts: number;
    trendPts: number;
    semesterPts: number;
  };
}

export interface CompanyMatch {
  companyName: string;
  roleOffered: string;
  ctcLpa: number;
  companyType: string;
  fitScore: number;
  predictionPct: number;
  claudeRationale: string;
  status: string;
  driveDate: string | null;
  requiredSkills: string[];
}

export interface DepartmentSummary {
  department: string;
  semester: number;
  total: number;
  ready: number;
  coaching: number;
  highRisk: number;
  avgScore: number;
  avgCgpa: number;
}

export const STATUS_STYLE = {
  PLACEMENT_READY: { label: 'Placement Ready', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  NEEDS_COACHING:  { label: 'Needs Coaching',  bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  HIGH_RISK:       { label: 'High Risk',        bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
} as const;

export const COMPANY_TYPES = ['PRODUCT', 'SERVICE', 'STARTUP', 'CORE'] as const;
export type CompanyType = typeof COMPANY_TYPES[number];

export const MOCK_PROFILE: StudentPlacementProfile = {
  usn: '1RV21CS047', name: 'Priya Sharma', department: 'Computer Science',
  semester: 7, cgpa: 8.4, attendancePct: 87, backlogs: 0,
  readinessScore: 81, placementStatus: 'PLACEMENT_READY',
  scoreBreakdown: { cgpaPts: 28, attendancePts: 18, backlogPts: 20, trendPts: 5, semesterPts: 10 },
};

export const MOCK_MATCHES: CompanyMatch[] = [
  { companyName: 'Infosys', roleOffered: 'Systems Engineer', ctcLpa: 3.6, companyType: 'SERVICE',
    fitScore: 88, predictionPct: 75, claudeRationale: 'Strong CGPA and attendance exceed Infosys requirements.',
    status: 'ELIGIBLE', driveDate: '2026-05-15', requiredSkills: ['Java', 'SQL', 'Communication'] },
  { companyName: 'Wipro', roleOffered: 'Project Engineer', ctcLpa: 3.5, companyType: 'SERVICE',
    fitScore: 85, predictionPct: 70, claudeRationale: 'Well-rounded profile, consistent performer.',
    status: 'ELIGIBLE', driveDate: '2026-05-20', requiredSkills: ['Python', 'SQL'] },
  { companyName: 'Zoho', roleOffered: 'Junior Developer', ctcLpa: 5.0, companyType: 'PRODUCT',
    fitScore: 72, predictionPct: 55, claudeRationale: 'CGPA is strong. Needs DSA preparation to compete.',
    status: 'ELIGIBLE', driveDate: '2026-06-01', requiredSkills: ['DSA', 'Problem Solving', 'C++'] },
];
