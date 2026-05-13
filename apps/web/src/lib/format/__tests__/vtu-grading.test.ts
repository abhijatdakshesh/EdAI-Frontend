import { vtuGradeToPoints, computeVtuSgpa, computeVtuCgpa } from "../vtu-grading";

describe("vtuGradeToPoints", () => {
  it.each([
    ["O", 10], ["A+", 9], ["A", 8], ["B+", 7],
    ["B", 6], ["C", 5], ["P", 4], ["F", 0],
  ])("%s → %i", (grade, pts) => {
    expect(vtuGradeToPoints(grade)).toBe(pts);
  });

  it("returns 0 for unknown/legacy grades", () => {
    expect(vtuGradeToPoints("S")).toBe(0);
    expect(vtuGradeToPoints("D")).toBe(0);
    expect(vtuGradeToPoints("WH")).toBe(0);
  });
});

describe("computeVtuSgpa", () => {
  it("computes weighted average (4×10 + 3×8 + 3×7) / 10 = 8.5", () => {
    const subjects = [
      { credits: 4, grade: "O" },
      { credits: 3, grade: "A" },
      { credits: 3, grade: "B+" },
    ];
    expect(computeVtuSgpa(subjects)).toBe(8.5);
  });

  it("rounds to 2dp for non-exact division (58/7 = 8.29)", () => {
    const subs = [{ credits: 3, grade: "O" }, { credits: 4, grade: "B+" }];
    expect(computeVtuSgpa(subs)).toBe(8.29);
  });

  it("returns 0 for empty array", () => {
    expect(computeVtuSgpa([])).toBe(0);
  });

  it("handles all F grades", () => {
    expect(computeVtuSgpa([{ credits: 4, grade: "F" }])).toBe(0);
  });

  it("returns 0 for legacy grades (S/D)", () => {
    expect(computeVtuSgpa([{ credits: 4, grade: "S" }])).toBe(0);
  });
});

describe("computeVtuCgpa — concrete values", () => {
  it("returns 0 for empty semesters array", () => {
    expect(computeVtuCgpa([])).toBe(0);
  });

  it("single-semester CGPA equals SGPA numeric value (57/7 = 8.14)", () => {
    const sem = [{ credits: 4, grade: "A+" }, { credits: 3, grade: "B+" }];
    // (4*9 + 3*7) / 7 = 57/7 = 8.142857 → 8.14
    expect(computeVtuCgpa([sem])).toBe(8.14);
  });

  it("aggregates two semesters with concrete expected value (120/14 = 8.57)", () => {
    const sem1 = [{ credits: 4, grade: "O" }, { credits: 3, grade: "A+" }];
    const sem2 = [{ credits: 4, grade: "A" }, { credits: 3, grade: "B+" }];
    // (4*10 + 3*9 + 4*8 + 3*7) / 14 = 120/14 = 8.571... → 8.57
    expect(computeVtuCgpa([sem1, sem2])).toBe(8.57);
  });

  it("all-F grades across all semesters: CGPA is 0", () => {
    const sem1 = [{ credits: 4, grade: "F" }, { credits: 3, grade: "F" }];
    expect(computeVtuCgpa([sem1])).toBe(0);
  });
});
