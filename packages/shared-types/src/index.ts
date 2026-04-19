export type UserRole = "admin" | "faculty" | "parent" | "student";

export interface ModuleStatus {
  module: string;
  syncedAt: string;
  status: "healthy" | "warning" | "error";
}

export interface AttendanceSummary {
  campusId: string;
  date: string;
  absenteeCount: number;
  totalStudents: number;
}

export type BuildPhase =
  | "phase0_foundation"
  | "phase1_identity"
  | "phase2_attendance"
  | "phase3_voice"
  | "phase4_academics_fees"
  | "phase5_comms_timeline"
  | "phase6_student_support"
  | "phase7_compliance_analytics"
  | "phase8_integrations";

export interface FrontendModule {
  key: string;
  phase: BuildPhase;
  title: string;
  owner: "web" | "mobile" | "shared";
  route: string;
  description: string;
  ready: boolean;
}
