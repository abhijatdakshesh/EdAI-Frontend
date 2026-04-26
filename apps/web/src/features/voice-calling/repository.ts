import { apiGet, apiPost } from '@/lib/api/client';

import { mockCallLogsResponse } from './mock-data';
import type { CallLogsResponse, CallRecord, CallState, CallType, Language, TriggerCallRequest, TriggerCallResult } from './types';

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? 'true') === 'true';

export interface CallLogsFilters {
  callType?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

// Backend AICallLog shape
interface AICallLog {
  id: string;
  calledAt: string;
  studentName: string;
  studentUsn: string;
  parentId: string;
  language?: string;
  outcome: 'ANSWERED' | 'VOICEMAIL' | 'NO_ANSWER' | 'BUSY' | 'FAILED';
  duration: number;
  summary?: string;
  institutionId?: string;
}

// Backend trigger response
interface BackendTriggerResponse {
  callId: string;
  status: string;
  scheduledAt?: string;
}

const OUTCOME_TO_STATE: Record<string, CallState> = {
  ANSWERED: 'COMPLETED',
  VOICEMAIL: 'COMPLETED',
  NO_ANSWER: 'NO_ANSWER',
  BUSY: 'BUSY',
  FAILED: 'FAILED',
};

function mapLog(log: AICallLog): CallRecord {
  return {
    id: log.id,
    studentId: log.studentUsn,
    studentName: log.studentName,
    language: (log.language as Language | undefined) ?? 'en',
    callType: 'ABSENT_CALL' as CallType,
    state: OUTCOME_TO_STATE[log.outcome] ?? 'FAILED',
    durationSecs: log.duration > 0 ? log.duration : undefined,
    escalated: false,
    summaryEn: log.summary,
    whatsappSent: false,
    createdAt: log.calledAt,
  };
}

export async function triggerCall(req: TriggerCallRequest): Promise<TriggerCallResult> {
  if (USE_MOCK) {
    return { callId: 'call-mock-' + Date.now().toString(), status: 'INITIATED', message: 'Call queued successfully' };
  }
  try {
    const res = await apiPost<BackendTriggerResponse>('/api/comms/calls/trigger', {
      studentUsn: req.studentId,
      type: req.callType,
    });
    return { callId: res.callId, status: res.status, message: 'Call queued successfully' };
  } catch {
    return { callId: 'call-mock-' + Date.now().toString(), status: 'INITIATED', message: 'Call queued (offline mode)' };
  }
}

export async function getCallStatus(callId: string): Promise<CallRecord> {
  if (USE_MOCK) {
    const found = mockCallLogsResponse.calls.find((c) => c.id === callId);
    return found ?? { id: callId, studentId: '', studentName: '', language: 'kn', callType: 'ABSENT_CALL', state: 'COMPLETED', escalated: false, whatsappSent: false, createdAt: new Date().toISOString() };
  }
  try {
    const logs = await apiGet<AICallLog[]>('/api/comms/calls/recent');
    const found = logs.find((l) => l.id === callId);
    if (found) return mapLog(found);
  } catch {
    // fall through
  }
  return { id: callId, studentId: '', studentName: '', language: 'kn', callType: 'ABSENT_CALL', state: 'COMPLETED', escalated: false, whatsappSent: false, createdAt: new Date().toISOString() };
}

export async function getCallLogs(filters: CallLogsFilters = {}): Promise<CallLogsResponse> {
  if (USE_MOCK) return mockCallLogsResponse;
  try {
    const logs = await apiGet<AICallLog[]>('/api/admin/calls/logs');
    let mapped = logs.map(mapLog);
    if (filters.callType) mapped = mapped.filter((c) => c.callType === filters.callType);
    if (filters.status) mapped = mapped.filter((c) => c.state === filters.status);
    if (filters.from) mapped = mapped.filter((c) => c.createdAt >= filters.from!);
    if (filters.to) mapped = mapped.filter((c) => c.createdAt <= filters.to! + 'T23:59:59Z');
    return { calls: mapped, total: mapped.length };
  } catch {
    return mockCallLogsResponse;
  }
}
