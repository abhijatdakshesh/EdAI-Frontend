import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  recruiterJobsStore,
  initRecruiterJobsForUser,
} from '@/lib/synth/recruiter-store';

/**
 * Recruiter analytics — BFF synth (KAN-31).
 *
 * Backend `/recruiter/analytics` returns empty/500 when the recruiter has
 * no jobs in the prod DB. We synthesize realistic numbers from the BFF
 * job store + reasonable defaults so the analytics dashboard always
 * renders meaningfully for the demo.
 */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const recruiterId = req.auth.user?.id ?? 'demo-recruiter';
  initRecruiterJobsForUser(recruiterId);
  const myJobs = recruiterJobsStore.filter((j) => j.recruiterId === recruiterId);

  const totalApplied = myJobs.reduce((a, j) => a + j.applicantCount, 0) + 230;
  const totalShortlisted = myJobs.reduce((a, j) => a + j.shortlistedCount, 0) + 87;
  const totalInterviewed = Math.round(totalShortlisted * 0.55);
  const totalOffered = myJobs.reduce((a, j) => a + j.offerCount, 0) + 18;
  const totalJoined = Math.round(totalOffered * 0.72);

  // Aggregate skill demand from real posted jobs + add scarcity baseline
  const skillFreq: Record<string, number> = {};
  for (const j of myJobs) {
    for (const s of j.requiredSkills ?? []) {
      skillFreq[s] = (skillFreq[s] ?? 0) + 1;
    }
  }
  const baseDemand: Record<string, [number, number]> = {
    React: [90, 72],
    Java: [85, 88],
    Python: [88, 80],
    Go: [70, 28],
    Rust: [55, 12],
    'ML/AI': [92, 45],
    DevOps: [78, 38],
    Flutter: [60, 55],
  };
  const skillDemand = Array.from(
    new Set([...Object.keys(skillFreq), ...Object.keys(baseDemand)]),
  )
    .slice(0, 8)
    .map((skill) => {
      const [demand, supply] = baseDemand[skill] ?? [50 + (skillFreq[skill] ?? 0) * 10, 50];
      return {
        skill,
        demand,
        supply,
        scarcityScore: Math.max(0, demand - supply),
      };
    });

  return NextResponse.json({
    funnel: [
      { stage: 'Applied',    count: totalApplied,      conversionRate: 100 },
      { stage: 'Screened',   count: Math.round(totalApplied * 0.61), conversionRate: 61 },
      { stage: 'Interviewed',count: totalInterviewed,  conversionRate: Math.round((totalInterviewed * 100) / totalApplied) },
      { stage: 'Shortlisted',count: totalShortlisted,  conversionRate: Math.round((totalShortlisted * 100) / totalApplied) },
      { stage: 'Offered',    count: totalOffered,      conversionRate: Math.round((totalOffered * 100) / totalApplied) },
      { stage: 'Joined',     count: totalJoined,       conversionRate: Math.round((totalJoined * 100) / totalApplied) },
    ],
    sourceRoi: [
      { college: 'Raycraft',          hires: Math.max(6, Math.round(totalJoined * 0.5)),  qualityScore: 88, costPerHire: 12_000 },
      { college: 'MSRIT',         hires: Math.max(2, Math.round(totalJoined * 0.18)), qualityScore: 91, costPerHire: 14_000 },
      { college: 'BMS',           hires: Math.max(1, Math.round(totalJoined * 0.12)), qualityScore: 82, costPerHire: 9_500  },
      { college: 'BIT Bengaluru', hires: Math.max(1, Math.round(totalJoined * 0.08)), qualityScore: 79, costPerHire: 8_000  },
    ],
    skillDemand,
    aiInsights: [
      `${myJobs.length || 4} active job postings · ${totalApplied} total applicants this quarter.`,
      `Offer-to-join rate is ${Math.round((totalJoined * 100) / Math.max(1, totalOffered))}% — ${totalJoined > totalOffered * 0.7 ? 'on benchmark' : 'consider higher CTC for top picks'}.`,
      'Raycraft delivers the best quality-per-hire — prioritise it for next quarter.',
      'ML/AI and Go are critically scarce. Consider adjacency hiring (e.g. Python → ML).',
    ],
    period: 'Current Placement Season',
  });
});
