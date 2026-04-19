export interface AttendanceCampusSnapshot {
  campusId: string;
  campusName: string;
  date: string;
  totalStudents: number;
  presentCount: number;
  absenteeCount: number;
  lateCount: number;
  atRiskCount: number;
}

export interface AttendanceAlert {
  studentId: string;
  studentName: string;
  campusName: string;
  streakAbsentDays: number;
  guardianNotified: boolean;
}

/** Rolling daily campus-wide present rate (%) for charts — EdAI guide: 30-day trend. */
export interface DailyPresentRatePoint {
  date: string;
  ratePct: number;
}

export interface AttendanceDashboardResponse {
  syncedAt: string;
  campuses: AttendanceCampusSnapshot[];
  alerts: AttendanceAlert[];
  /** Trust-aggregated present rate, last 30 days */
  dailyPresentRate: DailyPresentRatePoint[];
}
