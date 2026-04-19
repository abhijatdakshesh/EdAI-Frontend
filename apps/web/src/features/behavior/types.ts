export type IncidentCategory =
  | "academic_dishonesty"
  | "bullying"
  | "misconduct"
  | "property_damage"
  | "substance_abuse"
  | "attendance_fraud"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "under_investigation" | "action_taken" | "closed";

export interface BehaviorIncident {
  incidentId: string;
  studentName: string;
  studentId: string;
  class: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy: string;
  reportedAt: string;
  description: string;
  isRepeatOffender: boolean;
}

export interface BehaviorDashboardResponse {
  refreshedAt: string;
  openIncidents: number;
  criticalIncidents: number;
  repeatOffenders: number;
  incidents: BehaviorIncident[];
}
