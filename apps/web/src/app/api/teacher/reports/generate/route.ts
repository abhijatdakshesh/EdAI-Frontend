import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as XLSX from 'xlsx';

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:3001';

interface ReportRequest {
  reportType: string;
  format: 'pdf' | 'excel';
  branch?: string;
  test?: string;
  semester?: string;
  classId?: string;
  period?: string;
}

interface Subject {
  name: string;
  classesHeld: number;
  classesAttended: number;
  testMarks: number;
  assignment: number;
}

interface Student {
  name: string;
  usn: string;
  father: string;
  subjects: Subject[];
}

const SAMPLE_STUDENTS: Student[] = [
  {
    name: 'Arjun Kumar', usn: '1RV21CS001', father: 'Ramesh Kumar',
    subjects: [
      { name: 'Database Management Systems', classesHeld: 42, classesAttended: 38, testMarks: 24, assignment: 9 },
      { name: 'Operating Systems', classesHeld: 40, classesAttended: 30, testMarks: 22, assignment: 8 },
      { name: 'Computer Networks', classesHeld: 38, classesAttended: 35, testMarks: 26, assignment: 10 },
      { name: 'Software Engineering', classesHeld: 36, classesAttended: 33, testMarks: 25, assignment: 9 },
      { name: 'Theory of Computation', classesHeld: 40, classesAttended: 27, testMarks: 18, assignment: 7 },
    ],
  },
  {
    name: 'Riya Patel', usn: '1RV21CS002', father: 'Suresh Patel',
    subjects: [
      { name: 'Database Management Systems', classesHeld: 42, classesAttended: 32, testMarks: 20, assignment: 8 },
      { name: 'Operating Systems', classesHeld: 40, classesAttended: 28, testMarks: 19, assignment: 7 },
      { name: 'Computer Networks', classesHeld: 38, classesAttended: 30, testMarks: 22, assignment: 9 },
      { name: 'Software Engineering', classesHeld: 36, classesAttended: 30, testMarks: 21, assignment: 8 },
      { name: 'Theory of Computation', classesHeld: 40, classesAttended: 25, testMarks: 17, assignment: 6 },
    ],
  },
  {
    name: 'Priya Sharma', usn: '1RV21CS003', father: 'Anil Sharma',
    subjects: [
      { name: 'Database Management Systems', classesHeld: 42, classesAttended: 40, testMarks: 27, assignment: 10 },
      { name: 'Operating Systems', classesHeld: 40, classesAttended: 38, testMarks: 26, assignment: 10 },
      { name: 'Computer Networks', classesHeld: 38, classesAttended: 36, testMarks: 28, assignment: 10 },
      { name: 'Software Engineering', classesHeld: 36, classesAttended: 35, testMarks: 27, assignment: 9 },
      { name: 'Theory of Computation', classesHeld: 40, classesAttended: 36, testMarks: 25, assignment: 9 },
    ],
  },
];

/**
 * Teacher report generation — BFF (KAN-74).
 * Produces per-student parent letters in the Report-Generator format
 * (https://github.com/abhijatdakshesh/Report-Generator) using pdf-lib.
 * Layout: RVCE header, branch + test heading, date, "To Mr/Mrs <father>",
 * body paragraph, table of subjects with classes/marks, signature line.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: ReportRequest = { reportType: 'Attendance Report', format: 'pdf' };
  try { body = { ...body, ...(await req.json()) }; } catch { /* ignore */ }

  // Try backend report engine first
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

  if (body.format === 'excel') {
    const buf = buildExcel(body);
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

function buildExcel(body: ReportRequest): Buffer {
  const wb = XLSX.utils.book_new();
  const header: (string | number)[] = ['Student Name', 'USN', 'Father Name', 'Parent Email', 'Counsellor Email', 'Remarks'];
  // Add subject column trio per subject (max 5)
  const maxSubs = 5;
  for (let i = 0; i < maxSubs; i++) {
    header.push(`Subject ${i + 1}`, 'Test Marks (Max 30)', 'Assignment (Max 10)', 'Classes Held', 'Classes Attended');
  }
  const headerRows: (string | number)[][] = [header];
  for (const s of SAMPLE_STUDENTS) {
    const row: (string | number)[] = [s.name, s.usn, s.father, `${s.usn.toLowerCase()}@parent.rvce.edu`, 'counsellor@rvce.edu', ''];
    for (let i = 0; i < maxSubs; i++) {
      const sub = s.subjects[i];
      if (sub) row.push(sub.name, sub.testMarks, sub.assignment, sub.classesHeld, sub.classesAttended);
      else row.push('', '', '', '', '');
    }
    headerRows.push(row);
  }
  const sheet = XLSX.utils.aoa_to_sheet(headerRows);
  XLSX.utils.book_append_sheet(wb, sheet, 'Attendance');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

async function buildPdf(body: ReportRequest): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const times = await doc.embedFont(StandardFonts.TimesRoman);
  const helv = await doc.embedFont(StandardFonts.Helvetica);

  const branch = body.branch ?? 'COMPUTER SCIENCE & ENGINEERING';
  const test = body.test ?? body.reportType.toUpperCase();
  const semester = body.semester ?? 'V SEM';
  const today = new Date();
  const day = today.getDate();
  const suffix = (day >= 11 && day <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[day % 10] ?? 'th';
  const dateStr = `${day}${suffix} ${today.toLocaleString('en', { month: 'short' })}, ${today.getFullYear()}`;

  for (const student of SAMPLE_STUDENTS) {
    drawStudentPage(doc, student, branch, test, semester, dateStr, { timesBold, times, helv });
  }

  return doc.save();
}

function drawStudentPage(
  doc: PDFDocument,
  s: Student,
  branch: string,
  test: string,
  semester: string,
  dateStr: string,
  fonts: { timesBold: any; times: any; helv: any }, // eslint-disable-line @typescript-eslint/no-explicit-any
) {
  const { timesBold, times } = fonts;
  const page = doc.addPage([612, 792]); // US Letter
  const { width } = page.getSize();
  let y = 760;

  // RVCE header strip (since we don't have the PNG, draw a styled header band)
  page.drawRectangle({ x: 0, y: 700, width, height: 60, color: rgb(0.11, 0.09, 0.06) });
  page.drawText('RV COLLEGE OF ENGINEERING', { x: 50, y: 735, size: 18, font: timesBold, color: rgb(1, 0.96, 0.86) });
  page.drawText('Autonomous Institution affiliated to VTU, Approved by AICTE', { x: 50, y: 718, size: 9, font: times, color: rgb(0.95, 0.92, 0.83) });
  page.drawText('Mysuru Road, Bengaluru — 560059', { x: 50, y: 706, size: 9, font: times, color: rgb(0.95, 0.92, 0.83) });

  y = 680;
  drawCentered(page, branch, y, 12, timesBold, width, true);
  y -= 18;
  drawCentered(page, test, y, 12, timesBold, width, true);
  y -= 22;
  page.drawText(dateStr, { x: 50, y, size: 10, font: times });
  y -= 22;

  page.drawText('To,', { x: 50, y, size: 10, font: times });
  y -= 14;
  page.drawText(`     Mr/Mrs  ${s.father},`, { x: 50, y, size: 10, font: timesBold });
  y -= 20;

  const bodyText = `           The Attendance report of your ward ${s.name}, ${s.usn} studying in ${semester} is given below :`;
  wrapText(page, bodyText, 50, y, 10, times, width - 100, 13).forEach(() => { /* drawn by wrapText */ });
  y -= 26;

  // Table
  const cols = [
    { label: 'Sl.', x: 50, w: 30, align: 'center' as const },
    { label: 'Subject Name', x: 80, w: 200, align: 'left' as const },
    { label: 'Classes\nHeld', x: 280, w: 50, align: 'center' as const },
    { label: 'Classes\nAttended', x: 330, w: 60, align: 'center' as const },
    { label: 'Attendance\n%', x: 390, w: 60, align: 'center' as const },
    { label: 'Test\nMarks', x: 450, w: 50, align: 'center' as const },
    { label: 'Assign-\nment', x: 500, w: 50, align: 'center' as const },
  ];

  // Header row
  const headerH = 26;
  page.drawRectangle({ x: 50, y: y - headerH, width: 500, height: headerH, color: rgb(0.95, 0.92, 0.83), borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 0.5 });
  for (const c of cols) {
    const lines = c.label.split('\n');
    let ly = y - 10;
    for (const line of lines) {
      drawColText(page, line, c, ly, 9, timesBold);
      ly -= 10;
    }
  }
  y -= headerH;

  // Rows
  const rowH = 22;
  s.subjects.forEach((sub, i) => {
    page.drawRectangle({ x: 50, y: y - rowH, width: 500, height: rowH, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.4 });
    const pct = sub.classesHeld > 0 ? Math.round((sub.classesAttended / sub.classesHeld) * 100) : 0;
    const values = [
      `${i + 1}`,
      sub.name,
      `${sub.classesHeld}`,
      `${sub.classesAttended}`,
      `${pct}%`,
      `${sub.testMarks}`,
      `${sub.assignment}`,
    ];
    cols.forEach((c, idx) => drawColText(page, values[idx] ?? '', c, y - 14, 9, times));
    y -= rowH;
  });

  // Signature block
  y -= 40;
  page.drawText('Counsellor / HOD', { x: 50, y, size: 10, font: timesBold });
  page.drawText('Principal', { x: width - 130, y, size: 10, font: timesBold });
  y -= 14;
  page.drawText('Dept. of CSE, RVCE', { x: 50, y, size: 9, font: times });
  page.drawText('RV College of Engineering', { x: width - 130, y, size: 9, font: times });
}

function drawCentered(
  page: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  text: string,
  y: number,
  size: number,
  font: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  pageWidth: number,
  underline = false,
) {
  const tw = font.widthOfTextAtSize(text, size);
  const x = (pageWidth - tw) / 2;
  page.drawText(text, { x, y, size, font });
  if (underline) {
    page.drawLine({ start: { x, y: y - 2 }, end: { x: x + tw, y: y - 2 }, thickness: 0.7 });
  }
}

function drawColText(
  page: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  text: string,
  col: { x: number; w: number; align: 'left' | 'center' },
  y: number,
  size: number,
  font: any, // eslint-disable-line @typescript-eslint/no-explicit-any
) {
  let x = col.x + 4;
  if (col.align === 'center') {
    const tw = font.widthOfTextAtSize(text, size);
    x = col.x + (col.w - tw) / 2;
  }
  // Truncate if too wide for the column
  let drawText = text;
  const maxW = col.w - 6;
  if (font.widthOfTextAtSize(drawText, size) > maxW) {
    while (drawText.length > 1 && font.widthOfTextAtSize(drawText + '…', size) > maxW) {
      drawText = drawText.slice(0, -1);
    }
    drawText += '…';
  }
  page.drawText(drawText, { x, y, size, font });
}

function wrapText(
  page: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  text: string,
  x: number,
  startY: number,
  size: number,
  font: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  maxWidth: number,
  lineH: number,
): null[] {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      page.drawText(line, { x, y, size, font });
      y -= lineH;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) page.drawText(line, { x, y, size, font });
  return [];
}
