import JSZip from "jszip";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  generateAttendancePdf,
  type ReportConfig,
} from "@/lib/reports/attendance-pdf";
import {
  parseAttendanceSheet,
  type ParsedSheet,
  type StudentRow,
} from "@/lib/reports/parse-attendance-xlsx";

/**
 * Bulk attendance report generation (KAN-74 follow-up).
 *
 * Accepts multipart/form-data with:
 *   - file: .xlsx workbook (column layout per parse-attendance-xlsx)
 *   - branch, test, semester, submissionDate, note: text fields
 *   - subjectCount (optional): override auto-detection
 *
 * Returns a ZIP of per-student PDFs named `<USN>.pdf`. If the workbook
 * has no usable rows, responds 400 instead of an empty ZIP.
 */
export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing 'file' (xlsx upload)" },
      { status: 400 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 413 },
    );
  }

  const config: ReportConfig = {
    branch: String(form.get("branch") ?? "COMPUTER SCIENCE & ENGINEERING"),
    test: String(form.get("test") ?? "CIE-1"),
    semester: String(form.get("semester") ?? "I Semester BE"),
    submissionDate: String(form.get("submissionDate") ?? ""),
    note: String(form.get("note") ?? ""),
  };
  const subjectCountRaw = form.get("subjectCount");
  const subjectCount =
    subjectCountRaw == null ? undefined : Number.parseInt(String(subjectCountRaw), 10);

  let parsed: ParsedSheet;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const parseOpts: { subjectCount?: number } = {};
    if (subjectCount && Number.isFinite(subjectCount) && subjectCount > 0) {
      parseOpts.subjectCount = subjectCount;
    }
    parsed = parseAttendanceSheet(buf, parseOpts);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse workbook" },
      { status: 400 },
    );
  }

  if (parsed.students.length === 0) {
    return NextResponse.json(
      { error: "No student rows found in workbook" },
      { status: 400 },
    );
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();
  for (const student of parsed.students) {
    const pdf = await generateAttendancePdf(student, parsed, config);
    zip.file(safePdfName(student, usedNames), pdf);
  }

  const zipBuf = await zip.generateAsync({ type: "nodebuffer" });
  const filename = `${slugify(config.test)}-${slugify(config.semester)}.zip`;

  return new NextResponse(new Uint8Array(zipBuf), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});

function safePdfName(student: StudentRow, used: Set<string>): string {
  const base =
    slugify(student.usn) ||
    slugify(student.studentName) ||
    `student-${student.rowIndex}`;
  let name = `${base}.pdf`;
  let i = 2;
  while (used.has(name)) {
    name = `${base}-${i}.pdf`;
    i += 1;
  }
  used.add(name);
  return name;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
