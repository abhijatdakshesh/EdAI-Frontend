import { NextRequest, NextResponse } from 'next/server';

const CRITERION_LABELS: Record<number, string> = {
  1: 'Curricular Aspects',
  2: 'Teaching-Learning and Evaluation',
  3: 'Research, Innovations and Extension',
  4: 'Infrastructure and Learning Resources',
  5: 'Student Support and Progression',
  6: 'Governance, Leadership and Management',
  7: 'Institutional Values and Best Practices',
};

interface NaacDashboardCriterion {
  criterion: number;
  score: number | null;
  maxScore: number | null;
  pct: number | null;
  lastUpdated: string;
}

interface NaacDashboardResponse {
  academicYear: string;
  criteria: NaacDashboardCriterion[];
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

    const data = (await res.json()) as NaacDashboardResponse;
    const overallScore = data.criteria.reduce((sum, c) => sum + (c.score ?? 0), 0);
    const approvedCriteria = data.criteria.filter((c) => c.score !== null).length;

    return NextResponse.json({
      refreshedAt: new Date().toISOString(),
      framework: 'NAAC',
      overallScore: Math.round(overallScore * 100) / 100,
      maxPossibleScore: 1000,
      totalCriteria: 7,
      approvedCriteria,
      pendingEvidence: 0,
      criteria: data.criteria.map((c) => ({
        criterionId: `NAAC-C${c.criterion}`,
        framework: 'NAAC',
        code: `C${c.criterion}`,
        title: CRITERION_LABELS[c.criterion] ?? `Criterion ${c.criterion}`,
        weightage: c.maxScore ?? 0,
        score: c.score,
        maxScore: c.maxScore ?? 0,
        status: c.score !== null ? 'approved' : 'not_started',
        evidenceCount: 0,
        pendingEvidenceCount: 0,
      })),
      recentEvidence: [],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
