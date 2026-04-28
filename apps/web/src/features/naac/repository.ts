import { apiClient } from '@/lib/api/client';
import type { NaacDashboard, SsrParagraph } from './types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

const MOCK_DASHBOARD: NaacDashboard = {
  institution: { name: 'RV Institute of Technology and Management', shortName: 'RVITM' },
  predictedCgpa: 3.18,
  predictedGrade: 'A',
  targetGrade: 'A+',
  cgpaGapToNextGrade: 0.08,
  autoPopulatedMetrics: 9,
  manualMetricsRequired: 5,
  criteria: [
    {
      criterionId: 'C1', criterionName: 'Curricular Aspects',
      weightage: 100, maxScore: 40, earnedScore: 30.0, scorePercent: 75.0, cgpaContribution: 3.00,
      metrics: [],
    },
    {
      criterionId: 'C2', criterionName: 'Teaching-Learning and Evaluation',
      weightage: 350, maxScore: 120, earnedScore: 96.4, scorePercent: 80.3, cgpaContribution: 3.21,
      metrics: [
        {
          metricId: '2.1.1', metricName: 'Student Enrolment Rate',
          description: 'Percentage of students enrolled against sanctioned intake',
          maxScore: 20, earnedScore: 16, scorePercent: 80, status: 'AUTO',
          data: { enrolled: 412, sanctioned_intake: 480, enrollment_pct: 85.8 },
          evidenceColumns: ['Programme', 'Sanctioned Intake', 'Students Enrolled', 'Enrolment %'],
          evidenceRows: [],
        },
        {
          metricId: '2.2.1', metricName: 'Student-Full time Teacher Ratio',
          description: 'Student to faculty ratio',
          maxScore: 20, earnedScore: 20, scorePercent: 100, status: 'AUTO',
          data: { students: 412, faculty: 28, ratio: 14.7 },
          evidenceColumns: ['Year', 'Total Students', 'Full-time Faculty', 'Ratio'],
          evidenceRows: [],
        },
        {
          metricId: '2.4.1', metricName: 'Full-time teachers with PhD',
          description: 'Percentage with doctoral qualification',
          maxScore: 20, earnedScore: null, scorePercent: null, status: 'MANUAL_REQUIRED',
          data: null, evidenceColumns: [], evidenceRows: [],
        },
        {
          metricId: '2.5.1', metricName: 'Internal Assessment Mechanism',
          description: 'IA coverage across subjects and students',
          maxScore: 20, earnedScore: null, scorePercent: null, status: 'AUTO',
          data: { students_assessed: 398, subjects_assessed: 36, avg_score_pct: 72.3, total_assessments: 1847 },
          evidenceColumns: ['Test Type', 'Subjects', 'Students', 'Avg Score %'],
          evidenceRows: [],
        },
        {
          metricId: '2.6.3', metricName: 'Pass Percentage',
          description: 'Final year university exam pass %',
          maxScore: 40, earnedScore: null, scorePercent: null, status: 'MANUAL_REQUIRED',
          data: null, evidenceColumns: [], evidenceRows: [],
        },
      ],
    },
    {
      criterionId: 'C3', criterionName: 'Research, Innovations and Extension',
      weightage: 120, maxScore: 40, earnedScore: 28.0, scorePercent: 70.0, cgpaContribution: 2.80,
      metrics: [],
    },
    {
      criterionId: 'C4', criterionName: 'Infrastructure and Learning Resources',
      weightage: 100, maxScore: 20, earnedScore: 16.0, scorePercent: 80.0, cgpaContribution: 3.20,
      metrics: [],
    },
    {
      criterionId: 'C5', criterionName: 'Student Support and Progression',
      weightage: 130, maxScore: 100, earnedScore: 78.2, scorePercent: 78.2, cgpaContribution: 3.13,
      metrics: [
        {
          metricId: '5.1.3', metricName: 'Student-Parent Engagement',
          description: 'Parent outreach via voice calls',
          maxScore: 20, earnedScore: 16, scorePercent: 80, status: 'AUTO',
          data: { students_contacted: 89, total: 412, engagement_pct: 21.6, total_calls: 134, answered_calls: 97 },
          evidenceColumns: [], evidenceRows: [],
          edaiNote: 'Voice calls to parents serve as documented parent-engagement evidence for this metric',
        },
      ],
    },
    {
      criterionId: 'C6', criterionName: 'Governance, Leadership and Management',
      weightage: 100, maxScore: 80, earnedScore: 66.0, scorePercent: 82.5, cgpaContribution: 3.30,
      metrics: [
        {
          metricId: '6.2.2', metricName: 'E-Governance Implementation',
          description: 'Digital governance across all modules',
          maxScore: 40, earnedScore: null, scorePercent: null, status: 'AUTO',
          data: { digital_docs_issued: 342, automated_calls: 134, digital_payments: 289 },
          evidenceColumns: [], evidenceRows: [],
          edaiNote: 'EdAI itself is the e-governance evidence — document generation, voice calls, fee tracking all count toward this metric',
        },
      ],
    },
    {
      criterionId: 'C7', criterionName: 'Institutional Values and Best Practices',
      weightage: 50, maxScore: 40, earnedScore: 30.0, scorePercent: 75.0, cgpaContribution: 3.00,
      metrics: [],
    },
  ],
  computedAt: new Date().toISOString(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBackendDashboard(raw: any): NaacDashboard {
  return {
    institution: { name: raw.institution?.name ?? '', shortName: raw.institution?.shortName ?? '' },
    predictedCgpa: raw.predictedCgpa ?? 0,
    predictedGrade: raw.predictedGrade ?? 'D',
    targetGrade: raw.targetGrade ?? '',
    cgpaGapToNextGrade: raw.cgpaGapToNextGrade ?? 0,
    autoPopulatedMetrics: raw.summary?.autoMetrics ?? 0,
    manualMetricsRequired: raw.summary?.manualMetrics ?? 0,
    computedAt: raw.computedAt ?? new Date().toISOString(),
    criteria: (raw.criteria ?? []).map((c: any) => ({
      criterionId: c.id,
      criterionName: c.name,
      weightage: c.weightage,
      maxScore: c.maxScore,
      earnedScore: c.earnedScore,
      scorePercent: c.maxScore > 0 ? Math.round((c.earnedScore / c.maxScore) * 1000) / 10 : 0,
      cgpaContribution: c.weightedScore ?? 0,
      metrics: (c.metrics ?? []).map((m: any) => ({
        metricId: m.id,
        metricName: m.name,
        description: m.description ?? '',
        maxScore: m.maxScore,
        earnedScore: m.earnedScore,
        scorePercent: m.maxScore > 0 && m.earnedScore != null ? Math.round((m.earnedScore / m.maxScore) * 1000) / 10 : null,
        status: m.status === 'OK' ? 'AUTO' : m.status === 'MANUAL' ? 'MANUAL_REQUIRED' : 'AUTO',
        data: m.liveData ?? null,
        evidenceColumns: [],
        evidenceRows: [],
        edaiNote: m.edaiNote,
      })),
    })),
  };
}

export async function getNaacDashboard(): Promise<NaacDashboard> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 800));
    return MOCK_DASHBOARD;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await apiClient.get<any>('/api/naac/dashboard');
    return mapBackendDashboard(raw);
  } catch {
    return MOCK_DASHBOARD;
  }
}

export async function generateSsrParagraph(criterionId: string): Promise<SsrParagraph> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 3000));
    return {
      criterionId,
      criterionName: 'Teaching-Learning and Evaluation',
      paragraph: `RV Institute of Technology and Management has consistently demonstrated its commitment to high-quality teaching and learning through structured, data-driven academic processes. The institution maintains a student-teacher ratio of 14.7:1, ensuring personalised attention and effective knowledge transfer across all programmes. During the academic year 2025-26, the institution assessed 398 students across 36 subjects through its three-tier internal assessment system (IA1, IA2, and IA3), achieving an average assessment score of 72.3%. The student enrolment rate stands at 85.8% against a sanctioned intake of 480, reflecting the institution's sustained demand and academic reputation. RVITM's integrated digital management system enables transparent, real-time tracking of student performance, facilitating early intervention for academically at-risk students. The institution remains committed to further strengthening its teaching-learning ecosystem through faculty development programmes, curriculum revision aligned with NEP 2020, and expanded use of outcome-based education methodologies.`,
      dataPointsUsed: ['Student Enrolment Rate', 'Student-Teacher Ratio', 'Internal Assessment Mechanism'],
      wordCount: 142,
      generatedAt: new Date().toISOString(),
    };
  }
  return apiClient.post<SsrParagraph>(`/api/naac/ssr/${criterionId}`, {});
}
