import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { automationRulesStore, type StoredAutomationRule } from '@/lib/synth/admin-store';

/**
 * Automation rules — BFF synth (KAN-52).
 *
 * Backend has no `/api/automation/rules` endpoint. The admin UI's
 * "+ New Rule" button now opens a modal that POSTs here, the BFF mints
 * an id and stores in memory. SYNTH_OK — TODO move to backend rules
 * engine once provisioned.
 */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  return NextResponse.json(automationRulesStore);
});

export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  let body: Partial<StoredAutomationRule> = {};
  try {
    body = (await req.json()) as Partial<StoredAutomationRule>;
  } catch {
    /* ignore */
  }
  if (!body.name || !body.trigger || !body.condition) {
    return NextResponse.json(
      { error: 'name, trigger and condition are required' },
      { status: 400 },
    );
  }
  const id = `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const created: StoredAutomationRule = {
    id,
    name: body.name,
    trigger: body.trigger,
    condition: body.condition,
    actions: body.actions?.length ? body.actions : ['Log alert'],
    enabled: body.enabled ?? true,
    runsToday: 0,
    createdAt: new Date().toISOString(),
  };
  automationRulesStore.push(created);
  return NextResponse.json(created, { status: 201 });
});
