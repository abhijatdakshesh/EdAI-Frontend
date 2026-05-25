/**
 * Excel parser for the bulk attendance report flow.
 *
 * Matches the column layout from the reference Report-Generator repo:
 *
 *   Col 0: Student Name
 *   Col 1: USN
 *   Col 2: Father Name
 *   Col 3: Parent Email
 *   Col 4: Counsellor / Mentor Email
 *   Col 5: Remarks
 *   Col 6..: Per-subject block of 5 columns:
 *           [subject, test marks, assignment, classes held, classes attended]
 *
 * Row 0 is the header row (may contain category labels like "Professional
 * Elective" — in that case the actual subject name lives in row 1).
 * Row 1 is an optional sub-header row. Student data starts at row 2 (matches
 * the reference app's `range(2, df.shape[0])`).
 */

import * as XLSX from "xlsx";

export interface SubjectRecord {
  subject: string;
  testMarks: string;
  assignment: string;
  classesHeld: number | "-";
  classesAttended: number | "-";
  attendancePct: number | "-";
}

export interface StudentRow {
  rowIndex: number;
  studentName: string;
  usn: string;
  fatherName: string;
  parentEmail: string;
  counsellorEmail: string;
  remarks: string;
  subjects: SubjectRecord[];
}

export interface ParsedSheet {
  testMarksHeader: string;
  assignmentHeader: string;
  subjectCount: number;
  students: StudentRow[];
}

const CATEGORY_KEYWORDS = [
  "professional elective",
  "open elective",
  "elective",
  "core",
  "lab",
];

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" && Number.isNaN(v)) return "";
  return String(v).trim();
}

function isCategoryHeader(s: string): boolean {
  if (!s) return false;
  const lower = s.toLowerCase();
  return (
    CATEGORY_KEYWORDS.some((k) => lower.includes(k)) &&
    s.split(/\s+/).length <= 4
  );
}

function toIntOrDash(v: unknown): number | "-" {
  const s = cellStr(v);
  if (s === "" || s === "-") return "-";
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return "-";
  return Math.trunc(n);
}

function toMarkOrDash(v: unknown): string {
  const s = cellStr(v);
  if (s === "" || s === "-") return "-";
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return "-";
  return String(Math.trunc(n));
}

function stripMaxMarks(header: string): string {
  const i = header.indexOf("(");
  return i >= 0 ? header.slice(0, i).trim() : header.trim();
}

export function detectSubjectCount(columnCount: number): number {
  // 6 fixed leading columns; 5 per subject. Cap at 11 (matches reference UI).
  const detected = Math.max(1, Math.floor((columnCount - 6) / 5));
  return Math.min(detected, 11);
}

export function parseAttendanceSheet(
  buffer: ArrayBuffer | Buffer,
  opts: { subjectCount?: number } = {},
): ParsedSheet {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  if (!sheet) {
    throw new Error("Workbook has no sheets");
  }
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  if (rows.length < 3) {
    throw new Error(
      "Sheet must contain at least a header row and one student row (3+ rows total)",
    );
  }

  const headerRow = rows[0] ?? [];
  const subHeaderRow = rows[1] ?? [];
  const totalCols = Math.max(
    ...rows.map((r) => r.length),
    headerRow.length,
  );

  const subjectCount = opts.subjectCount ?? detectSubjectCount(totalCols);

  const testMarksHeader = stripMaxMarks(cellStr(headerRow[7])) || "Test Marks";
  const assignmentHeader =
    stripMaxMarks(cellStr(headerRow[8])) || "Assignment";

  const students: StudentRow[] = [];
  for (let r = 2; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const usn = cellStr(row[1]);
    const name = cellStr(row[0]);
    if (!usn && !name) continue; // skip blank rows

    const subjects: SubjectRecord[] = [];
    for (let i = 0; i < subjectCount; i++) {
      const sCol = 6 + i * 5;
      const tCol = 7 + i * 5;
      const aCol = 8 + i * 5;
      const hCol = 9 + i * 5;
      const attCol = 10 + i * 5;
      if (sCol >= totalCols) break;

      // Resolve subject name (row 0, with category-header fallback to row 1).
      const row0 = cellStr(headerRow[sCol]);
      let subject = "";
      if (row0 && isCategoryHeader(row0)) {
        const row1 = cellStr(subHeaderRow[sCol]);
        if (row1 && !isCategoryHeader(row1)) subject = row1;
        if (!subject) {
          const studentRowVal = cellStr(row[sCol]);
          if (studentRowVal) subject = studentRowVal;
        }
      } else if (row0) {
        subject = row0;
      } else {
        subject = cellStr(row[sCol]);
      }
      if (!subject) subject = `Subject ${i + 1}`;

      const classesHeld = toIntOrDash(row[hCol]);
      const classesAttended = toIntOrDash(row[attCol]);
      let attendancePct: number | "-" = "-";
      if (classesHeld !== "-" && classesAttended !== "-" && classesHeld > 0) {
        attendancePct = Math.min(
          100,
          Math.trunc((classesAttended / classesHeld) * 100),
        );
      } else if (classesHeld === "-" && classesAttended === "-") {
        attendancePct = "-";
      } else {
        attendancePct = 0;
      }

      subjects.push({
        subject,
        testMarks: toMarkOrDash(row[tCol]),
        assignment: toMarkOrDash(row[aCol]),
        classesHeld,
        classesAttended,
        attendancePct,
      });
    }

    students.push({
      rowIndex: r,
      studentName: name,
      usn,
      fatherName: cellStr(row[2]),
      parentEmail: cellStr(row[3]),
      counsellorEmail: cellStr(row[4]),
      remarks: cellStr(row[5]),
      subjects,
    });
  }

  return { testMarksHeader, assignmentHeader, subjectCount, students };
}
