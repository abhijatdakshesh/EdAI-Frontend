import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  recruiterJobsStore,
  initRecruiterJobsForUser,
  type StoredRecruiterJob,
} from '@/lib/synth/recruiter-store';

/**
 * Recruiter jobs — BFF synth (KAN-29).
 *
 * The backend `/recruiter/jobs` route requires the `recruiter_jobs` table
 * which is missing on the prod demo DB → 500. We accept the POST here,
 * stash the job in the in-memory store, and serve realistic job listings
 * on GET. Single-replica today so an in-memory store is acceptable.
 *
 * SYNTH_OK — TODO replace with backend wiring once recruiter_jobs migration
 * is applied to prod.
 */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const recruiterId = req.auth.user?.id ?? 'demo-recruiter';
  initRecruiterJobsForUser(recruiterId);
  const jobs = recruiterJobsStore.filter((j) => j.recruiterId === recruiterId);
  return NextResponse.json(jobs);
});

export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const recruiterId = req.auth.user?.id ?? 'demo-recruiter';
  let body: Partial<StoredRecruiterJob> = {};
  try {
    body = (await req.json()) as Partial<StoredRecruiterJob>;
  } catch {
    /* ignore */
  }

  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json({ error: 'Job title is required' }, { status: 400 });
  }

  const id = `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const job: StoredRecruiterJob = {
    id,
    recruiterId,
    title: body.title,
    description: body.description ?? `${body.title} role.`,
    roleType: body.roleType ?? 'SERVICE',
    ctcLpa: body.ctcLpa ?? 6,
    minCgpa: body.minCgpa ?? 6.5,
    eligibleBranches: body.eligibleBranches ?? ['CSE', 'ISE'],
    eligibleSemesters: body.eligibleSemesters ?? [7, 8],
    requiredSkills: body.requiredSkills ?? [],
    location: body.location ?? 'Bengaluru',
    applyDeadline:
      body.applyDeadline ?? new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    status: 'OPEN',
    postedAt: new Date().toISOString(),
    applicantCount: 0,
    shortlistedCount: 0,
    offerCount: 0,
  };
  recruiterJobsStore.push(job);
  return NextResponse.json({ id }, { status: 201 });
});
