import type { AttendanceDashboardResponse } from "./types";

function last30DaysRates(): { date: string; ratePct: number }[] {
  const out: { date: string; ratePct: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const wave = Math.sin(i / 5) * 2;
    const ratePct = Math.round((90 + wave + (i % 4) * 0.35) * 10) / 10;
    out.push({
      date: d.toISOString().slice(0, 10),
      ratePct,
    });
  }
  return out;
}

export const mockAttendanceDashboard: AttendanceDashboardResponse = {
  syncedAt: new Date().toISOString(),
  dailyPresentRate: last30DaysRates(),
  campuses: [
    {
      campusId: "rvce-main",
      campusName: "Raycraft HQ Campus",
      date: "2026-04-18",
      totalStudents: 4210,
      presentCount: 3912,
      absenteeCount: 298,
      lateCount: 73,
      atRiskCount: 41
    },
    {
      campusId: "rvpu-bangalore",
      campusName: "RVPU Bangalore",
      date: "2026-04-18",
      totalStudents: 2380,
      presentCount: 2215,
      absenteeCount: 165,
      lateCount: 34,
      atRiskCount: 19
    }
  ],
  alerts: [
    {
      studentId: "STU1044",
      studentName: "A. Nair",
      campusName: "Raycraft HQ Campus",
      streakAbsentDays: 4,
      guardianNotified: true
    },
    {
      studentId: "STU5521",
      studentName: "M. Gowda",
      campusName: "RVPU Bangalore",
      streakAbsentDays: 3,
      guardianNotified: false
    }
  ]
};
