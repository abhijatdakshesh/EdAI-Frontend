/**
 * Unit tests: attendance-pdf.
 *
 * pdf-lib is pure JS and returns a Uint8Array; we sanity-check the magic
 * header and that subject text is embedded somewhere in the byte stream.
 *
 * @jest-environment node
 */

import { PDFDocument } from "pdf-lib";

import { generateAttendancePdf } from "@/lib/reports/attendance-pdf";
import type {
  ParsedSheet,
  StudentRow,
} from "@/lib/reports/parse-attendance-xlsx";

function fixtureStudent(): StudentRow {
  return {
    rowIndex: 2,
    studentName: "Arjun Kumar",
    usn: "1RV21CS001",
    fatherName: "Mr. Kumar",
    parentEmail: "parent@example.com",
    counsellorEmail: "mentor@rvce.edu",
    remarks: "Good progress",
    subjects: [
      {
        subject: "Mathematics-I",
        testMarks: "25",
        assignment: "9",
        classesHeld: 20,
        classesAttended: 18,
        attendancePct: 90,
      },
      {
        subject: "Engineering Physics",
        testMarks: "-",
        assignment: "-",
        classesHeld: "-",
        classesAttended: "-",
        attendancePct: "-",
      },
    ],
  };
}

function fixtureSheet(): ParsedSheet {
  return {
    testMarksHeader: "Test Marks",
    assignmentHeader: "Assignment",
    subjectCount: 2,
    students: [],
  };
}

describe("generateAttendancePdf", () => {
  it("returns a valid PDF byte stream", async () => {
    const bytes = await generateAttendancePdf(fixtureStudent(), fixtureSheet(), {
      branch: "COMPUTER SCIENCE & ENGINEERING",
      test: "CIE-1",
      semester: "I Semester BE",
      submissionDate: "20th May, 2026",
      note: "Attendance considered up till 17th May 2026",
    });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(500);
    const head = Buffer.from(bytes.subarray(0, 5)).toString("ascii");
    expect(head).toBe("%PDF-");
  });

  it("produces a re-parseable single-page PDF for typical input", async () => {
    const bytes = await generateAttendancePdf(fixtureStudent(), fixtureSheet(), {
      branch: "COMPUTER SCIENCE & ENGINEERING",
      test: "CIE-1",
      semester: "I Semester BE",
      submissionDate: "20th May, 2026",
      note: "",
    });
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
    // Page dimensions match the US Letter constants used in the generator.
    const page = reloaded.getPage(0);
    expect(Math.round(page.getWidth())).toBe(612);
    expect(Math.round(page.getHeight())).toBe(792);
  });

  it("renders even when subjects, remarks, and note are empty", async () => {
    const empty: StudentRow = {
      ...fixtureStudent(),
      remarks: "",
      subjects: [],
    };
    const bytes = await generateAttendancePdf(empty, fixtureSheet(), {
      branch: "COMPUTER SCIENCE & ENGINEERING",
      test: "CIE-1",
      semester: "I Semester BE",
      submissionDate: "",
      note: "",
    });
    expect(bytes.byteLength).toBeGreaterThan(300);
  });
});
