import { NextRequest, NextResponse } from 'next/server';

const CRITERION_NAMES: Record<number, string> = {
  1: 'Curricular Aspects',
  2: 'Teaching-Learning and Evaluation',
  3: 'Research, Innovations and Extension',
  4: 'Infrastructure and Learning Resources',
  5: 'Student Support and Progression',
  6: 'Governance, Leadership and Management',
  7: 'Institutional Values and Best Practices',
};

function cgpGrade(cgp: number): string {
  if (cgp >= 3.51) return 'A++';
  if (cgp >= 3.26) return 'A+';
  if (cgp >= 3.01) return 'A';
  if (cgp >= 2.76) return 'B++';
  if (cgp >= 2.51) return 'B+';
  if (cgp >= 2.01) return 'B';
  if (cgp >= 1.51) return 'C';
  return 'D';
}

interface NaacCriterion {
  criterion: number;
  score: number | null;
  maxScore: number | null;
  pct: number | null;
  lastUpdated: string;
}

export async function GET(req: NextRequest) {
  const COMPLIANCE_SERVICE_URL = process.env.COMPLIANCE_SERVICE_URL ?? 'http://localhost:3002';
  const academicYear = req.nextUrl.searchParams.get('academicYear') ?? '2024-25';

  try {
    const res = await fetch(
      `${COMPLIANCE_SERVICE_URL}/api/naac/dashboard?academicYear=${encodeURIComponent(academicYear)}`,
    );
    if (!res.ok) {
      return NextResponse.json({ error: `Backend error: ${res.status}` }, { status: res.status });
    }

    const data = (await res.json()) as { academicYear: string; criteria: NaacCriterion[] };

    const totalRaw = data.criteria.reduce((s, c) => s + (c.score ?? 0), 0);
    const totalMax = data.criteria.reduce((s, c) => s + (c.maxScore ?? 0), 0);
    const cgp = totalMax > 0 ? Math.round((totalRaw / totalMax) * 4 * 100) / 100 : 0;

    const criteria = data.criteria.map((c) => ({
      id: `C${c.criterion}`,
      name: CRITERION_NAMES[c.criterion] ?? `Criterion ${c.criterion}`,
      score: c.score ?? 0,
      maxScore: c.maxScore ?? 0,
      lastUpdated: c.lastUpdated
        ? new Date(c.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Not assessed',
      trend: 'STABLE' as const,
    }));

    const strengths = criteria
      .filter((c) => c.maxScore > 0 && (c.score / c.maxScore) >= 0.7)
      .map((c) => `${c.name} — ${Math.round((c.score / c.maxScore) * 100)}% achieved`);

    const areasForImprovement = criteria
      .filter((c) => c.maxScore > 0 && (c.score / c.maxScore) < 0.5)
      .map((c) => c.score === 0
        ? `${c.name} — not yet assessed`
        : `${c.name} — ${Math.round((c.score / c.maxScore) * 100)}% (needs improvement)`);

    return NextResponse.json({
      overallScore: cgp,
      grade: cgpGrade(cgp),
      lastAssessed: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      criteria,
      strengths: strengths.length ? strengths : ['Data collection in progress'],
      areasForImprovement: areasForImprovement.length ? areasForImprovement : ['All criteria need evidence uploads'],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
