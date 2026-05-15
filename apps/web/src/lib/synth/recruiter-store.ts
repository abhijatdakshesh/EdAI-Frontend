/**
 * In-memory store for recruiter portal BFF synth routes.
 *
 * Single-replica deployment today, so module-level arrays are sufficient
 * to share state across requests for one recruiter session. Persists for
 * the lifetime of the Next.js process (resets on redeploy).
 *
 * SYNTH_OK — replace with backend wiring once `recruiter_jobs` and
 * `campus_drives` migrations are applied in prod.
 */

export interface StoredRecruiterJob {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  roleType: 'PRODUCT' | 'SERVICE' | 'STARTUP' | 'CORE';
  ctcLpa: number;
  minCgpa: number;
  eligibleBranches: string[];
  eligibleSemesters: number[];
  requiredSkills: string[];
  location: string;
  applyDeadline: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  postedAt: string;
  applicantCount: number;
  shortlistedCount: number;
  offerCount: number;
}

export interface StoredCampusDrive {
  id: string;
  recruiterId: string;
  jobId: string;
  jobTitle: string;
  driveTier: 'POOL' | 'DREAM' | 'SUPER_DREAM' | 'MASS' | 'NICHE';
  targetColleges: Array<{
    collegeId: string;
    collegeName: string;
    city: string;
    tier: 1 | 2 | 3;
    tpoName: string;
    tpoEmail: string;
    eligibleStudentCount: number;
    slotDate?: string;
    slotConfirmed: boolean;
  }>;
  driveDate?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  totalEligible: number;
  totalRegistered: number;
  totalOffered: number;
  estimatedHires: number;
  estimatedCostPerHire: number;
  createdAt: string;
}

export const recruiterJobsStore: StoredRecruiterJob[] = [];
export const recruiterDrivesStore: StoredCampusDrive[] = [];

const seededJobsForUsers = new Set<string>();
const seededDrivesForUsers = new Set<string>();

/**
 * Pre-seed two realistic jobs for a recruiter on first access so empty
 * accounts still see useful demo content (matches prior design where
 * the recruiter dashboard never appeared blank).
 */
export function initRecruiterJobsForUser(recruiterId: string): void {
  if (seededJobsForUsers.has(recruiterId)) return;
  seededJobsForUsers.add(recruiterId);

  const seed: StoredRecruiterJob[] = [
    {
      id: `job-seed-${recruiterId}-1`,
      recruiterId,
      title: 'Software Engineer',
      description: 'Build scalable backend systems for our payments platform.',
      roleType: 'SERVICE',
      ctcLpa: 8.5,
      minCgpa: 7.0,
      eligibleBranches: ['CSE', 'ISE'],
      eligibleSemesters: [8],
      requiredSkills: ['Java', 'Spring Boot', 'SQL'],
      location: 'Bengaluru',
      applyDeadline: '2026-06-30',
      status: 'OPEN',
      postedAt: '2026-05-01T09:00:00Z',
      applicantCount: 24,
      shortlistedCount: 8,
      offerCount: 0,
    },
    {
      id: `job-seed-${recruiterId}-2`,
      recruiterId,
      title: 'Frontend Developer',
      description: 'React + TypeScript developer for our consumer product team.',
      roleType: 'PRODUCT',
      ctcLpa: 12,
      minCgpa: 8.0,
      eligibleBranches: ['CSE', 'ISE', 'ECE'],
      eligibleSemesters: [8],
      requiredSkills: ['React', 'TypeScript', 'CSS'],
      location: 'Bengaluru / Remote',
      applyDeadline: '2026-06-15',
      status: 'OPEN',
      postedAt: '2026-04-28T09:00:00Z',
      applicantCount: 41,
      shortlistedCount: 12,
      offerCount: 2,
    },
  ];
  recruiterJobsStore.push(...seed);
}

export function initRecruiterDrivesForUser(recruiterId: string): void {
  if (seededDrivesForUsers.has(recruiterId)) return;
  seededDrivesForUsers.add(recruiterId);
  // Make sure jobs are seeded so drives can reference them.
  initRecruiterJobsForUser(recruiterId);

  const seed: StoredCampusDrive[] = [
    {
      id: `drive-seed-${recruiterId}-1`,
      recruiterId,
      jobId: `job-seed-${recruiterId}-1`,
      jobTitle: 'Software Engineer',
      driveTier: 'DREAM',
      targetColleges: [
        { collegeId: 'rvce',  collegeName: 'Raycraft',  city: 'Bengaluru', tier: 1, tpoName: 'Dr. Suresh Kumar',  tpoEmail: 'tpo@rvce.edu',     eligibleStudentCount: 142, slotDate: '2026-07-15', slotConfirmed: true  },
        { collegeId: 'msrit', collegeName: 'MSRIT', city: 'Bengaluru', tier: 1, tpoName: 'Prof. Anitha Rao',  tpoEmail: 'placement@msrit.edu', eligibleStudentCount: 98,  slotDate: '2026-07-16', slotConfirmed: false },
      ],
      driveDate: '2026-07-15',
      status: 'CONFIRMED',
      totalEligible: 240, totalRegistered: 0, totalOffered: 0,
      estimatedHires: 18, estimatedCostPerHire: 38_000,
      createdAt: '2026-05-01T10:00:00Z',
    },
  ];
  recruiterDrivesStore.push(...seed);
}
