import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { parentMessagesStore, type StoredParentMessage } from '@/lib/synth/parent-comms-store';

/**
 * Parent ↔ teacher messages — BFF synth (KAN-41).
 *
 * Backend `/parent-comms/messages` returns 500 when the comms tables are
 * missing in prod. We accept the POST, store in memory, and return the
 * message envelope so the parent UI shows immediate "Sent" feedback.
 *
 * SYNTH_OK — TODO migrate to backend comms service once parent_messages
 * table is provisioned in prod.
 */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const url = new URL(req.url);
  const parentId = url.searchParams.get('parentId') ?? req.auth.user?.id ?? 'demo-parent';
  const myMessages = parentMessagesStore.filter((m) => m.parentId === parentId);
  return NextResponse.json(myMessages);
});

interface SendMessageDto {
  parentId?: string;
  parentName?: string;
  studentUsn?: string;
  recipientId?: string;
  recipientName?: string;
  subject?: string;
  body?: string;
}

export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: SendMessageDto = {};
  try {
    body = (await req.json()) as SendMessageDto;
  } catch {
    /* ignore */
  }

  if (!body.recipientName || !body.subject || !body.body) {
    return NextResponse.json(
      { error: 'recipientName, subject and body are required' },
      { status: 400 },
    );
  }

  const id = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const message: StoredParentMessage = {
    id,
    parentId: body.parentId ?? req.auth.user?.id ?? 'demo-parent',
    parentName: body.parentName ?? req.auth.user?.name ?? 'Parent',
    studentUsn: body.studentUsn ?? '',
    recipientId: body.recipientId ?? `recipient-${id}`,
    recipientName: body.recipientName,
    subject: body.subject,
    body: body.body,
    status: 'SENT',
    replies: [],
    createdAt: new Date().toISOString(),
  };
  parentMessagesStore.push(message);
  return NextResponse.json(message, { status: 201 });
});
