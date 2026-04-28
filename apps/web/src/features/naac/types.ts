export interface MetricResult {
  metricId: string;
  metricName: string;
  description: string;
  maxScore: number;
  earnedScore: number | null;
  scorePercent: number | null;
  status: 'AUTO' | 'MANUAL_REQUIRED' | 'ERROR';
  data: Record<string, unknown> | null;
  evidenceColumns: string[];
  evidenceRows: Record<string, unknown>[];
  edaiNote?: string;
}

export interface CriterionResult {
  criterionId: string;
  criterionName: string;
  weightage: number;
  maxScore: number;
  earnedScore: number;
  scorePercent: number;
  cgpaContribution: number;
  metrics: MetricResult[];
}

export interface NaacDashboard {
  institution: Record<string, unknown>;
  predictedCgpa: number;
  predictedGrade: string;
  targetGrade: string;
  cgpaGapToNextGrade: number;
  autoPopulatedMetrics: number;
  manualMetricsRequired: number;
  criteria: CriterionResult[];
  computedAt: string;
}

export interface SsrParagraph {
  criterionId: string;
  criterionName: string;
  paragraph: string;
  dataPointsUsed?: string[];
  wordCount?: number;
  generatedAt: string;
}

export const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'A++': { bg: '#EBF3EE', text: '#1D4A2F', border: '#3D6B4F' },
  'A+':  { bg: '#E6F0EE', text: '#1D4A2F', border: '#3D7A5F' },
  'A':   { bg: '#E6EEF5', text: '#1D3A5A', border: '#2F567A' },
  'B++': { bg: '#FFF3CD', text: '#5A3A00', border: '#8B6914' },
  'B+':  { bg: '#F5EDDB', text: '#5A3A00', border: '#9B7924' },
  'B':   { bg: '#F5E6E6', text: '#5A1A1A', border: '#8B2F2F' },
  'C':   { bg: '#F0EDE8', text: '#3D3530', border: '#A89F94' },
  'D':   { bg: '#F5E6E6', text: '#5A1A1A', border: '#8B2F2F' },
};
