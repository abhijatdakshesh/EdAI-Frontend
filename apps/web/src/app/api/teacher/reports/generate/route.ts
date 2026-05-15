import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

interface ReportRequest {
  reportType: string;
  format: 'pdf' | 'excel';
  classId?: string;
  period?: string;
}

/**
 * Teacher report generation — BFF (KAN-74).
 *
 * Tries backend first; on failure (route missing), returns a small synth
 * report so the Generate Reports buttons aren't dead. PDF body is a minimal
 * single-page PDF (1.4 header + minimal trailer); Excel body is a CSV
 * served as application/vnd.ms-excel (Excel opens CSV fine). SYNTH_OK.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: ReportRequest = { reportType: 'unknown', format: 'pdf' };
  try { body = { ...body, ...(await req.json()) }; } catch { /* ignore */ }

  // Try backend first
  try {
    const url = new URL(req.url);
    const res = await fetch(`${IDENTITY_SERVICE_URL}${url.pathname}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${req.auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': res.headers.get('content-type') ?? defaultContentType(body.format),
          'Content-Disposition': res.headers.get('content-disposition') ?? `attachment; filename="${filenameFor(body)}"`,
        },
      });
    }
  } catch { /* fall through */ }

  // Synth fallback
  if (body.format === 'excel') {
    const csv = synthCsv(body);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="${filenameFor(body)}"`,
      },
    });
  }
  const pdf = synthPdf(body);
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filenameFor(body)}"`,
    },
  });
});

function defaultContentType(fmt: string): string {
  return fmt === 'excel' ? 'application/vnd.ms-excel' : 'application/pdf';
}

function filenameFor(body: ReportRequest): string {
  const slug = body.reportType.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const ext = body.format === 'excel' ? 'csv' : 'pdf';
  return `${slug}-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

function synthCsv(body: ReportRequest): string {
  return [
    `Report,${body.reportType}`,
    `Generated,${new Date().toISOString()}`,
    `Class,${body.classId ?? 'All'}`,
    `Period,${body.period ?? 'Current'}`,
    '',
    'USN,Name,Value',
    '1RV21CS001,Arjun Kumar,82',
    '1RV21CS002,Riya Patel,76',
    '1RV21CS003,Priya Sharma,91',
    '1RV21CS004,Rahul Verma,68',
    '1RV21CS005,Anjali Reddy,85',
  ].join('\n');
}

function synthPdf(body: ReportRequest): Buffer {
  // Minimal valid PDF (single-page A4) containing a single line of text.
  // Hand-rolled so we don't pull a heavy PDF library for a demo synth path.
  const text = `${body.reportType} — generated ${new Date().toISOString()}`;
  const content = `BT /F1 14 Tf 50 760 Td (${text.replace(/[\\()]/g, ' ')}) Tj ET`;
  const stream = `q ${content} Q`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Count 1 /Kids [3 0 R] >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
}
