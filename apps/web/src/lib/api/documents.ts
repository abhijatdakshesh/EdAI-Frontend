import { apiGet, apiPost } from './client';
import type { DocumentRequest, DocType } from '@/features/documents/types';

export interface RequestDocumentPayload {
  docType: DocType;
  purpose: string;
  purposeDetail?: string;
  studentName: string;
  consentGiven: boolean;
}

export function getMyDocuments() {
  return apiGet<DocumentRequest[]>('/documents/mine');
}

export function requestDocument(payload: RequestDocumentPayload) {
  return apiPost<DocumentRequest>('/documents', payload);
}

export function getPendingDocuments() {
  return apiGet<DocumentRequest[]>('/documents/admin/pending');
}

export function approveDocument(id: string) {
  return apiPost<DocumentRequest>(`/documents/admin/approve/${id}`, {});
}

export function rejectDocument(id: string, reason: string) {
  return apiPost<DocumentRequest>(`/documents/admin/reject/${id}`, { reason });
}

export function revokeDocument(id: string) {
  return apiPost<DocumentRequest>(`/documents/admin/revoke/${id}`, {});
}

export function verifyDocument(uuid: string) {
  return apiGet<{
    valid: boolean;
    docType: string;
    studentName: string;
    issuedAt: string;
    expiresAt: string | null;
    status: string;
  }>(`/documents/verify/${uuid}`);
}

export function buildDownloadUrl(docId: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
  return `${base}/documents/download/${docId}?token=${encodeURIComponent(token)}`;
}
