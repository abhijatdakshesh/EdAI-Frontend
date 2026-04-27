export type DocType = 'BONAFIDE' | 'ATTENDANCE_CERT' | 'FEE_RECEIPT' | 'COURSE_COMPLETION';
export type DocStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export interface DocumentRequest {
  id: string;
  docNumber: string;
  studentUsn: string;
  studentName: string;
  docType: DocType;
  purpose: string;
  purposeDetail: string | null;
  status: DocStatus;
  aiBody: string | null;
  signedToken: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  expiresAt: string | null;
  consentGiven: boolean;
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  BONAFIDE: 'Bonafide Certificate',
  ATTENDANCE_CERT: 'Attendance Certificate',
  FEE_RECEIPT: 'Fee Receipt',
  COURSE_COMPLETION: 'Course Completion Certificate',
};

export const STATUS_COLORS: Record<DocStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  REVOKED: 'bg-gray-100 text-gray-600',
};

export const PURPOSE_OPTIONS = [
  'Bank loan',
  'Scholarship application',
  'Visa / travel',
  'Higher studies',
  'Government purpose',
  'Employment verification',
  'Other',
];
