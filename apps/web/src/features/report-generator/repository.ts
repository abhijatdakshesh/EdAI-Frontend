import type { ReportType, ReportParams, ReportGeneration, ReportPreset } from './types';

export const REPORT_PRESETS: ReportPreset[] = [
  { type: 'ATTENDANCE', label: 'Semester Attendance Report', description: 'Per-student attendance + marks PDF sent to parents', icon: 'ClipboardList' },
  { type: 'FEES', label: 'Fee Collection Summary', description: 'Outstanding balances and payment status', icon: 'IndianRupee' },
  { type: 'MARKS', label: 'Internal Assessment Report', description: 'CIE marks summary across subjects', icon: 'BookOpen' },
  { type: 'PLACEMENT', label: 'Placement Statistics', description: 'Offers, packages, and company-wise breakdown', icon: 'Briefcase' },
  { type: 'RISK', label: 'Student Risk Summary', description: 'HIGH/CRITICAL risk students for counsellor review', icon: 'AlertTriangle' },
];

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Science & Engineering',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Master of Computer Applications',
];

export const TEST_CHOICES = ['CIE-1', 'CIE-2', 'CIE-3'];

export async function generateReport(
  reportType: ReportType,
  params: ReportParams,
): Promise<Blob> {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportType, params }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(err.error ?? err.message ?? `Request failed: ${res.status}`);
  }

  return res.blob();
}

export async function getHistory(): Promise<ReportGeneration[]> {
  const res = await fetch('/api/reports?all=false');
  if (!res.ok) throw new Error(`Failed to load history: ${res.status}`);
  return res.json() as Promise<ReportGeneration[]>;
}
