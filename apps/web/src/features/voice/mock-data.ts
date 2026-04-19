import type { VoiceDashboardResponse } from "./types";

export const mockVoiceDashboard: VoiceDashboardResponse = {
  refreshedAt: new Date().toISOString(),
  queue: [
    {
      callId: "CALL-1031",
      guardianName: "Lakshmi Rao",
      studentName: "R. Nikhil",
      language: "Kannada",
      queuedAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      priority: "high",
      status: "queued"
    },
    {
      callId: "CALL-1032",
      guardianName: "Meera Iyer",
      studentName: "A. Tejas",
      language: "English",
      queuedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      priority: "medium",
      status: "in_progress"
    }
  ],
  transcripts: [
    {
      callId: "CALL-1003",
      summary: "Parent requested attendance counselling support.",
      sentiment: "neutral",
      requiresEscalation: true
    },
    {
      callId: "CALL-1004",
      summary: "Fee deadline clarification completed successfully.",
      sentiment: "positive",
      requiresEscalation: false
    }
  ]
};
