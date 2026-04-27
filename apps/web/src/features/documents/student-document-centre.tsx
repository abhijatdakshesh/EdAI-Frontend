'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Clock, CheckCircle, XCircle, AlertCircle, PlusCircle } from 'lucide-react';
import { DocumentRequest, DocType, DocStatus, DOC_TYPE_LABELS, STATUS_COLORS, PURPOSE_OPTIONS } from './types';
import { getMyDocuments, requestDocument } from './repository';
import { buildDownloadUrl } from '@/lib/api/documents';

const DOC_TYPES: DocType[] = ['BONAFIDE', 'ATTENDANCE_CERT', 'FEE_RECEIPT', 'COURSE_COMPLETION'];

const STATUS_ICON: Record<DocStatus, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4 text-yellow-600" />,
  APPROVED: <CheckCircle className="w-4 h-4 text-green-600" />,
  REJECTED: <XCircle className="w-4 h-4 text-red-600" />,
  REVOKED: <AlertCircle className="w-4 h-4 text-gray-500" />,
};

export default function StudentDocumentCentre({ studentName }: { studentName?: string }) {
  const [docs, setDocs] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [docType, setDocType] = useState<DocType>('BONAFIDE');
  const [purpose, setPurpose] = useState('');
  const [purposeDetail, setPurposeDetail] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    getMyDocuments().then(d => { setDocs(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consentGiven) { setFormError('You must give consent to proceed (DPDP Act 2023).'); return; }
    if (!purpose) { setFormError('Please select a purpose.'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      const doc = await requestDocument({
        docType,
        purpose,
        purposeDetail: purposeDetail.slice(0, 200),
        studentName: studentName ?? 'Student',
        consentGiven: true,
      });
      setDocs(prev => [doc, ...prev]);
      setShowForm(false);
      setPurpose('');
      setPurposeDetail('');
      setConsentGiven(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1810]">My Documents</h1>
          <p className="text-sm text-[#8B7355] mt-1">Request and download official certificates</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-[#2C1810] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#3d241a] transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Request
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-[#E8E0D5] rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#2C1810] mb-4">Request a Document</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#5C4A35] mb-1">Document Type</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value as DocType)}
                className="w-full border border-[#D4C4B0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6914]"
              >
                {DOC_TYPES.map(t => (
                  <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C4A35] mb-1">Purpose</label>
              <select
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                required
                className="w-full border border-[#D4C4B0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6914]"
              >
                <option value="">Select purpose...</option>
                {PURPOSE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C4A35] mb-1">
                Additional Details <span className="text-[#8B7355] font-normal">(optional, max 200 chars)</span>
              </label>
              <textarea
                value={purposeDetail}
                onChange={e => setPurposeDetail(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="Any specific details to include in the certificate..."
                className="w-full border border-[#D4C4B0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6914] resize-none"
              />
              <p className="text-xs text-[#8B7355] mt-1">{purposeDetail.length}/200</p>
            </div>

            <div className="bg-[#F9F7F4] rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={e => setConsentGiven(e.target.checked)}
                  className="mt-0.5 rounded border-[#D4C4B0]"
                />
                <span className="text-sm text-[#5C4A35]">
                  I consent to my personal data being processed to generate this document, as per the{' '}
                  <span className="font-medium">Digital Personal Data Protection Act 2023 (DPDP)</span>. I understand this data will be retained for 90 days and used solely for issuing the requested certificate.
                </span>
              </label>
            </div>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#2C1810] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#3d241a] disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-[#D4C4B0] text-[#5C4A35] px-6 py-2 rounded-lg text-sm hover:bg-[#F9F7F4] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[#8B7355]">Loading your documents...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12 bg-white border border-[#E8E0D5] rounded-xl">
          <FileText className="w-12 h-12 text-[#D4C4B0] mx-auto mb-3" />
          <p className="text-[#5C4A35] font-medium">No documents yet</p>
          <p className="text-sm text-[#8B7355] mt-1">Click &ldquo;New Request&rdquo; to request your first certificate.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <div key={doc.id} className="bg-white border border-[#E8E0D5] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#2C1810]">{DOC_TYPE_LABELS[doc.docType]}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status]}`}>
                      {STATUS_ICON[doc.status]}
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#5C4A35]">
                    Purpose: {doc.purpose}{doc.purposeDetail ? ` — ${doc.purposeDetail}` : ''}
                  </p>
                  <p className="text-xs text-[#8B7355] mt-1">
                    Requested {new Date(doc.requestedAt).toLocaleDateString('en-IN')}
                    {doc.docNumber && <> · {doc.docNumber}</>}
                    {doc.expiresAt && <> · Expires {new Date(doc.expiresAt).toLocaleDateString('en-IN')}</>}
                  </p>
                  {doc.status === 'REJECTED' && doc.rejectionReason && (
                    <p className="text-sm text-red-600 mt-1">
                      Rejection reason: {doc.rejectionReason}
                    </p>
                  )}
                </div>

                {doc.status === 'APPROVED' && doc.signedToken && (
                  <a
                    href={buildDownloadUrl(doc.id, doc.signedToken)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-700 transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
