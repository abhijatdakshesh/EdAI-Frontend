import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface VerifyData {
  valid: boolean;
  docType: string;
  studentName: string;
  issuedAt: string;
  expiresAt: string | null;
  status: string;
}

async function fetchVerification(uuid: string): Promise<VerifyData | null> {
  const base = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${base}/documents/verify/${uuid}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as VerifyData;
  } catch {
    return null;
  }
}

function StatusBadge({ status, valid }: { status: string; valid: boolean }) {
  if (valid) return (
    <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
      <CheckCircle className="w-5 h-5" />
      <span className="font-semibold">VERIFIED — Authentic Document</span>
    </div>
  );
  if (status === 'REVOKED') return (
    <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full">
      <AlertCircle className="w-5 h-5" />
      <span className="font-semibold">REVOKED — Document Invalidated</span>
    </div>
  );
  if (status === 'REJECTED') return (
    <div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full">
      <XCircle className="w-5 h-5" />
      <span className="font-semibold">REJECTED — Not Issued</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
      <Clock className="w-5 h-5" />
      <span className="font-semibold">EXPIRED or PENDING</span>
    </div>
  );
}

export default async function VerifyPage({ params }: { params: { uuid: string } }) {
  const data = await fetchVerification(params.uuid);

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="bg-[#2C1810] rounded-t-xl px-6 py-5">
          <h1 className="text-white text-xl font-bold">Ed8AI Document Verification</h1>
          <p className="text-[#C4A882] text-sm mt-1">Official certificate verification portal</p>
        </div>

        {/* Content */}
        <div className="bg-white border border-[#E8E0D5] border-t-0 rounded-b-xl px-6 py-6 shadow-sm space-y-5">
          {!data ? (
            <div className="text-center py-6">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-[#2C1810] font-semibold">Document Not Found</p>
              <p className="text-sm text-[#8B7355] mt-1">
                This QR code does not correspond to any issued document. It may have been tampered with.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <StatusBadge status={data.status} valid={data.valid} />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-[#E8E0D5] pb-2">
                  <span className="text-[#8B7355]">Document Type</span>
                  <span className="text-[#2C1810] font-medium">{data.docType}</span>
                </div>
                <div className="flex justify-between border-b border-[#E8E0D5] pb-2">
                  <span className="text-[#8B7355]">Student</span>
                  <span className="text-[#2C1810] font-medium">{data.studentName}</span>
                </div>
                <div className="flex justify-between border-b border-[#E8E0D5] pb-2">
                  <span className="text-[#8B7355]">Issued On</span>
                  <span className="text-[#2C1810] font-medium">
                    {data.issuedAt ? new Date(data.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </span>
                </div>
                {data.expiresAt && (
                  <div className="flex justify-between border-b border-[#E8E0D5] pb-2">
                    <span className="text-[#8B7355]">Valid Until</span>
                    <span className="text-[#2C1810] font-medium">
                      {new Date(data.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pb-2">
                  <span className="text-[#8B7355]">Status</span>
                  <span className={`font-medium ${data.valid ? 'text-green-700' : 'text-red-600'}`}>
                    {data.status}
                  </span>
                </div>
              </div>

              {data.valid && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-green-700">
                    This document was issued by Ed8AI on behalf of the institution and is cryptographically verified. Do not accept if the student name or document type above does not match the physical copy.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#8B7355] mt-4">
          Ed8AI by Raycraft Technologies · DPDP Act 2023 compliant
        </p>
      </div>
    </div>
  );
}
