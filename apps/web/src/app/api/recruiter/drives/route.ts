import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  recruiterDrivesStore,
  initRecruiterDrivesForUser,
  recruiterJobsStore,
  type StoredCampusDrive,
} from '@/lib/synth/recruiter-store';

/**
 * Campus drives — BFF synth (KAN-30).
 *
 * Backend has no `/recruiter/drives` route → 404. We serve a realistic
 * pre-seeded drive list on GET and accept POST creations into the
 * in-memory store. SYNTH_OK — TODO move to backend once campus_drives
 * table + service exist.
 */
export const GET = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const recruiterId = req.auth.user?.id ?? 'demo-recruiter';
  initRecruiterDrivesForUser(recruiterId);
  return NextResponse.json(recruiterDrivesStore.filter((d) => d.recruiterId === recruiterId));
});

interface CreateDriveDto {
  jobId?: string;
  driveTier?: 'POOL' | 'DREAM' | 'SUPER_DREAM' | 'MASS' | 'NICHE';
  targetCollegeIds?: string[];
  driveDate?: string;
}

export const POST = auth(async (req) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const recruiterId = req.auth.user?.id ?? 'demo-recruiter';
  let body: CreateDriveDto = {};
  try {
    body = (await req.json()) as CreateDriveDto;
  } catch {
    /* ignore */
  }

  if (!body.jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  const job = recruiterJobsStore.find((j) => j.id === body.jobId);
  const collegeIds = body.targetCollegeIds?.length ? body.targetCollegeIds : ['rvce'];

  const id = `drive-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const eligiblePerCollege = 60 + Math.floor(Math.random() * 90);
  const drive: StoredCampusDrive = {
    id,
    recruiterId,
    jobId: body.jobId,
    jobTitle: job?.title ?? 'Campus Hire',
    driveTier: body.driveTier ?? 'DREAM',
    targetColleges: collegeIds.map((cid) => ({
      collegeId: cid,
      collegeName:
        cid === 'rvce' ? 'Raycraft' : cid === 'msrit' ? 'MSRIT' : cid === 'bms' ? 'BMS' : cid.toUpperCase(),
      city: 'Bengaluru',
      tier: 1,
      tpoName: 'Dr. Suresh Kumar',
      tpoEmail: `tpo@${cid}.edu`,
      eligibleStudentCount: eligiblePerCollege,
      ...(body.driveDate ? { slotDate: body.driveDate } : {}),
      slotConfirmed: !!body.driveDate,
    })),
    ...(body.driveDate ? { driveDate: body.driveDate } : {}),
    status: body.driveDate ? 'CONFIRMED' : 'DRAFT',
    totalEligible: eligiblePerCollege * collegeIds.length,
    totalRegistered: 0,
    totalOffered: 0,
    estimatedHires: Math.max(1, Math.round((eligiblePerCollege * collegeIds.length) / 18)),
    estimatedCostPerHire: 38_000 + Math.floor(Math.random() * 15_000),
    createdAt: new Date().toISOString(),
  };
  recruiterDrivesStore.push(drive);
  return NextResponse.json({ id }, { status: 201 });
});
