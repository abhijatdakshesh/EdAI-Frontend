/**
 * Unit tests: src/app/api/admin/naac/metrics/route.ts
 *
 * Coverage targets — 100% lines + branches on the GET handler:
 *   - Happy path: all 7 criteria scored → cgp, grade, criteria array, strengths, areasForImprovement
 *   - Backend non-ok (404, 500) → proxied status + { error: 'Backend error: <status>' }
 *   - fetch throws (ECONNREFUSED, DNS failure) → 502 + stringified error
 *   - Missing academicYear query param → defaults to '2024-25'
 *   - Explicit academicYear query param → forwarded (including URL-encoding)
 *   - COMPLIANCE_SERVICE_URL env var absent → falls back to http://localhost:3002
 *   - COMPLIANCE_SERVICE_URL env var set → uses configured URL
 *   - Grade boundary conditions (all 8 NAAC grades: A++ / A+ / A / B++ / B+ / B / C / D)
 *   - Strengths derivation: score/maxScore >= 0.70 → included; exactly 0.70 is in
 *   - areasForImprovement derivation: score/maxScore < 0.50
 *     - score === 0  → "not yet assessed" label
 *     - score > 0   → "N% (needs improvement)" label
 *   - Gap zone (0.50 <= ratio < 0.70) → appears in neither bucket
 *   - maxScore === 0 criterion → excluded from both strengths AND areasForImprovement
 *   - null score criterion → treated as 0 in CGP sum, excluded from both buckets if maxScore also null
 *   - Empty lastUpdated string → "Not assessed" (falsy branch in criteria map)
 *   - No strengths from data → fallback 'Data collection in progress'
 *   - No areasForImprovement from data → fallback 'All criteria need evidence uploads'
 *   - 502 error body contains String(err), not an empty object
 *   - Response is always application/json
 *   - Unknown criterion number → falls back to "Criterion N" name
 *
 * Test approach:
 *   - NextRequest is constructed via real `next/server` so the URL + searchParams
 *     pipeline is exercised as it would be in production.
 *   - global.fetch is replaced per-test with jest.fn() — the only acceptable mock
 *     here because the compliance service is a third-party HTTP boundary.
 *   - COMPLIANCE_SERVICE_URL is read at call-time inside the handler, so process.env
 *     can be mutated between tests without module resets.
 *   - Every test asserts both status code AND response body shape — tests that only
 *     check status are not tests, they are false confidence.
 *
 * NAAC/ERP edge cases covered:
 *   - Criteria with null scores (new college, data not yet collected)
 *   - Criterion outside 1-7 range (data migration artefact from legacy ERP)
 *   - All-null criteria (brand-new institution, first NAAC cycle)
 *   - Score = 0 with maxScore > 0 (criterion not yet assessed — different from null)
 *   - Grade boundary straddling due to Math.round (3.505 rounds to 3.51 = A++, etc.)
 *   - encodeURIComponent on academicYear containing forward slashes (VTU uses 2024/25)
 */

import { NextRequest } from 'next/server';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Build a GET NextRequest with optional academicYear query param */
function makeGetRequest(academicYear?: string): NextRequest {
  const url = academicYear
    ? `http://localhost:3000/api/admin/naac/metrics?academicYear=${encodeURIComponent(academicYear)}`
    : 'http://localhost:3000/api/admin/naac/metrics';
  return new NextRequest(url, { method: 'GET' });
}

/**
 * Build a mock downstream Response for the compliance service.
 * Using an object literal (not new Response) so we don't pull in the Fetch
 * API polyfill — the Node test env may not have it.
 */
function fakeOkResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function fakeErrorResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: jest.fn().mockResolvedValue({ detail: 'error' }),
  } as unknown as Response;
}

/**
 * Build a NaacDashboardCriterion fixture.
 * All fields optional with sensible defaults so individual tests only specify
 * the fields under test.
 */
function makeCriterion(overrides: {
  criterion?: number;
  score?: number | null;
  maxScore?: number | null;
  pct?: number | null;
  lastUpdated?: string;
}) {
  return {
    criterion: overrides.criterion ?? 1,
    score: overrides.score !== undefined ? overrides.score : 100,
    maxScore: overrides.maxScore !== undefined ? overrides.maxScore : 150,
    pct: overrides.pct ?? null,
    lastUpdated: overrides.lastUpdated ?? '2024-01-15',
  };
}

/**
 * Build a full 7-criterion backend payload with a given total raw score.
 * Distributes the score across all 7 criteria proportionally (criterion 1 gets
 * the remainder to keep arithmetic exact).
 */
function payloadWithTotalRaw(totalRaw: number): { academicYear: string; criteria: ReturnType<typeof makeCriterion>[] } {
  // Spread evenly: 6 criteria get floor(totalRaw/7), criterion 1 gets the rest
  const base = Math.floor(totalRaw / 7);
  const remainder = totalRaw - base * 6;
  return {
    academicYear: '2024-25',
    criteria: [
      makeCriterion({ criterion: 1, score: remainder, maxScore: 200 }),
      makeCriterion({ criterion: 2, score: base, maxScore: 200 }),
      makeCriterion({ criterion: 3, score: base, maxScore: 150 }),
      makeCriterion({ criterion: 4, score: base, maxScore: 150 }),
      makeCriterion({ criterion: 5, score: base, maxScore: 150 }),
      makeCriterion({ criterion: 6, score: base, maxScore: 100 }),
      makeCriterion({ criterion: 7, score: base, maxScore: 50 }),
    ],
  };
}

// ─── import the handler under test ───────────────────────────────────────────

// COMPLIANCE_SERVICE_URL is read at call-time inside the handler body (line 33
// of route.ts: `const COMPLIANCE_SERVICE_URL = process.env.COMPLIANCE_SERVICE_URL ?? …`)
// so we can mutate process.env between tests without module reloads.

import { GET } from '../metrics/route';

// ─── test suites ─────────────────────────────────────────────────────────────

describe('GET /api/admin/naac/metrics', () => {
  beforeEach(() => {
    process.env.COMPLIANCE_SERVICE_URL = 'http://localhost:3002';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── happy path ────────────────────────────────────────────────────────────

  describe('happy path — all 7 criteria scored', () => {
    const ALL_SCORED_PAYLOAD = {
      academicYear: '2024-25',
      criteria: [
        makeCriterion({ criterion: 1, score: 130, maxScore: 150 }), // 86.7% → strength
        makeCriterion({ criterion: 2, score: 140, maxScore: 200 }), // 70.0% → strength (boundary)
        makeCriterion({ criterion: 3, score:  90, maxScore: 150 }), // 60.0% → gap (neither)
        makeCriterion({ criterion: 4, score:  70, maxScore: 150 }), // 46.7% → improvement, score>0
        makeCriterion({ criterion: 5, score:   0, maxScore: 100 }), // 0%    → improvement, score===0
        makeCriterion({ criterion: 6, score:  80, maxScore: 100 }), // 80.0% → strength
        makeCriterion({ criterion: 7, score:  40, maxScore:  50 }), // 80.0% → strength
      ],
    };
    // totalRaw = 130+140+90+70+0+80+40 = 550
    // totalMax = 150+200+150+150+100+100+50 = 900
    // cgp = Math.round((550/900)*4*100)/100 = Math.round(244.44)/100 = 2.44

    it('returns 200 with correct overallScore (CGP) and grade', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(ALL_SCORED_PAYLOAD));
      const res = await GET(makeGetRequest('2024-25'));
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.overallScore).toBe(2.44);
      expect(body.grade).toBe('B'); // 2.44 >= 2.01 → B
    });

    it('returns criteria array with all 7 entries in correct shape', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(ALL_SCORED_PAYLOAD));
      const res = await GET(makeGetRequest('2024-25'));
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      expect(criteria).toHaveLength(7);
      // Spot-check criterion 1
      expect(criteria[0]).toMatchObject({
        id: 'C1',
        name: 'Curricular Aspects',
        score: 130,
        maxScore: 150,
        trend: 'STABLE',
      });
      // Spot-check criterion 7
      expect(criteria[6]).toMatchObject({
        id: 'C7',
        name: 'Institutional Values and Best Practices',
        score: 40,
        maxScore: 50,
      });
    });

    it('formats lastUpdated as en-IN locale string when date is valid', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(ALL_SCORED_PAYLOAD));
      const res = await GET(makeGetRequest('2024-25'));
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      // '2024-01-15' → '15 Jan 2024' in en-IN locale
      expect(criteria[0].lastUpdated).toBe('15 Jan 2024');
    });

    it('derives strengths: criteria with score/maxScore >= 0.70', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(ALL_SCORED_PAYLOAD));
      const res = await GET(makeGetRequest('2024-25'));
      const body = await res.json() as Record<string, unknown>;
      const strengths = body.strengths as string[];

      // Criteria 1 (87%), 2 (70% exact boundary), 6 (80%), 7 (80%) → 4 strengths
      expect(strengths).toHaveLength(4);
      expect(strengths[0]).toContain('Curricular Aspects');
      expect(strengths[0]).toContain('87%');
      expect(strengths[1]).toContain('Teaching-Learning and Evaluation');
      expect(strengths[1]).toContain('70%');
    });

    it('derives areasForImprovement: criteria with score/maxScore < 0.50', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(ALL_SCORED_PAYLOAD));
      const res = await GET(makeGetRequest('2024-25'));
      const body = await res.json() as Record<string, unknown>;
      const areas = body.areasForImprovement as string[];

      // Criterion 4 (46.7%, score > 0) and criterion 5 (0%, score === 0) → 2 areas
      expect(areas).toHaveLength(2);
      // score > 0 variant
      expect(areas[0]).toContain('Infrastructure and Learning Resources');
      expect(areas[0]).toContain('47%'); // Math.round(70/150*100) = 47
      expect(areas[0]).toContain('needs improvement');
      // score === 0 variant
      expect(areas[1]).toContain('Student Support and Progression');
      expect(areas[1]).toContain('not yet assessed');
    });

    it('always returns application/json content-type', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(ALL_SCORED_PAYLOAD));
      const res = await GET(makeGetRequest('2024-25'));
      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  // ── NAAC grade boundary conditions ───────────────────────────────────────

  describe('grade boundary conditions', () => {
    /**
     * Grade transition points (verified by sweeping raw 0–1000 against the
     * route's Math.round((raw/1000)*4*100)/100 CGP formula):
     *   A++ : raw >= 877  (cgp = 3.51)
     *   A+  : raw 814–876 (cgp 3.26–3.50)
     *   A   : raw 752–813 (cgp 3.01–3.25)
     *   B++ : raw 689–751 (cgp 2.76–3.00)
     *   B+  : raw 627–688 (cgp 2.51–2.75)
     *   B   : raw 502–626 (cgp 2.01–2.50)
     *   C   : raw 377–501 (cgp 1.51–2.00)
     *   D   : raw 0–376   (cgp 0–1.50)
     *
     * We test both the first raw score that triggers the grade (lower boundary)
     * and the last raw score in the band below it (to confirm the boundary does
     * not bleed across).
     */

    async function gradeForRaw(raw: number): Promise<string> {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(payloadWithTotalRaw(raw)),
      );
      const res = await GET(makeGetRequest('2024-25'));
      const body = await res.json() as Record<string, unknown>;
      return body.grade as string;
    }

    it('returns A++ for raw=877 (cgp=3.51, lowest A++ entry point)', async () => {
      expect(await gradeForRaw(877)).toBe('A++');
    });

    it('returns A++ for raw=1000 (maximum possible score)', async () => {
      expect(await gradeForRaw(1000)).toBe('A++');
    });

    it('returns A+ for raw=876 (cgp=3.50, highest A+ score)', async () => {
      expect(await gradeForRaw(876)).toBe('A+');
    });

    it('returns A+ for raw=814 (cgp=3.26, lowest A+ entry point)', async () => {
      expect(await gradeForRaw(814)).toBe('A+');
    });

    it('returns A for raw=813 (cgp=3.25, highest A score)', async () => {
      expect(await gradeForRaw(813)).toBe('A');
    });

    it('returns A for raw=752 (cgp=3.01, lowest A entry point)', async () => {
      expect(await gradeForRaw(752)).toBe('A');
    });

    it('returns B++ for raw=751 (cgp=3.00, highest B++ score)', async () => {
      expect(await gradeForRaw(751)).toBe('B++');
    });

    it('returns B++ for raw=689 (cgp=2.76, lowest B++ entry point)', async () => {
      expect(await gradeForRaw(689)).toBe('B++');
    });

    it('returns B+ for raw=688 (cgp=2.75, highest B+ score)', async () => {
      expect(await gradeForRaw(688)).toBe('B+');
    });

    it('returns B+ for raw=627 (cgp=2.51, lowest B+ entry point)', async () => {
      expect(await gradeForRaw(627)).toBe('B+');
    });

    it('returns B for raw=626 (cgp=2.50, highest B score)', async () => {
      expect(await gradeForRaw(626)).toBe('B');
    });

    it('returns B for raw=502 (cgp=2.01, lowest B entry point)', async () => {
      expect(await gradeForRaw(502)).toBe('B');
    });

    it('returns C for raw=501 (cgp=2.00, highest C score)', async () => {
      expect(await gradeForRaw(501)).toBe('C');
    });

    it('returns C for raw=377 (cgp=1.51, lowest C entry point)', async () => {
      expect(await gradeForRaw(377)).toBe('C');
    });

    it('returns D for raw=376 (cgp=1.50, highest D score)', async () => {
      expect(await gradeForRaw(376)).toBe('D');
    });

    it('returns D for raw=0 (all criteria unscored)', async () => {
      expect(await gradeForRaw(0)).toBe('D');
    });
  });

  // ── strengths / areasForImprovement edge cases ────────────────────────────

  describe('strengths derivation edge cases', () => {
    it('excludes criterion with maxScore=0 from strengths even if score is also 0', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [makeCriterion({ criterion: 1, score: 0, maxScore: 0 })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      // maxScore=0 criterion must never appear in strengths (would be division by zero)
      expect(body.strengths).toEqual(['Data collection in progress']);
    });

    it('includes criterion with exactly 70% score in strengths (boundary is inclusive)', async () => {
      // 70/100 = 0.70 — must pass the >= 0.70 check
      const payload = {
        academicYear: '2024-25',
        criteria: [makeCriterion({ criterion: 1, score: 70, maxScore: 100 })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const strengths = body.strengths as string[];

      expect(strengths).toHaveLength(1);
      expect(strengths[0]).toContain('Curricular Aspects');
      expect(strengths[0]).toContain('70%');
    });

    it('excludes criterion with exactly 69% score from strengths', async () => {
      // 69/100 = 0.69 — must fail the >= 0.70 check
      const payload = {
        academicYear: '2024-25',
        criteria: [makeCriterion({ criterion: 1, score: 69, maxScore: 100 })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(body.strengths).toEqual(['Data collection in progress']);
    });

    it('falls back to "Data collection in progress" when no criteria reach 70%', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [
          makeCriterion({ criterion: 1, score:  60, maxScore: 100 }), // 60% — gap zone
          makeCriterion({ criterion: 2, score:  40, maxScore: 100 }), // 40% — improvement
        ],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(body.strengths).toEqual(['Data collection in progress']);
    });
  });

  describe('areasForImprovement derivation edge cases', () => {
    it('uses "not yet assessed" label when score===0 and maxScore>0', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [makeCriterion({ criterion: 3, score: 0, maxScore: 150 })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const areas = body.areasForImprovement as string[];

      expect(areas).toHaveLength(1);
      expect(areas[0]).toContain('Research, Innovations and Extension');
      expect(areas[0]).toContain('not yet assessed');
    });

    it('uses "N% (needs improvement)" label when 0 < score < 50% of maxScore', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [makeCriterion({ criterion: 4, score: 40, maxScore: 150 })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const areas = body.areasForImprovement as string[];

      expect(areas).toHaveLength(1);
      expect(areas[0]).toContain('Infrastructure and Learning Resources');
      // Math.round(40/150*100) = Math.round(26.67) = 27
      expect(areas[0]).toContain('27%');
      expect(areas[0]).toContain('needs improvement');
    });

    it('excludes criterion with exactly 50% score from areasForImprovement (boundary is exclusive)', async () => {
      // 50/100 = 0.50 — must fail the < 0.50 check
      const payload = {
        academicYear: '2024-25',
        criteria: [makeCriterion({ criterion: 1, score: 50, maxScore: 100 })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(body.areasForImprovement).toEqual(['All criteria need evidence uploads']);
    });

    it('includes criterion with exactly 49% score in areasForImprovement', async () => {
      // 49/100 = 0.49 < 0.50 → improvement
      const payload = {
        academicYear: '2024-25',
        criteria: [makeCriterion({ criterion: 1, score: 49, maxScore: 100 })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const areas = body.areasForImprovement as string[];

      expect(areas).toHaveLength(1);
      expect(areas[0]).toContain('49%');
      expect(areas[0]).toContain('needs improvement');
    });

    it('excludes criterion with maxScore=0 from areasForImprovement', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [makeCriterion({ criterion: 1, score: 0, maxScore: 0 })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(body.areasForImprovement).toEqual(['All criteria need evidence uploads']);
    });

    it('falls back to "All criteria need evidence uploads" when no criteria are below 50%', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [
          makeCriterion({ criterion: 1, score: 80, maxScore: 100 }), // 80% → strength
          makeCriterion({ criterion: 2, score: 55, maxScore: 100 }), // 55% → gap
        ],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(body.areasForImprovement).toEqual(['All criteria need evidence uploads']);
    });
  });

  // ── criteria with null scores (new institution / incomplete NAAC cycle) ───

  describe('null score criteria handling', () => {
    it('treats null score as 0 in CGP sum', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [
          makeCriterion({ criterion: 1, score: null, maxScore: 150 }),
        ],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(body.overallScore).toBe(0);
    });

    it('treats null score as 0 in criteria array score field', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [makeCriterion({ criterion: 1, score: null, maxScore: 150 })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      expect(criteria[0].score).toBe(0);
    });

    it('treats null maxScore as 0 in criteria array maxScore field', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [makeCriterion({ criterion: 1, score: 100, maxScore: null })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      expect(criteria[0].maxScore).toBe(0);
    });

    it('all-null criteria payload (brand-new institution) → CGP 0 + grade D + fallback messages', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [1, 2, 3, 4, 5, 6, 7].map((n) =>
          makeCriterion({ criterion: n, score: null, maxScore: null, lastUpdated: '' }),
        ),
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(body.overallScore).toBe(0);
      expect(body.grade).toBe('D');
      expect(body.strengths).toEqual(['Data collection in progress']);
      expect(body.areasForImprovement).toEqual(['All criteria need evidence uploads']);
    });
  });

  // ── lastUpdated formatting ─────────────────────────────────────────────────

  describe('lastUpdated field formatting', () => {
    it('returns "Not assessed" when lastUpdated is empty string (falsy)', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [makeCriterion({ criterion: 1, score: 100, maxScore: 150, lastUpdated: '' })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      expect(criteria[0].lastUpdated).toBe('Not assessed');
    });

    it('formats a valid ISO date string into en-IN locale (day Mon year)', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [makeCriterion({ criterion: 1, score: 100, maxScore: 150, lastUpdated: '2024-03-31' })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      // en-IN locale produces '31 Mar 2024'
      expect(criteria[0].lastUpdated).toBe('31 Mar 2024');
    });
  });

  // ── unknown criterion number (legacy ERP migration artefact) ──────────────

  describe('unknown criterion number', () => {
    it('falls back to "Criterion N" name for criterion numbers outside 1-7', async () => {
      const payload = {
        academicYear: '2024-25',
        // criterion 8 does not exist in NAAC framework — may appear after data migration
        criteria: [makeCriterion({ criterion: 8, score: 80, maxScore: 100 })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      expect(criteria[0].id).toBe('C8');
      expect(criteria[0].name).toBe('Criterion 8');
    });
  });

  // ── academicYear query param handling ─────────────────────────────────────

  describe('academicYear query param', () => {
    it('defaults to 2024-25 when academicYear param is absent', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(payloadWithTotalRaw(600)),
      );
      // No academicYear in the URL
      await GET(makeGetRequest());

      const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit?][];
      expect(calls[0][0]).toContain('academicYear=2024-25');
    });

    it('forwards explicit academicYear to the compliance service URL', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(payloadWithTotalRaw(600)),
      );
      await GET(makeGetRequest('2023-24'));

      const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit?][];
      expect(calls[0][0]).toContain('academicYear=2023-24');
    });

    it('URL-encodes academicYear values containing forward slashes', async () => {
      // VTU sometimes uses "2024/25" format — must be percent-encoded
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(payloadWithTotalRaw(600)),
      );
      await GET(makeGetRequest('2024/25'));

      const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit?][];
      expect(calls[0][0]).toContain('academicYear=2024%2F25');
    });
  });

  // ── COMPLIANCE_SERVICE_URL env var ────────────────────────────────────────

  describe('COMPLIANCE_SERVICE_URL env var', () => {
    it('uses http://localhost:3002 as default when env var is absent', async () => {
      delete process.env.COMPLIANCE_SERVICE_URL;
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(payloadWithTotalRaw(600)),
      );
      await GET(makeGetRequest());

      const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit?][];
      expect(calls[0][0]).toMatch(/^http:\/\/localhost:3002\//);
    });

    it('uses configured URL when COMPLIANCE_SERVICE_URL is set', async () => {
      process.env.COMPLIANCE_SERVICE_URL = 'http://compliance.prod.internal:3002';
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(payloadWithTotalRaw(600)),
      );
      await GET(makeGetRequest());

      const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit?][];
      expect(calls[0][0]).toMatch(/^http:\/\/compliance\.prod\.internal:3002\//);
    });

    it('constructs the correct upstream path: /naac/dashboard', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(payloadWithTotalRaw(600)),
      );
      await GET(makeGetRequest());

      const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit?][];
      expect(calls[0][0]).toContain('/api/naac/dashboard');
    });
  });

  // ── backend non-ok responses ──────────────────────────────────────────────

  describe('backend non-ok responses', () => {
    it('returns 404 when compliance service responds 404', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeErrorResponse(404));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(404);
      expect(body.error).toBe('Backend error: 404');
    });

    it('returns 500 when compliance service responds 500', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeErrorResponse(500));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(500);
      expect(body.error).toBe('Backend error: 500');
    });

    it('returns 503 when compliance service responds 503 (service unavailable)', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeErrorResponse(503));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(503);
      expect(body.error).toBe('Backend error: 503');
    });

    it('error response is always application/json', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeErrorResponse(500));
      const res = await GET(makeGetRequest());

      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  // ── fetch throws (network failure → 502) ─────────────────────────────────

  describe('fetch throws — network failure', () => {
    it('returns 502 when fetch rejects with ECONNREFUSED', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(
        new TypeError('fetch failed: ECONNREFUSED ::1:3002'),
      );
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(502);
      expect(body.error).toContain('ECONNREFUSED');
    });

    it('returns 502 when fetch rejects with DNS resolution failure', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(
        new Error('getaddrinfo ENOTFOUND compliance.prod.internal'),
      );
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(502);
      // Must use String(err) — preserves both error type and message
      expect(body.error).toBe('Error: getaddrinfo ENOTFOUND compliance.prod.internal');
    });

    it('returns 502 when fetch rejects with connection timeout', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(
        new DOMException('The operation was aborted', 'AbortError'),
      );
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(502);
      expect(typeof body.error).toBe('string');
      expect((body.error as string).length).toBeGreaterThan(0);
    });

    it('502 response body contains stringified error, not an empty object', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('network partition'));
      const res = await GET(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      // The route does String(err) — we must see the error class + message
      expect(body.error).toBe('Error: network partition');
    });

    it('502 response is application/json', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('down'));
      const res = await GET(makeGetRequest());

      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  // ── concurrency / no shared state ─────────────────────────────────────────

  describe('concurrency — no shared state between concurrent requests', () => {
    it('two concurrent requests get independent responses (NAAC result-day spike)', async () => {
      // Simulates two NAAC report viewers simultaneously fetching metrics —
      // common on result-day and NAAC reaccreditation submission day.
      const payload1 = payloadWithTotalRaw(877); // A++
      const payload2 = payloadWithTotalRaw(376); // D

      global.fetch = jest.fn()
        .mockResolvedValueOnce(fakeOkResponse(payload1))
        .mockResolvedValueOnce(fakeOkResponse(payload2));

      const [res1, res2] = await Promise.all([
        GET(makeGetRequest('2024-25')),
        GET(makeGetRequest('2023-24')),
      ]);

      const b1 = await res1.json() as Record<string, unknown>;
      const b2 = await res2.json() as Record<string, unknown>;

      expect(b1.grade).toBe('A++');
      expect(b2.grade).toBe('D');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Compliance Dashboard route tests
// File: src/app/api/compliance/dashboard/route.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Coverage targets — 100% lines + branches on the compliance dashboard GET:
 *   - Happy path: 7 criteria, mix of scored (status: 'approved') and null (status: 'not_started')
 *   - score === 0 (not null) → status: 'approved' (0 is a valid score, not null)
 *   - overallScore rounding: Math.round(sum * 100) / 100
 *   - approvedCriteria count: criteria where score !== null
 *   - Static fields: framework='NAAC', maxPossibleScore=1000, totalCriteria=7, pendingEvidence=0
 *   - recentEvidence: always []
 *   - Criterion label fallback for unknown criterion numbers
 *   - academicYear default and forwarding
 *   - COMPLIANCE_SERVICE_URL env var default and override
 *   - Backend non-ok (404, 500) → proxied status + { error: 'Backend error: <status>' }
 *   - fetch throws → 502 + stringified error
 */

import { GET as getDashboard } from '../../../compliance/dashboard/route';

/** Minimal backend criterion fixture for compliance dashboard */
function makeDashCriterion(overrides: {
  criterion?: number;
  score?: number | null;
  maxScore?: number | null;
  pct?: number | null;
  lastUpdated?: string;
}) {
  return {
    criterion: overrides.criterion ?? 1,
    score: overrides.score !== undefined ? overrides.score : 100,
    maxScore: overrides.maxScore !== undefined ? overrides.maxScore : 150,
    pct: overrides.pct ?? null,
    lastUpdated: overrides.lastUpdated ?? '2024-01-15',
  };
}

/** Build the standard 7-criterion backend response for compliance dashboard */
function dashPayload(scores: Array<number | null>): { academicYear: string; criteria: ReturnType<typeof makeDashCriterion>[] } {
  return {
    academicYear: '2024-25',
    criteria: scores.map((score, i) =>
      makeDashCriterion({ criterion: i + 1, score, maxScore: score !== null ? 150 : null }),
    ),
  };
}

describe('GET /api/compliance/dashboard', () => {
  beforeEach(() => {
    process.env.COMPLIANCE_SERVICE_URL = 'http://localhost:3002';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── happy path ────────────────────────────────────────────────────────────

  describe('happy path', () => {
    it('returns 200 with correct static fields', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, 120, 90, 80, 110, 70, 60])),
      );
      const res = await getDashboard(makeGetRequest('2024-25'));
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.framework).toBe('NAAC');
      expect(body.maxPossibleScore).toBe(1000);
      expect(body.totalCriteria).toBe(7);
      expect(body.pendingEvidence).toBe(0);
      expect(body.recentEvidence).toEqual([]);
    });

    it('computes overallScore as rounded sum of criterion scores', async () => {
      // 100+120+90+80+110+70+60 = 630 (no rounding needed here, but Math.round is applied)
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, 120, 90, 80, 110, 70, 60])),
      );
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(body.overallScore).toBe(630);
    });

    it('rounds overallScore to 2 decimal places', async () => {
      // Construct scores that produce a sum with floating-point noise
      // Use values that sum to something requiring rounding: e.g. 100.333... repeated
      // Simpler: use the route's Math.round(sum*100)/100 — verify it with a fractional sum
      // Backend score can be a float (marks with decimal rounding in VTU)
      const payload = {
        academicYear: '2024-25',
        criteria: [
          makeDashCriterion({ criterion: 1, score: 33.333, maxScore: 100 }),
          makeDashCriterion({ criterion: 2, score: 33.333, maxScore: 100 }),
          makeDashCriterion({ criterion: 3, score: 33.333, maxScore: 100 }),
        ],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      // 33.333 * 3 = 99.999 → Math.round(99.999*100)/100 = 100
      expect(body.overallScore).toBe(100);
    });

    it('counts approvedCriteria as number of criteria where score !== null', async () => {
      // 5 scored, 2 null
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, 120, null, 80, 110, null, 60])),
      );
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(body.approvedCriteria).toBe(5);
    });

    it('returns refreshedAt as an ISO 8601 string', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, 120, 90, 80, 110, 70, 60])),
      );
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      // Must be a parseable ISO string
      expect(typeof body.refreshedAt).toBe('string');
      expect(() => new Date(body.refreshedAt as string).toISOString()).not.toThrow();
    });

    it('returns all 7 criteria in the response', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, 120, 90, 80, 110, 70, 60])),
      );
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      expect(criteria).toHaveLength(7);
    });
  });

  // ── criterion status field ────────────────────────────────────────────────

  describe('criterion status field', () => {
    it('sets status="approved" when score is a positive number', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, null, null, null, null, null, null])),
      );
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      expect(criteria[0].status).toBe('approved');
    });

    it('sets status="not_started" when score is null', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([null, null, null, null, null, null, null])),
      );
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      criteria.forEach((c) => expect(c.status).toBe('not_started'));
    });

    it('sets status="approved" when score is 0 (zero is a valid score, not null)', async () => {
      // ERP edge case: a criterion can be scored 0 deliberately (criterion
      // was assessed and the college genuinely achieved 0 marks).
      // This must NOT be treated as null/not_started.
      const payload = {
        academicYear: '2024-25',
        criteria: [makeDashCriterion({ criterion: 1, score: 0, maxScore: 150 })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      // score=0 is !== null → must be 'approved', not 'not_started'
      expect(criteria[0].status).toBe('approved');
      expect(criteria[0].score).toBe(0);
    });

    it('mixed: some criteria approved, some not_started', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, null, 90, null, 80, null, 70])),
      );
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      expect(criteria[0].status).toBe('approved');
      expect(criteria[1].status).toBe('not_started');
      expect(criteria[2].status).toBe('approved');
      expect(criteria[3].status).toBe('not_started');
    });
  });

  // ── criterion shape ───────────────────────────────────────────────────────

  describe('criterion object shape', () => {
    it('criterion object has all required fields', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, null, null, null, null, null, null])),
      );
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const c = (body.criteria as Array<Record<string, unknown>>)[0];

      // makeDashCriterion defaults: score=100, maxScore=150
      expect(c).toMatchObject({
        criterionId: 'NAAC-C1',
        framework: 'NAAC',
        code: 'C1',
        title: 'Curricular Aspects',
        weightage: 150,   // route maps c.maxScore ?? 0 to weightage
        score: 100,
        maxScore: 150,
        status: 'approved',
        evidenceCount: 0,
        pendingEvidenceCount: 0,
      });
    });

    it('criterion with null maxScore has weightage=0 and maxScore=0', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [makeDashCriterion({ criterion: 1, score: null, maxScore: null })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const c = (body.criteria as Array<Record<string, unknown>>)[0];

      expect(c.weightage).toBe(0);
      expect(c.maxScore).toBe(0);
    });

    it('uses "Criterion N" title for unknown criterion numbers', async () => {
      const payload = {
        academicYear: '2024-25',
        criteria: [makeDashCriterion({ criterion: 9, score: 50, maxScore: 100 })],
      };
      global.fetch = jest.fn().mockResolvedValueOnce(fakeOkResponse(payload));
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const c = (body.criteria as Array<Record<string, unknown>>)[0];

      expect(c.criterionId).toBe('NAAC-C9');
      expect(c.code).toBe('C9');
      expect(c.title).toBe('Criterion 9');
    });

    it('all 7 known NAAC criterion titles map correctly', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, 100, 100, 100, 100, 100, 100])),
      );
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;
      const criteria = body.criteria as Array<Record<string, unknown>>;

      const expectedTitles = [
        'Curricular Aspects',
        'Teaching-Learning and Evaluation',
        'Research, Innovations and Extension',
        'Infrastructure and Learning Resources',
        'Student Support and Progression',
        'Governance, Leadership and Management',
        'Institutional Values and Best Practices',
      ];
      criteria.forEach((c, i) => {
        expect(c.title).toBe(expectedTitles[i]);
        expect(c.criterionId).toBe(`NAAC-C${i + 1}`);
        expect(c.code).toBe(`C${i + 1}`);
      });
    });
  });

  // ── academicYear param forwarding ─────────────────────────────────────────

  describe('academicYear query param forwarding', () => {
    it('defaults to 2024-25 when param absent', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, 100, 100, 100, 100, 100, 100])),
      );
      await getDashboard(makeGetRequest());

      const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit?][];
      expect(calls[0][0]).toContain('academicYear=2024-25');
    });

    it('forwards explicit academicYear=2023-24', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, 100, 100, 100, 100, 100, 100])),
      );
      await getDashboard(makeGetRequest('2023-24'));

      const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit?][];
      expect(calls[0][0]).toContain('academicYear=2023-24');
    });
  });

  // ── COMPLIANCE_SERVICE_URL env var ────────────────────────────────────────

  describe('COMPLIANCE_SERVICE_URL env var', () => {
    it('uses http://localhost:3002 as default when env var is absent', async () => {
      delete process.env.COMPLIANCE_SERVICE_URL;
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, 100, 100, 100, 100, 100, 100])),
      );
      await getDashboard(makeGetRequest());

      const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit?][];
      expect(calls[0][0]).toMatch(/^http:\/\/localhost:3002\//);
    });

    it('uses configured URL when env var is set', async () => {
      process.env.COMPLIANCE_SERVICE_URL = 'http://compliance.staging:3002';
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([100, 100, 100, 100, 100, 100, 100])),
      );
      await getDashboard(makeGetRequest());

      const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit?][];
      expect(calls[0][0]).toMatch(/^http:\/\/compliance\.staging:3002\//);
    });
  });

  // ── backend non-ok responses ──────────────────────────────────────────────

  describe('backend non-ok responses', () => {
    it('returns 404 from backend with { error: "Backend error: 404" }', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeErrorResponse(404));
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(404);
      expect(body.error).toBe('Backend error: 404');
    });

    it('returns 500 from backend with { error: "Backend error: 500" }', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeErrorResponse(500));
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(500);
      expect(body.error).toBe('Backend error: 500');
    });

    it('non-ok response is application/json', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(fakeErrorResponse(503));
      const res = await getDashboard(makeGetRequest());

      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  // ── fetch throws → 502 ───────────────────────────────────────────────────

  describe('fetch throws — network failure', () => {
    it('returns 502 when compliance service is unreachable', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(
        new TypeError('fetch failed: ECONNREFUSED ::1:3002'),
      );
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(502);
      expect(body.error).toContain('ECONNREFUSED');
    });

    it('502 body contains String(err) — preserves error type and message', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('compliance service down'));
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(502);
      expect(body.error).toBe('Error: compliance service down');
    });

    it('502 response is application/json', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('down'));
      const res = await getDashboard(makeGetRequest());

      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  // ── all-null criteria (brand-new institution) ─────────────────────────────

  describe('all-null criteria (brand-new institution, first NAAC cycle)', () => {
    it('returns overallScore=0, approvedCriteria=0, all status=not_started', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        fakeOkResponse(dashPayload([null, null, null, null, null, null, null])),
      );
      const res = await getDashboard(makeGetRequest());
      const body = await res.json() as Record<string, unknown>;

      expect(body.overallScore).toBe(0);
      expect(body.approvedCriteria).toBe(0);

      const criteria = body.criteria as Array<Record<string, unknown>>;
      criteria.forEach((c) => {
        expect(c.status).toBe('not_started');
        expect(c.score).toBeNull();
      });
    });
  });
});
