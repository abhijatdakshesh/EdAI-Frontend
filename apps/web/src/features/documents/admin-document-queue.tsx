'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, ShieldOff, FileText } from 'lucide-react';
import { DocumentRequest, DocStatus, DOC_TYPE_LABELS, STATUS_COLORS } from './types';
import { getPendingDocuments, approveDocument, rejectDocument, revokeDocument } from './repository';

const STATUS_ICON: Record<DocStatus, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4 text-yellow-600" />,
  APPROVED: <CheckCircle className="w-4 h-4 text-green-600" />,
  REJECTED: <XCircle className="w-4 h-4 text-red-600" />,
  REVOKED: <AlertCircle className="w-4 h-4 text-gray-500" />,
};

export default function AdminDocumentQueue() {
  const [pending, setPending] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getPendingDocuments().then(d => { setPending(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    setActionId(id);
    setError('');
    try {
      await approveDocument(id);
      setPending(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setActionId(null);
    }
  }

  async function handleReject() {
    if (!rejectId) return;
    if (!rejectReason.trim()) { setError('Rejection reason is required.'); return; }
    setActionId(rejectId);
    setError('');
    try {
      await rejectDocument(rejectId, rejectReason.trim());
      setPending(prev => prev.filter(d => d.id !== rejectId));
      setRejectId(null);
      setRejectReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setActionId(null);
    }
  }

  async function handleRevoke() {
    if (!revokeId) return;
    setActionId(revokeId);
    setError('');
    try {
      await revokeDocument(revokeId);
      setPending(prev => prev.filter(d => d.id !== revokeId));
      setRevokeId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2C1810]">Document Centre</h1>
        <p className="text-sm text-[#8B7355] mt-1">Review and approve student document requests</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-[#2C1810] mb-3">Reject Document Request</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection (required)..."
              className="w-full border border-[#D4C4B0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={!!actionId}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {actionId ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => { setRejectId(null); setRejectReason(''); setError(''); }}
                className="border border-[#D4C4B0] text-[#5C4A35] px-4 py-2 rounded-lg text-sm hover:bg-[#F9F7F4]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke modal */}
      {revokeId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-[#2C1810] mb-3">Revoke Document</h3>
            <p className="text-sm text-[#5C4A35] mb-4">
              This will invalidate the document. Any QR verification will show REVOKED. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRevoke}
                disabled={!!actionId}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                {actionId ? 'Revoking...' : 'Confirm Revoke'}
              </button>
              <button
                onClick={() => setRevokeId(null)}
                className="border border-[#D4C4B0] text-[#5C4A35] px-4 py-2 rounded-lg text-sm hover:bg-[#F9F7F4]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[#8B7355]">Loading pending requests...</div>
      ) : pending.length === 0 ? (
        <div className="text-center py-12 bg-white border border-[#E8E0D5] rounded-xl">
          <FileText className="w-12 h-12 text-[#D4C4B0] mx-auto mb-3" />
          <p className="text-[#5C4A35] font-medium">No pending requests</p>
          <p className="text-sm text-[#8B7355] mt-1">All document requests have been reviewed.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E0D5] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F7F4] px-5 py-3 border-b border-[#E8E0D5]">
            <span className="text-sm font-medium text-[#5C4A35]">
              {pending.length} pending request{pending.length !== 1 ? 's' : ''}
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E0D5]">
                {['Student', 'Document', 'Purpose', 'Requested', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#8B7355] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pending.map(doc => (
                <tr key={doc.id} className="border-b border-[#E8E0D5] last:border-0 hover:bg-[#F9F7F4]/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#2C1810]">{doc.studentName}</p>
                    <p className="text-xs text-[#8B7355]">{doc.studentUsn}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#2C1810]">{DOC_TYPE_LABELS[doc.docType]}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#5C4A35]">{doc.purpose}</p>
                    {doc.purposeDetail && <p className="text-xs text-[#8B7355] truncate max-w-[180px]">{doc.purposeDetail}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#8B7355]">
                    {new Date(doc.requestedAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status]}`}>
                      {STATUS_ICON[doc.status]}
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {doc.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(doc.id)}
                            disabled={actionId === doc.id}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {actionId === doc.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => { setRejectId(doc.id); setError(''); }}
                            disabled={!!actionId}
                            className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {doc.status === 'APPROVED' && (
                        <button
                          onClick={() => setRevokeId(doc.id)}
                          title="Revoke document"
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
