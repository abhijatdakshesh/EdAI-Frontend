import {
  getMyDocuments as apiGetMyDocuments,
  requestDocument as apiRequestDocument,
  getPendingDocuments as apiGetPending,
  approveDocument as apiApprove,
  rejectDocument as apiReject,
  revokeDocument as apiRevoke,
  RequestDocumentPayload,
} from '@/lib/api/documents';
import { DocumentRequest, DocType, DocStatus } from './types';

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? 'true') === 'true';

const MOCK_DOCS: DocumentRequest[] = [
  {
    id: 'doc-mock-1',
    docNumber: 'DOC-1001',
    studentUsn: '1RV21CS042',
    studentName: 'Rahul Verma',
    docType: 'BONAFIDE' as DocType,
    purpose: 'Bank loan',
    purposeDetail: 'Education loan from SBI',
    status: 'APPROVED' as DocStatus,
    aiBody: 'This is to certify that Rahul Verma bearing USN 1RV21CS042 is a bonafide student...',
    signedToken: 'mock-token-abc',
    requestedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000).toISOString(),
    reviewedBy: 'admin@rvce.edu',
    rejectionReason: null,
    expiresAt: new Date(Date.now() + 86400000 * 87).toISOString(),
    consentGiven: true,
  },
  {
    id: 'doc-mock-2',
    docNumber: 'DOC-1002',
    studentUsn: '1RV21CS042',
    studentName: 'Rahul Verma',
    docType: 'ATTENDANCE_CERT' as DocType,
    purpose: 'Scholarship application',
    purposeDetail: null,
    status: 'PENDING' as DocStatus,
    aiBody: null,
    signedToken: null,
    requestedAt: new Date(Date.now() - 3600000).toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    expiresAt: null,
    consentGiven: true,
  },
];

const MOCK_PENDING: DocumentRequest[] = [
  {
    id: 'doc-mock-2',
    docNumber: 'DOC-1002',
    studentUsn: '1RV21CS042',
    studentName: 'Rahul Verma',
    docType: 'ATTENDANCE_CERT' as DocType,
    purpose: 'Scholarship application',
    purposeDetail: null,
    status: 'PENDING' as DocStatus,
    aiBody: null,
    signedToken: null,
    requestedAt: new Date(Date.now() - 3600000).toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    expiresAt: null,
    consentGiven: true,
  },
  {
    id: 'doc-mock-3',
    docNumber: 'DOC-1003',
    studentUsn: '1RV22ME007',
    studentName: 'Kiran Bhat',
    docType: 'BONAFIDE' as DocType,
    purpose: 'Bank loan',
    purposeDetail: 'Personal loan for laptop',
    status: 'PENDING' as DocStatus,
    aiBody: null,
    signedToken: null,
    requestedAt: new Date(Date.now() - 7200000).toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    expiresAt: null,
    consentGiven: true,
  },
];

export async function getMyDocuments(): Promise<DocumentRequest[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400));
    return MOCK_DOCS;
  }
  try { return await apiGetMyDocuments(); } catch { return MOCK_DOCS; }
}

export async function requestDocument(payload: RequestDocumentPayload): Promise<DocumentRequest> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 600));
    return { ...MOCK_DOCS[1]!, id: `doc-${Date.now()}`, status: 'PENDING', docType: payload.docType, purpose: payload.purpose };
  }
  return apiRequestDocument(payload);
}

export async function getPendingDocuments(): Promise<DocumentRequest[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300));
    return MOCK_PENDING;
  }
  try { return await apiGetPending(); } catch { return MOCK_PENDING; }
}

export async function approveDocument(id: string): Promise<DocumentRequest> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 500));
    return { ...MOCK_PENDING[0]!, id, status: 'APPROVED', reviewedAt: new Date().toISOString() };
  }
  return apiApprove(id);
}

export async function rejectDocument(id: string, reason: string): Promise<DocumentRequest> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400));
    return { ...MOCK_PENDING[0]!, id, status: 'REJECTED', rejectionReason: reason };
  }
  return apiReject(id, reason);
}

export async function revokeDocument(id: string): Promise<DocumentRequest> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400));
    return { ...MOCK_DOCS[0]!, id, status: 'REVOKED' };
  }
  return apiRevoke(id);
}
