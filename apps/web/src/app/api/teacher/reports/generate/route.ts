import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as XLSX from 'xlsx';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

interface ReportRequest {
  reportType: string;
  format: 'pdf' | 'excel';
  classId?: string;
  period?: string;
}

const SAMPLE_ROWS: Array<Record<string, string | number>> = [
  { USN: '1RV21CS001', Name: 'Arjun Kumar', Attendance: 82, IA1: 24, IA2: 22, Total: 46 },
  { USN: '1RV21CS002', Name: 'Riya Patel', Attendance: 76, IA1: 20, IA2: 19, Total: 39 },
  { USN: '1RV21CS003', Name: 'Priya Sharma', Attendance: 91, IA1: 27, IA2: 26, Total: 53 },
  { USN: '1RV21CS004', Name: 'Rahul Verma', Attendance: 68, IA1: 18, IA2: 17, Total: 35 },
  { USN: '1RV21CS005', Name: 'Anjali Reddy', Attendance: 85, IA1: 25, IA2: 24, Total: 49 },
];

/**
 * Teacher report generation — BFF (KAN-74).
 * Tries backend first; on failure returns a proper PDF (pdf-lib) or XLSX
 * (xlsx package) so the demo flow yields a real, well-formed file that
 * opens cleanly in Adobe / Preview / Excel.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: ReportRequest = { reportType: 'Report', format: 'pdf' };
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
  } catch { /* fall through to synth */ }

  // Synth fallback — proper PDF or XLSX
  if (body.format === 'excel') {
    const wb = XLSX.utils.book_new();
    const headerSheet = XLSX.utils.aoa_to_sheet([
      [body.reportType],
      [`Generated: ${new Date().toLocaleString('en-IN')}`],
      [`Class: ${body.classId ?? 'All'}`],
      [`Period: ${body.period ?? 'Current'}`],
      [],
    ]);
    XLSX.utils.sheet_add_json(headerSheet, SAMPLE_ROWS, { origin: 'A6' });
    XLSX.utils.book_append_sheet(wb, headerSheet, 'Report');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filenameFor(body)}"`,
      },
    });
  }

  const pdfBytes = await buildPdf(body);
  return new NextResponse(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filenameFor(body)}"`,
    },
  });
});

function defaultContentType(fmt: string): string {
  return fmt === 'excel'
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'application/pdf';
}

function filenameFor(body: ReportRequest): string {
  const slug = body.reportType.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const ext = body.format === 'excel' ? 'xlsx' : 'pdf';
  return `${slug}-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

async function buildPdf(body: ReportRequest): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  page.drawText(body.reportType, { x: 50, y, size: 20, font: bold, color: rgb(0.11, 0.09, 0.06) });
  y -= 24;
  page.drawText(`Generated: ${new Date().toLocaleString('en-IN')}`, { x: 50, y, size: 10, font, color: rgb(0.42, 0.39, 0.35) });
  y -= 14;
  page.drawText(`Class: ${body.classId ?? 'All'}    Period: ${body.period ?? 'Current'}`, { x: 50, y, size: 10, font, color: rgb(0.42, 0.39, 0.35) });
  y -= 30;

  // Header row
  const cols = ['USN', 'Name', 'Attendance', 'IA1', 'IA2', 'Total'];
  const colXs = [50, 140, 260, 340, 390, 440];
  cols.forEach((c, i) => page.drawText(c, { x: colXs[i]!, y, size: 11, font: bold }));
  y -= 4;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  y -= 16;

  for (const row of SAMPLE_ROWS) {
    const vals = [row.USN, row.Name, `${row.Attendance}%`, row.IA1, row.IA2, row.Total];
    vals.forEach((v, i) => page.drawText(String(v), { x: colXs[i]!, y, size: 10, font }));
    y -= 18;
  }

  y -= 20;
  page.drawText('— Ed8AI Synth Report —', { x: 50, y, size: 8, font, color: rgb(0.7, 0.7, 0.7) });

  return doc.save();
}
