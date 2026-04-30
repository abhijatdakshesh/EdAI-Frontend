export type ReportType = 'ATTENDANCE' | 'FEES' | 'MARKS' | 'PLACEMENT' | 'RISK';

export interface ReportParams {
  department?: string;
  semester?: number;
  section?: string;
  testChoice?: string;
  submissionDate?: string;
  note?: string;
}

export interface ReportPreset {
  type: ReportType;
  label: string;
  description: string;
  icon: string;
}

export interface ReportGeneration {
  id: string;
  reportType: ReportType;
  requestedBy: string;
  parameters: ReportParams | null;
  status: 'PENDING' | 'DONE' | 'FAILED';
  pdfSizeBytes: number | null;
  emailedTo: string[] | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}
