export type DriveStatus = "upcoming" | "active" | "closed";
export type CandidateStatus = "eligible" | "applied" | "shortlisted" | "offered" | "rejected";
export type RoundKind = "aptitude" | "technical" | "hr" | "offer";

export interface PlacementDrive {
  driveId: string;
  company: string;
  role: string;
  ctcLpa: number;
  eligibleCount: number;
  appliedCount: number;
  shortlistedCount: number;
  offersCount: number;
  status: DriveStatus;
  scheduledDate: string;
}

export interface PlacementCandidate {
  studentId: string;
  studentName: string;
  program: string;
  driveId: string;
  company: string;
  status: CandidateStatus;
  currentRound: RoundKind | null;
}

export interface PlacementsDashboardResponse {
  refreshedAt: string;
  activeDrives: number;
  totalOffers: number;
  drives: PlacementDrive[];
  candidates: PlacementCandidate[];
}
