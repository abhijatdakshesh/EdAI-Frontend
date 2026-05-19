/**
 * Unit tests: parse-attendance-xlsx.
 *
 * Validates the column layout assumed by the bulk attendance report flow:
 *   - 6 fixed leading columns (name, USN, father, parent email, counsellor, remarks)
 *   - 5 columns per subject (subject, test marks, assignment, classes held, attended)
 *   - Row 0 is the header; row 1 may carry category labels; data starts at row 2
 *
 * @jest-environment node
 */

import * as XLSX from "xlsx";

import {
  detectSubjectCount,
  parseAttendanceSheet,
} from "@/lib/reports/parse-attendance-xlsx";

function bookFromAOA(aoa: unknown[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

describe("detectSubjectCount", () => {
  it("returns 1 for 6 or fewer columns (no subject blocks)", () => {
    expect(detectSubjectCount(6)).toBe(1);
    expect(detectSubjectCount(3)).toBe(1);
  });

  it("computes (cols - 6) / 5 for valid layouts", () => {
    expect(detectSubjectCount(11)).toBe(1);
    expect(detectSubjectCount(16)).toBe(2);
    expect(detectSubjectCount(31)).toBe(5);
  });

  it("caps at 11 subjects", () => {
    expect(detectSubjectCount(200)).toBe(11);
  });
});

describe("parseAttendanceSheet", () => {
  it("parses a single-subject sheet and computes attendance percent", () => {
    const aoa = [
      // row 0: header
      [
        "Student",
        "USN",
        "Father",
        "Parent Email",
        "Counsellor Email",
        "Remarks",
        "Maths",
        "Test (Max Marks 30)",
        "Assignment (Max Marks 10)",
        "Classes Held",
        "Classes Attended",
      ],
      // row 1: optional sub-header (empty here)
      [],
      // row 2: student
      [
        "Arjun Kumar",
        "1RV21CS001",
        "Mr. Kumar",
        "parent@example.com",
        "mentor@rvce.edu",
        "Good progress",
        "Maths",
        25,
        9,
        20,
        18,
      ],
    ];
    const buf = bookFromAOA(aoa);
    const parsed = parseAttendanceSheet(buf);

    expect(parsed.subjectCount).toBe(1);
    expect(parsed.testMarksHeader).toBe("Test");
    expect(parsed.assignmentHeader).toBe("Assignment");
    expect(parsed.students).toHaveLength(1);

    const s = parsed.students[0]!;
    expect(s.usn).toBe("1RV21CS001");
    expect(s.studentName).toBe("Arjun Kumar");
    expect(s.fatherName).toBe("Mr. Kumar");
    expect(s.parentEmail).toBe("parent@example.com");
    expect(s.counsellorEmail).toBe("mentor@rvce.edu");
    expect(s.remarks).toBe("Good progress");

    expect(s.subjects).toHaveLength(1);
    const sub = s.subjects[0]!;
    expect(sub.subject).toBe("Maths");
    expect(sub.testMarks).toBe("25");
    expect(sub.assignment).toBe("9");
    expect(sub.classesHeld).toBe(20);
    expect(sub.classesAttended).toBe(18);
    expect(sub.attendancePct).toBe(90); // 18/20 = 90%
  });

  it("treats '-' and blanks as missing and skips division by zero", () => {
    const aoa = [
      [
        "Student",
        "USN",
        "Father",
        "Parent",
        "Counsellor",
        "Remarks",
        "Maths",
        "Test",
        "Assignment",
        "Held",
        "Attended",
      ],
      [],
      ["Priya", "1RV21CS002", "Mr. Sharma", "p@x.com", "c@x.com", "", "Maths", "-", "", "-", "-"],
    ];
    const parsed = parseAttendanceSheet(bookFromAOA(aoa));
    const sub = parsed.students[0]!.subjects[0]!;
    expect(sub.testMarks).toBe("-");
    expect(sub.assignment).toBe("-");
    expect(sub.classesHeld).toBe("-");
    expect(sub.classesAttended).toBe("-");
    expect(sub.attendancePct).toBe("-");
  });

  it("caps attendance at 100% when attended > held", () => {
    const aoa = [
      ["Student", "USN", "Father", "Parent", "Counsellor", "Remarks", "Maths", "Test", "Asg", "Held", "Attended"],
      [],
      ["X", "1RV21CS099", "Mr. X", "x@x.com", "c@x.com", "", "Maths", 10, 5, 10, 12],
    ];
    const sub = parseAttendanceSheet(bookFromAOA(aoa)).students[0]!.subjects[0]!;
    expect(sub.attendancePct).toBe(100);
  });

  it("falls back to row 1 when row 0 is a category header like 'Professional Elective'", () => {
    const aoa = [
      [
        "Student",
        "USN",
        "Father",
        "Parent",
        "Counsellor",
        "Remarks",
        "Professional Elective",
        "Test",
        "Asg",
        "Held",
        "Attended",
      ],
      [
        null, null, null, null, null, null,
        "Machine Learning",
        null, null, null, null,
      ],
      ["Riya", "1RV21CS003", "Mr. Patel", "p@x.com", "c@x.com", "", null, 20, 8, 15, 14],
    ];
    const parsed = parseAttendanceSheet(bookFromAOA(aoa));
    expect(parsed.students[0]!.subjects[0]!.subject).toBe("Machine Learning");
  });

  it("respects explicit subjectCount override", () => {
    const aoa = [
      ["Student", "USN", "Father", "Parent", "Counsellor", "Remarks",
        "Maths", "T", "A", "H", "Att",
        "Physics", "T", "A", "H", "Att"],
      [],
      ["X", "1RV21CS010", "Y", "y@x.com", "c@x.com", "", "Maths", 10, 5, 10, 9, "Physics", 11, 6, 10, 8],
    ];
    const parsed = parseAttendanceSheet(bookFromAOA(aoa), { subjectCount: 1 });
    expect(parsed.subjectCount).toBe(1);
    expect(parsed.students[0]!.subjects).toHaveLength(1);
  });

  it("skips blank student rows", () => {
    const aoa = [
      ["Student", "USN", "Father", "Parent", "Counsellor", "Remarks", "Maths", "T", "A", "H", "Att"],
      [],
      ["", "", "", "", "", "", "", "", "", "", ""],
      ["Real", "1RV21CS020", "F", "p@x.com", "c@x.com", "", "Maths", 10, 5, 10, 9],
    ];
    const parsed = parseAttendanceSheet(bookFromAOA(aoa));
    expect(parsed.students).toHaveLength(1);
    expect(parsed.students[0]!.usn).toBe("1RV21CS020");
  });

  it("throws when sheet has fewer than 3 rows", () => {
    expect(() => parseAttendanceSheet(bookFromAOA([["a", "b"]]))).toThrow(
      /at least a header row/i,
    );
  });
});
