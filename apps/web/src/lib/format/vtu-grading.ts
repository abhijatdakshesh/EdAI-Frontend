export type VtuGrade = "O" | "A+" | "A" | "B+" | "B" | "C" | "P" | "F";

const GRADE_POINTS: Record<string, number> = {
  O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, P: 4, F: 0,
};

export function vtuGradeToPoints(grade: string): number {
  return GRADE_POINTS[grade] ?? 0;
}

export function computeVtuSgpa(subjects: { credits: number; grade: string }[]): number {
  const totalCredits = subjects.reduce((s, sub) => s + sub.credits, 0);
  if (totalCredits === 0) return 0;
  const weighted = subjects.reduce((s, sub) => s + sub.credits * vtuGradeToPoints(sub.grade), 0);
  return Math.round((weighted / totalCredits) * 100) / 100;
}

export function computeVtuCgpa(semesters: { credits: number; grade: string }[][]): number {
  return computeVtuSgpa(semesters.flat());
}
