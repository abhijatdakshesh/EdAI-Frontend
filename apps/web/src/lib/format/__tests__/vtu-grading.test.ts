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
  });
});

describe("computeVtuSgpa", () => {
  it("computes weighted average correctly", () => {
    const subjects = [
      { credits: 4, grade: "O" },  // 10pts
      { credits: 3, grade: "A" },  // 8pts
      { credits: 3, grade: "B+" }, // 7pts
    ];
    // (4*10 + 3*8 + 3*7) / 10 = 85/10 = 8.5
    expect(computeVtuSgpa(subjects)).toBe(8.5);
  });

  it("returns 0 for empty array", () => {
    expect(computeVtuSgpa([])).toBe(0);
  });

  it("handles all F grades", () => {
    expect(computeVtuSgpa([{ credits: 4, grade: "F" }])).toBe(0);
  });

  it("falls back to 0 for legacy grades", () => {
    expect(computeVtuSgpa([{ credits: 4, grade: "S" }])).toBe(0);
  });
});

describe("computeVtuCgpa", () => {
  it("aggregates across semesters", () => {
    const sem1 = [{ credits: 4, grade: "O" }, { credits: 3, grade: "A+" }];
    const sem2 = [{ credits: 4, grade: "A" }, { credits: 3, grade: "B+" }];
    expect(computeVtuCgpa([sem1, sem2])).toBe(computeVtuSgpa([...sem1, ...sem2]));
  });
});
