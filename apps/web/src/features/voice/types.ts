export interface VoiceQueueItem {
  callId: string;
  guardianName: string;
  studentName: string;
  language: string;
  queuedAt: string;
  priority: "low" | "medium" | "high";
  status: "queued" | "in_progress" | "escalated" | "resolved";
}

export interface VoiceTranscript {
  callId: string;
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  requiresEscalation: boolean;
}

export interface VoiceDashboardResponse {
  refreshedAt: string;
  queue: VoiceQueueItem[];
  transcripts: VoiceTranscript[];
}
