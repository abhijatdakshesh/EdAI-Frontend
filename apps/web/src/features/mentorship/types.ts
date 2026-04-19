export type MenteeRisk = "low" | "medium" | "high";
export type SessionOutcome = "productive" | "needs_followup" | "escalated";

export interface MentorPair {
  mentorId: string;
  mentorName: string;
  designation: string;
  menteeCount: number;
  nextSessionDate: string;
}

export interface MenteeRecord {
  studentId: string;
  studentName: string;
  program: string;
  mentorName: string;
  riskLevel: MenteeRisk;
  lastSessionDate: string;
  sessionCount: number;
  lastOutcome: SessionOutcome;
  followUpDue: boolean;
}

export interface MentorshipDashboardResponse {
  fetchedAt: string;
  totalMentors: number;
  totalMentees: number;
  overdueFollowUps: number;
  mentors: MentorPair[];
  mentees: MenteeRecord[];
}
