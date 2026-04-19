export type TimelineEventKind =
  | "attendance"
  | "marks"
  | "fees"
  | "communication"
  | "alert"
  | "counselling";

export type TimelineEventPriority = "low" | "medium" | "high" | "critical";

export interface TimelineEvent {
  eventId: string;
  studentId: string;
  studentName: string;
  kind: TimelineEventKind;
  priority: TimelineEventPriority;
  title: string;
  detail: string;
  occurredAt: string;
  pinned: boolean;
  acknowledged: boolean;
}

export interface TimelineDashboardResponse {
  fetchedAt: string;
  events: TimelineEvent[];
}
