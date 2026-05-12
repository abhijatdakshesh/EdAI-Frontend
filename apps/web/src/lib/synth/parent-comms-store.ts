/**
 * In-memory store for parent comms BFF synth (KAN-41).
 * SYNTH_OK — single-replica deployment today.
 */

export interface StoredParentMessage {
  id: string;
  parentId: string;
  parentName: string;
  studentUsn: string;
  recipientId: string;
  recipientName: string;
  subject: string;
  body: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'REPLIED';
  replies: Array<{
    id: string;
    fromId: string;
    fromName: string;
    body: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export const parentMessagesStore: StoredParentMessage[] = [];
