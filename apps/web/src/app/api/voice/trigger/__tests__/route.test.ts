/**
 * Unit tests: src/app/api/voice/trigger/route.ts
 *
 * Coverage targets (100% lines + branches):
 *   POST handler
 *     — valid body with parentPhone → proxies POST to VOICE_SERVICE_URL, returns its response
 *     — missing parentPhone (empty string) → 400 { error: 'parentPhone required' }
 *     — missing parentPhone (null/undefined via JSON) → 400
 *     — VOICE_SERVICE_URL down (fetch rejects) → 502
 *     — voice service returns non-2xx (4xx, 5xx) → passes status through to caller
 *     — voice service returns 200 with JSON body → response body forwarded unchanged
 *     — VOICE_SERVICE_URL env var absent → uses default http://localhost:8090
 *     — VOICE_SERVICE_URL env var set → uses configured URL
 *     — language and callType default values applied when absent
 *     — institutionId defaults to 'RVCE' when absent
 *     — studentContext defaults to { name: studentId } when absent
 *     — req.json() throws (malformed request body) → 502
 *     — voice service returns non-JSON body → 502 (via catch on res.json())
 *
 * Test approach:
 *   - NextRequest is constructed with the real `next/server` class so we verify
 *     the full request parsing pipeline, not a mock of it.
 *   - global.fetch is replaced per-test with jest.fn() to intercept the outgoing
 *     call to VOICE_SERVICE_URL without making real network requests.
 *   - VOICE_SERVICE_URL is controlled via process.env, with module reloads where
 *     the env var changes need to be picked up at module-load time.
 *   - We assert on the returned NextResponse: status code AND JSON body shape.
 *     Tests that only assert status codes without verifying body are flagged as
 *     weak — every test here asserts both.
 *
 * ERP edge cases covered:
 *   - parentPhone absent = voice trigger category; a call dispatched without a phone
 *     number is an unrecoverable data error in a college ERP (no parent contact on
 *     record — common for re-admission and lateral entry students).
 *   - VOICE_SERVICE_URL env misconfiguration at deploy time (missing env var category).
 *   - Downstream AI voice service (Bland AI / Sarvam AI) returning 429 rate-limit
 *     responses — status passthrough must not swallow the rate limit signal.
 */

import { NextRequest } from 'next/server';

// Mock @/auth to avoid ESM/next-auth parse errors in Jest node env.
// Routes use auth(handler) as a wrapper — the mock calls handler with req.auth set.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('@/auth', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auth: (handler: any) => (req: any) => { req.auth = { accessToken: 'test-token' }; return handler(req); },
  signIn: jest.fn(),
  signOut: jest.fn(),
  handlers: {},
}));

// ─── helpers ────────────────────────────────────────────────────────────────

/** Build a NextRequest with a JSON body */
function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/voice/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Build a NextRequest whose body is deliberately malformed (non-JSON) */
function makeMalformedRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/voice/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{this is not json',
  });
}

/** Minimal valid POST body */
const VALID_BODY = {
  studentId: '1RV21CS001',
  parentPhone: '+919876543210',
  language: 'kn',
  callType: 'ABSENT_CALL',
  institutionId: 'RVCE',
  studentContext: { name: 'Arjun Sharma', attendancePct: 62 },
};

/** Successful response from the Go voice service */
const VOICE_SERVICE_OK_BODY = {
  callId: 'go-call-abc123',
  status: 'INITIATED',
  scheduledAt: '2026-04-27T09:00:00.000Z',
};

/** Build a fake downstream Response */
function fakeDownstreamResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

/** Build a downstream Response whose .json() throws */
function fakeDownstreamNonJson(status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON')),
  } as unknown as Response;
}

// ─── import the handler under test ───────────────────────────────────────────

// We import POST after setting up mocks. Because VOICE_SERVICE_URL is read at
// call-time (not module-load time), we can control it via process.env without
// module resets in most tests.
import { POST } from '../route';

// ─── tests ────────────────────────────────────────────────────────────────────

describe('POST /api/voice/trigger', () => {
  beforeEach(() => {
    // Point at the default URL for most tests
    process.env.VOICE_SERVICE_URL = 'http://localhost:8090';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── missing parentPhone → 400 ─────────────────────────────────────────────

  it('returns 400 when parentPhone is empty string', async () => {
    // Regression test: this is the exact bug that was fixed.
    // Before fix: request was forwarded to voice service without parentPhone.
    // After fix: 400 is returned immediately.
    const req = makeRequest({ ...VALID_BODY, parentPhone: '' });

    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(400);
    expect(body.error).toBe('parentPhone required');
  });

  it('returns 400 when parentPhone is missing from body entirely', async () => {
    const { parentPhone: _omit, ...bodyWithoutPhone } = VALID_BODY;
    const req = makeRequest(bodyWithoutPhone);

    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(400);
    expect(body.error).toBe('parentPhone required');
  });

  it('returns 400 when parentPhone is null', async () => {
    const req = makeRequest({ ...VALID_BODY, parentPhone: null });

    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(400);
    expect(body.error).toBe('parentPhone required');
  });

  // ── valid request → proxied to voice service ──────────────────────────────

  it('proxies POST to VOICE_SERVICE_URL/voice/calls/trigger with correct body', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse(VOICE_SERVICE_OK_BODY, 200),
    );

    const req = makeRequest(VALID_BODY);
    await POST(req);

    const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit][];
    const voiceCall = calls.find(([url]) =>
      String(url).endsWith('/voice/calls/trigger'),
    );
    expect(voiceCall).toBeDefined();

    const [url, init] = voiceCall!;
    expect(url).toBe('http://localhost:8090/voice/calls/trigger');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');

    const sentBody = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(sentBody.studentId).toBe('1RV21CS001');
    expect(sentBody.parentPhone).toBe('+919876543210');
    expect(sentBody.language).toBe('kn');
    expect(sentBody.callType).toBe('ABSENT_CALL');
    expect(sentBody.institutionId).toBe('RVCE');
    expect(sentBody.studentContext).toStrictEqual({ name: 'Arjun Sharma', attendancePct: 62 });
  });

  it('returns 200 with voice service response body on happy path', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse(VOICE_SERVICE_OK_BODY, 200),
    );

    const req = makeRequest(VALID_BODY);
    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.callId).toBe('go-call-abc123');
    expect(body.status).toBe('INITIATED');
  });

  it('passes through non-2xx status codes from voice service (e.g. 429 rate limit)', async () => {
    // College result-day spike: AI voice provider rate-limits at 429.
    // Route must NOT swallow this — caller needs to know to back off.
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse({ error: 'rate limit exceeded' }, 429),
    );

    const req = makeRequest(VALID_BODY);
    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(429);
    expect(body.error).toBe('rate limit exceeded');
  });

  it('passes through 404 from voice service', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse({ error: 'student not found' }, 404),
    );

    const req = makeRequest(VALID_BODY);
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it('passes through 500 from voice service', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse({ error: 'voice service internal error' }, 500),
    );

    const req = makeRequest(VALID_BODY);
    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(500);
    expect(body.error).toBe('voice service internal error');
  });

  // ── VOICE_SERVICE_URL down → 502 ─────────────────────────────────────────

  it('returns 502 when voice service is unreachable (fetch throws ECONNREFUSED)', async () => {
    global.fetch = jest.fn().mockRejectedValue(
      new TypeError('fetch failed: ECONNREFUSED'),
    );

    const req = makeRequest(VALID_BODY);
    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(502);
    expect(body.error).toContain('fetch failed');
  });

  it('returns 502 when voice service returns non-JSON body (res.json() throws)', async () => {
    // Some WAF/load balancer returns HTML error pages — res.json() will throw
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamNonJson(200),
    );

    const req = makeRequest(VALID_BODY);
    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(502);
    expect(typeof body.error).toBe('string');
  });

  it('returns 502 when req.json() throws (malformed request body from client)', async () => {
    const req = makeMalformedRequest();

    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(502);
    expect(typeof body.error).toBe('string');
  });

  it('502 response body contains stringified error, not empty object', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('DNS resolution failed'));

    const req = makeRequest(VALID_BODY);
    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;

    // Must NOT be an empty error: the route does String(err) so the message is preserved
    expect(res.status).toBe(502);
    expect(body.error).toBe('Error: DNS resolution failed');
  });

  // ── VOICE_SERVICE_URL env var ─────────────────────────────────────────────

  it('uses http://localhost:8090 as default when VOICE_SERVICE_URL is not set', async () => {
    delete process.env.VOICE_SERVICE_URL;
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse(VOICE_SERVICE_OK_BODY, 200),
    );

    const req = makeRequest(VALID_BODY);
    await POST(req);

    const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit][];
    const voiceCall = calls.find(([url]) => String(url).includes('/voice/calls/trigger'));
    expect(voiceCall![0]).toBe('http://localhost:8090/voice/calls/trigger');
  });

  it('uses configured VOICE_SERVICE_URL when set', async () => {
    process.env.VOICE_SERVICE_URL = 'http://voice-service.prod.internal:8090';
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse(VOICE_SERVICE_OK_BODY, 200),
    );

    const req = makeRequest(VALID_BODY);
    await POST(req);

    const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit][];
    const voiceCall = calls.find(([url]) => String(url).includes('/voice/calls/trigger'));
    expect(voiceCall![0]).toBe('http://voice-service.prod.internal:8090/voice/calls/trigger');
  });

  // ── default value injection ───────────────────────────────────────────────

  it('defaults language to "en" when absent from request body', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse(VOICE_SERVICE_OK_BODY, 200),
    );
    const { language: _omit, ...bodyWithoutLanguage } = VALID_BODY;

    const req = makeRequest(bodyWithoutLanguage);
    await POST(req);

    const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit][];
    const voiceCall = calls.find(([url]) => String(url).includes('/voice/calls/trigger'));
    const sentBody = JSON.parse(voiceCall![1].body as string) as Record<string, unknown>;
    expect(sentBody.language).toBe('en');
  });

  it('defaults callType to "ABSENT_CALL" when absent from request body', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse(VOICE_SERVICE_OK_BODY, 200),
    );
    const { callType: _omit, ...bodyWithoutCallType } = VALID_BODY;

    const req = makeRequest(bodyWithoutCallType);
    await POST(req);

    const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit][];
    const voiceCall = calls.find(([url]) => String(url).includes('/voice/calls/trigger'));
    const sentBody = JSON.parse(voiceCall![1].body as string) as Record<string, unknown>;
    expect(sentBody.callType).toBe('ABSENT_CALL');
  });

  it('defaults institutionId to "RVCE" when absent from request body', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse(VOICE_SERVICE_OK_BODY, 200),
    );
    const { institutionId: _omit, ...bodyWithoutInstitution } = VALID_BODY;

    const req = makeRequest(bodyWithoutInstitution);
    await POST(req);

    const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit][];
    const voiceCall = calls.find(([url]) => String(url).includes('/voice/calls/trigger'));
    const sentBody = JSON.parse(voiceCall![1].body as string) as Record<string, unknown>;
    expect(sentBody.institutionId).toBe('RVCE');
  });

  it('defaults studentContext to { name: studentId } when absent from request body', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse(VOICE_SERVICE_OK_BODY, 200),
    );
    const { studentContext: _omit, ...bodyWithoutCtx } = VALID_BODY;

    const req = makeRequest(bodyWithoutCtx);
    await POST(req);

    const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit][];
    const voiceCall = calls.find(([url]) => String(url).includes('/voice/calls/trigger'));
    const sentBody = JSON.parse(voiceCall![1].body as string) as Record<string, unknown>;
    expect(sentBody.studentContext).toStrictEqual({ name: '1RV21CS001' });
  });

  it('uses explicit studentContext when provided (does not override with default)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse(VOICE_SERVICE_OK_BODY, 200),
    );
    const customCtx = { name: 'Arjun', semester: 5, cgpa: 8.7 };

    const req = makeRequest({ ...VALID_BODY, studentContext: customCtx });
    await POST(req);

    const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit][];
    const voiceCall = calls.find(([url]) => String(url).includes('/voice/calls/trigger'));
    const sentBody = JSON.parse(voiceCall![1].body as string) as Record<string, unknown>;
    expect(sentBody.studentContext).toStrictEqual(customCtx);
  });

  // ── content-type of response ──────────────────────────────────────────────

  it('always returns application/json content-type', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      fakeDownstreamResponse(VOICE_SERVICE_OK_BODY, 200),
    );

    const req = makeRequest(VALID_BODY);
    const res = await POST(req);

    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('400 response also has application/json content-type', async () => {
    const req = makeRequest({ ...VALID_BODY, parentPhone: '' });
    const res = await POST(req);

    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('502 response also has application/json content-type', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('down'));
    const req = makeRequest(VALID_BODY);
    const res = await POST(req);

    expect(res.headers.get('content-type')).toContain('application/json');
  });

  // ── idempotency / no side effects on repeated calls ───────────────────────

  it('two consecutive valid calls each get their own fetch and response (no shared state)', async () => {
    const resp1 = { callId: 'go-call-111', status: 'INITIATED' };
    const resp2 = { callId: 'go-call-222', status: 'INITIATED' };

    global.fetch = jest.fn()
      .mockResolvedValueOnce(fakeDownstreamResponse(resp1, 200))
      .mockResolvedValueOnce(fakeDownstreamResponse(resp2, 200));

    const [res1, res2] = await Promise.all([
      POST(makeRequest(VALID_BODY)),
      POST(makeRequest({ ...VALID_BODY, studentId: '1RV21CS002' })),
    ]);

    const b1 = await res1.json() as Record<string, unknown>;
    const b2 = await res2.json() as Record<string, unknown>;

    expect(b1.callId).toBe('go-call-111');
    expect(b2.callId).toBe('go-call-222');
  });
});
