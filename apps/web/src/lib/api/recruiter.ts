/**
 * React Query hooks for the Recruiter Portal.
 * Backend: /recruiter/* (identity service, port 3001)
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "./client";

// ─── Core enums ───────────────────────────────────────────────────────────────

export type RoleType = "PRODUCT" | "SERVICE" | "STARTUP" | "CORE";
export type JobStatus = "OPEN" | "CLOSED" | "CANCELLED";
export type ApplicationStatus =
  | "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN";
export type InterviewRound = "APTITUDE" | "TECHNICAL" | "HR";
export type OutreachChannel = "WHATSAPP" | "EMAIL" | "LINKEDIN";
export type SearchMode = "FILTER" | "NL" | "JD_MATCH" | "LOOK_ALIKE" | "HIDDEN_GEMS" | "SKILL_ADJACENCY";

// ─── Job types ────────────────────────────────────────────────────────────────

export interface RecruiterJob {
  id: string;
  title: string;
  description: string;
  roleType: RoleType;
  ctcLpa: number;
  minCgpa: number;
  eligibleBranches: string[];
  eligibleSemesters: number[];
  requiredSkills: string[];
  location: string;
  applyDeadline: string;
  status: JobStatus;
  postedAt: string;
  applicantCount: number;
  shortlistedCount: number;
  offerCount: number;
}

export interface PostJobDto {
  title: string;
  description: string;
  roleType: RoleType;
  ctcLpa: number;
  minCgpa: number;
  eligibleBranches: string[];
  eligibleSemesters: number[];
  requiredSkills: string[];
  location: string;
  applyDeadline: string;
  /** VTU/AICTE eligibility enforcement */
  maxActiveBacklogs: number;
  maxHistoricalBacklogs: number;
  lateralEntryAllowed: boolean;
}

// ─── Applicant & Candidate types ──────────────────────────────────────────────

export interface Candidate {
  studentId: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  cgpa: number;
  skills: string[];
  placementScore: number | null;
  percentile: number | null;
  companyMatches: number;
  /** Multi-tenancy: which institution this student belongs to */
  collegeId: string;
  collegeName: string;
  /** DPDP Act 2023: student has explicitly opted in to recruiter discovery */
  consentedToRecruiterDiscovery: boolean;
  consentTimestamp?: string;
}

export interface Applicant {
  applicationId: string;
  studentUsn: string;
  name: string;
  department: string;
  semester: number;
  cgpa: number;
  skills: string[];
  placementScore: number | null;
  percentile: number | null;
  status: ApplicationStatus;
  appliedAt: string;
  /** Multi-tenancy */
  collegeId: string;
  collegeName: string;
  /** DPDP: active backlogs at time of application */
  activeBacklogs: number;
  historicalBacklogs: number;
}

// ─── AI result types ──────────────────────────────────────────────────────────

export interface AiRankedCandidate {
  usn: string;
  rank: number;
  fitScore: number | null;
  rationale: string;
}

export interface GeneratedJd {
  title: string;
  description: string;
  requirements: string[];
}

export interface InterviewQuestion {
  question: string;
  expectedAnswer: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

export interface AiSearchResult {
  filter: Record<string, unknown>;
  candidates: Candidate[];
  interpretation: string;
}

export interface SemanticMatchResult {
  candidate: Candidate;
  matchScore: number;
  matchReasons: string[];
}

export interface LookAlikeResult {
  candidate: Candidate;
  similarityScore: number;
  sharedTraits: string[];
}

export interface HiddenGem extends Candidate {
  gemScore: number;
  signals: string[];
}

export interface SkillAdjacencyResult {
  candidate: Candidate;
  targetSkillMatch: boolean;
  adjacentSkills: string[];
  estimatedRampWeeks: number;
}

export interface FlaggedPhrase {
  phrase: string;
  suggestion: string;
  reason: string;
}

export interface JdFeedback {
  suggestions: string[];
  poolImpact: string;
  inclusiveScore: number;
}

export interface InclusiveLanguageResult {
  flagged: FlaggedPhrase[];
  overallScore: number;
}

export interface SalaryBenchmark {
  suggestedMin: number;
  suggestedMax: number;
  median: number;
  reasoning: string;
}

export interface OfferPrediction {
  usn: string;
  acceptProbability: number;
  joiningProbability: number;
  declineRisk: "LOW" | "MEDIUM" | "HIGH";
  declineReason?: string;
  suggestedCTC?: number;
}

export interface BiasDistributionItem {
  label: string;
  shortlistPct: number;
  poolPct: number;
}

export interface BiasAuditResult {
  genderBreakdown: BiasDistributionItem[];
  collegeTierBreakdown: BiasDistributionItem[];
  regionBreakdown: BiasDistributionItem[];
  flags: string[];
  overallBiasScore: number;
}

export interface OutreachMessage {
  candidateUsn: string;
  candidateName: string;
  channel: OutreachChannel;
  subject?: string;
  body: string;
  characterCount: number;
  /** DPDP Act 2023: consent must be verified before sending */
  consentVerified: boolean;
  consentTimestamp?: string;
  optedOut: boolean;
}

export interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
}

export interface SourceROI {
  college: string;
  hires: number;
  qualityScore: number;
  costPerHire: number;
}

export interface SkillDemand {
  skill: string;
  demand: number;
  supply: number;
  scarcityScore: number;
}

export interface RecruiterAnalytics {
  funnel: FunnelStage[];
  sourceRoi: SourceROI[];
  skillDemand: SkillDemand[];
  aiInsights: string[];
  period: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_JOBS: RecruiterJob[] = [
  {
    id: "job-1", title: "Software Engineer", description: "Build scalable backend systems.", roleType: "SERVICE", ctcLpa: 6.5, minCgpa: 7.0,
    eligibleBranches: ["CSE", "ISE"], eligibleSemesters: [8], requiredSkills: ["Java", "Spring Boot", "SQL"], location: "Bengaluru", applyDeadline: "2026-06-30",
    status: "OPEN", postedAt: "2026-05-01", applicantCount: 24, shortlistedCount: 8, offerCount: 0,
  },
  {
    id: "job-2", title: "Frontend Developer", description: "React + TypeScript developer for product team.", roleType: "PRODUCT", ctcLpa: 12, minCgpa: 8.0,
    eligibleBranches: ["CSE", "ISE", "ECE"], eligibleSemesters: [8], requiredSkills: ["React", "TypeScript", "CSS"], location: "Bengaluru / Remote", applyDeadline: "2026-06-15",
    status: "OPEN", postedAt: "2026-04-28", applicantCount: 41, shortlistedCount: 12, offerCount: 2,
  },
];

const MOCK_APPLICANTS: Applicant[] = [
  { applicationId: "app-1", studentUsn: "1RV21CS001", name: "Arjun Sharma", department: "CSE", semester: 8, cgpa: 8.9, skills: ["Java", "Spring"], placementScore: 82, percentile: 91, status: "APPLIED", appliedAt: "2026-05-02", collegeId: "rvce", collegeName: "RVCE", activeBacklogs: 0, historicalBacklogs: 0 },
  { applicationId: "app-2", studentUsn: "1RV21CS047", name: "Priya Patel", department: "CSE", semester: 8, cgpa: 9.2, skills: ["Java", "Python", "SQL"], placementScore: 91, percentile: 97, status: "SHORTLISTED", appliedAt: "2026-05-01", collegeId: "rvce", collegeName: "RVCE", activeBacklogs: 0, historicalBacklogs: 0 },
  { applicationId: "app-3", studentUsn: "1RV21IS012", name: "Rohit Kumar", department: "ISE", semester: 8, cgpa: 7.8, skills: ["Java", "React"], placementScore: 74, percentile: 82, status: "APPLIED", appliedAt: "2026-05-03", collegeId: "rvce", collegeName: "RVCE", activeBacklogs: 0, historicalBacklogs: 1 },
];

const MOCK_CANDIDATES: Candidate[] = [
  { studentId: "1RV21CS001", name: "Arjun Sharma", email: "candidate1@example.com", department: "CSE", semester: 8, cgpa: 8.9, skills: ["Java", "Python", "React"], placementScore: 82, percentile: 91, companyMatches: 4, collegeId: "rvce", collegeName: "RVCE", consentedToRecruiterDiscovery: true, consentTimestamp: "2026-01-15T10:00:00Z" },
  { studentId: "1RV21CS047", name: "Priya Patel", email: "candidate2@example.com", department: "CSE", semester: 8, cgpa: 9.2, skills: ["Java", "ML", "SQL"], placementScore: 91, percentile: 97, companyMatches: 7, collegeId: "rvce", collegeName: "RVCE", consentedToRecruiterDiscovery: true, consentTimestamp: "2026-01-15T10:00:00Z" },
  { studentId: "1RV21IS012", name: "Rohit Kumar", email: "candidate3@example.com", department: "ISE", semester: 8, cgpa: 7.8, skills: ["Java", "Spring", "React"], placementScore: 74, percentile: 82, companyMatches: 3, collegeId: "rvce", collegeName: "RVCE", consentedToRecruiterDiscovery: true, consentTimestamp: "2026-01-15T10:00:00Z" },
  { studentId: "1RV21ECE024", name: "Sneha Reddy", email: "candidate4@example.com", department: "ECE", semester: 8, cgpa: 8.4, skills: ["Embedded C", "Python", "VLSI"], placementScore: 78, percentile: 87, companyMatches: 2, collegeId: "rvce", collegeName: "RVCE", consentedToRecruiterDiscovery: false },
];

const MOCK_OFFER_PREDICTIONS: OfferPrediction[] = [
  { usn: "1RV21CS001", acceptProbability: 78, joiningProbability: 72, declineRisk: "LOW" },
  { usn: "1RV21CS047", acceptProbability: 45, joiningProbability: 38, declineRisk: "HIGH", declineReason: "Likely has competing offers at ₹15–18 LPA", suggestedCTC: 14 },
  { usn: "1RV21IS012", acceptProbability: 88, joiningProbability: 84, declineRisk: "LOW" },
];

const MOCK_ANALYTICS: RecruiterAnalytics = {
  period: "Q1 2026",
  funnel: [
    { stage: "Applied", count: 342, conversionRate: 100 },
    { stage: "Screened", count: 210, conversionRate: 61 },
    { stage: "Interviewed", count: 98, conversionRate: 29 },
    { stage: "Shortlisted", count: 42, conversionRate: 12 },
    { stage: "Offered", count: 18, conversionRate: 5 },
    { stage: "Joined", count: 12, conversionRate: 4 },
  ],
  sourceRoi: [
    { college: "RVCE", hires: 6, qualityScore: 88, costPerHire: 12000 },
    { college: "RVPU", hires: 3, qualityScore: 82, costPerHire: 9500 },
    { college: "BIT Bengaluru", hires: 2, qualityScore: 79, costPerHire: 8000 },
    { college: "MSRIT", hires: 1, qualityScore: 91, costPerHire: 14000 },
  ],
  skillDemand: [
    { skill: "React", demand: 90, supply: 72, scarcityScore: 18 },
    { skill: "Java", demand: 85, supply: 88, scarcityScore: 0 },
    { skill: "Python", demand: 88, supply: 80, scarcityScore: 8 },
    { skill: "Go", demand: 70, supply: 28, scarcityScore: 42 },
    { skill: "Rust", demand: 55, supply: 12, scarcityScore: 43 },
    { skill: "ML/AI", demand: 92, supply: 45, scarcityScore: 47 },
    { skill: "DevOps", demand: 78, supply: 38, scarcityScore: 40 },
    { skill: "Flutter", demand: 60, supply: 55, scarcityScore: 5 },
  ],
  aiInsights: [
    "Your offer-to-join rate (67%) is 12% below market — consider increasing CTC by ₹1–2 LPA.",
    "RVCE delivers the highest quality-per-hire. Prioritise it for next quarter's drives.",
    "ML/AI, Go, and Rust are critically scarce. Consider adjacency hiring for these roles.",
    "Your time-to-fill averages 28 days — 4 days above benchmark. Parallel shortlisting would help.",
  ],
};

const MOCK_BIAS_AUDIT: BiasAuditResult = {
  genderBreakdown: [
    { label: "Male", shortlistPct: 83, poolPct: 68 },
    { label: "Female", shortlistPct: 17, poolPct: 32 },
  ],
  collegeTierBreakdown: [
    { label: "Tier 1", shortlistPct: 71, poolPct: 48 },
    { label: "Tier 2", shortlistPct: 24, poolPct: 38 },
    { label: "Tier 3", shortlistPct: 5, poolPct: 14 },
  ],
  regionBreakdown: [
    { label: "Bengaluru", shortlistPct: 67, poolPct: 52 },
    { label: "Other Karnataka", shortlistPct: 25, poolPct: 31 },
    { label: "Outside Karnataka", shortlistPct: 8, poolPct: 17 },
  ],
  flags: [
    "Female candidates shortlisted at 17% vs 32% of applicant pool — significant under-representation.",
    "Tier-1 college bias detected: 71% of shortlist vs 48% of pool.",
    "Geographic concentration in Bengaluru (67%) vs pool (52%) — consider regional diversity.",
  ],
  overallBiasScore: 62,
};

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

// ─── Job hooks ────────────────────────────────────────────────────────────────

export function useRecruiterJobs() {
  return useQuery({
    queryKey: ["recruiter", "jobs"],
    queryFn: () => USE_MOCKS ? Promise.resolve(MOCK_JOBS) : apiGet<RecruiterJob[]>("/api/recruiter/jobs"),
  });
}

export function useRecruiterJob(id: string) {
  return useQuery({
    queryKey: ["recruiter", "jobs", id],
    queryFn: () => USE_MOCKS ? Promise.resolve(MOCK_JOBS.find(j => j.id === id) ?? null) : apiGet<RecruiterJob>(`/api/recruiter/jobs/${id}`),
    enabled: !!id,
  });
}

export function usePostJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: PostJobDto) => USE_MOCKS
      ? Promise.resolve({ id: `job-${Date.now()}` })
      : apiPost<{ id: string }>("/api/recruiter/jobs", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recruiter", "jobs"] }),
  });
}

export function useCloseJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCKS ? Promise.resolve() : apiPut(`/api/recruiter/jobs/${id}/close`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recruiter", "jobs"] }),
  });
}

// ─── Applicant hooks ──────────────────────────────────────────────────────────

export function useApplicants(jobId: string) {
  return useQuery({
    queryKey: ["recruiter", "jobs", jobId, "applicants"],
    queryFn: () => USE_MOCKS ? Promise.resolve(MOCK_APPLICANTS) : apiGet<Applicant[]>(`/api/recruiter/jobs/${jobId}/applicants`),
    enabled: !!jobId,
  });
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, usn, status }: { jobId: string; usn: string; status: ApplicationStatus }) =>
      USE_MOCKS ? Promise.resolve() : apiPut(`/api/recruiter/jobs/${jobId}/applicants/${usn}/status`, { status }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["recruiter", "jobs", v.jobId, "applicants"] }),
  });
}

export function useBulkShortlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, studentUsns }: { jobId: string; studentUsns: string[] }) =>
      USE_MOCKS ? Promise.resolve({ updated: studentUsns.length }) : apiPost<{ updated: number }>(`/api/recruiter/jobs/${jobId}/shortlist`, { studentUsns }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["recruiter", "jobs", v.jobId, "applicants"] }),
  });
}

// ─── Candidate search hooks ───────────────────────────────────────────────────

export function useCandidates(
  filter: { branch?: string; semester?: number; minCgpa?: number; minScore?: number; skills?: string; },
  options?: { enabled?: boolean },
) {
  const params = new URLSearchParams();
  if (filter.branch) params.set("branch", filter.branch);
  if (filter.semester) params.set("semester", String(filter.semester));
  if (filter.minCgpa) params.set("minCgpa", String(filter.minCgpa));
  if (filter.minScore) params.set("minScore", String(filter.minScore));
  if (filter.skills) params.set("skills", filter.skills);
  return useQuery({
    queryKey: ["recruiter", "candidates", filter],
    queryFn: () => USE_MOCKS ? Promise.resolve(MOCK_CANDIDATES) : apiGet<Candidate[]>(`/api/recruiter/candidates?${params}`),
    enabled: options?.enabled ?? true,
  });
}

export function useAiCandidateSearch() {
  return useMutation({
    mutationFn: (query: string) => USE_MOCKS
      ? Promise.resolve({ filter: {}, candidates: MOCK_CANDIDATES, interpretation: `Showing candidates matching: "${query}"` } as AiSearchResult)
      : apiPost<AiSearchResult>("/api/recruiter/candidates/ai-search", { query }),
  });
}

export function useSemanticJdMatch() {
  return useMutation({
    mutationFn: (jdText: string) => USE_MOCKS
      ? Promise.resolve(MOCK_CANDIDATES.map((c, i) => ({
          candidate: c,
          matchScore: 95 - i * 8,
          matchReasons: [
            `Strong ${c.skills[0] ?? "programming"} background matches JD requirements`,
            `CGPA ${c.cgpa} meets or exceeds minimum threshold`,
            i === 0 ? "Internship experience aligns with role expectations" : "Project portfolio shows relevant domain knowledge",
          ],
        })) as SemanticMatchResult[])
      : apiPost<SemanticMatchResult[]>("/api/recruiter/ai/semantic-match", { jdText }),
  });
}

export function useLookAlikeSearch() {
  return useMutation({
    mutationFn: (usn: string) => USE_MOCKS
      ? Promise.resolve(MOCK_CANDIDATES.filter(c => c.studentId !== usn).map((c, i) => ({
          candidate: c,
          similarityScore: 88 - i * 6,
          sharedTraits: [c.skills[0] ?? "Java", `Sem ${c.semester}`, c.department],
        })) as LookAlikeResult[])
      : apiPost<LookAlikeResult[]>("/api/recruiter/ai/look-alike", { usn }),
  });
}

export function useHiddenGemFinder() {
  return useMutation({
    mutationFn: (filter: Record<string, unknown>) => USE_MOCKS
      ? Promise.resolve(MOCK_CANDIDATES.slice(0, 2).map((c, i) => ({
          ...c,
          gemScore: 84 - i * 5,
          signals: [
            i === 0 ? "Top 3% aptitude score" : "5 GitHub repos with 200+ stars",
            "Consistent semester-on-semester CGPA improvement",
            i === 0 ? "Hackathon finalist — Smart India Hackathon 2025" : "Published paper in IEEE conference",
          ],
        })) as HiddenGem[])
      : apiPost<HiddenGem[]>("/api/recruiter/ai/hidden-gems", filter),
  });
}

export function useSkillAdjacency() {
  return useMutation({
    mutationFn: (body: { targetSkill: string; location?: string }) => USE_MOCKS
      ? Promise.resolve(MOCK_CANDIDATES.map((c, i) => ({
          candidate: c,
          targetSkillMatch: i === 0,
          adjacentSkills: i === 0 ? [body.targetSkill] : c.skills.slice(0, 2),
          estimatedRampWeeks: i === 0 ? 0 : 3 + i * 2,
        })) as SkillAdjacencyResult[])
      : apiPost<SkillAdjacencyResult[]>("/api/recruiter/ai/skill-adjacency", body),
  });
}

// ─── Job posting AI hooks ─────────────────────────────────────────────────────

export function useAiGenerateJd() {
  return useMutation({
    mutationFn: (body: { roleTitle: string; companyName: string; roleType: string; requiredSkills: string[]; ctcLpa: number }) =>
      USE_MOCKS
        ? Promise.resolve({
            title: body.roleTitle,
            description: `We are looking for a talented ${body.roleTitle} to join our ${body.roleType} team. You will design, build, and maintain high-quality software systems, collaborate with cross-functional teams, and contribute to technical roadmap decisions.`,
            requirements: body.requiredSkills.map(s => `Proficiency in ${s}`).concat(["Strong problem-solving skills", "Good communication and teamwork"]),
          } as GeneratedJd)
        : apiPost<GeneratedJd>("/api/recruiter/ai/generate-jd", body),
  });
}

export function useJdImprover() {
  return useMutation({
    mutationFn: (body: { jdText: string; ctcLpa: number; minCgpa: number; location: string }) =>
      USE_MOCKS
        ? Promise.resolve({
            suggestions: [
              "Add 'remote-friendly' to expand your candidate pool by ~40%",
              `CGPA cut-off ${body.minCgpa} excludes ${body.minCgpa > 7.5 ? "60%" : "30%"} of qualified candidates — consider lowering to ${Math.max(6.5, body.minCgpa - 0.5)}`,
              "Mention growth opportunities and learning budget to attract top talent",
              "Include team size and tech stack details — candidates research this before applying",
            ],
            poolImpact: `~${body.minCgpa > 8.0 ? 65 : body.minCgpa > 7.0 ? 95 : 140} qualified candidates currently match this JD`,
            inclusiveScore: 72,
          } as JdFeedback)
        : apiPost<JdFeedback>("/api/recruiter/ai/jd-improve", body),
  });
}

export function useInclusiveLanguageCheck() {
  return useMutation({
    mutationFn: (body: { jdText: string }) =>
      USE_MOCKS
        ? Promise.resolve({
            flagged: [
              { phrase: "rockstar developer", suggestion: "skilled developer", reason: "Exclusionary jargon that deters underrepresented candidates" },
              { phrase: "young and dynamic", suggestion: "energetic and adaptable", reason: "Age-related language violates equal opportunity principles" },
              { phrase: "aggressive growth mindset", suggestion: "ambitious, results-driven mindset", reason: "'Aggressive' correlates with masculine-coded language in research" },
            ],
            overallScore: body.jdText.length > 100 ? 68 : 90,
          } as InclusiveLanguageResult)
        : apiPost<InclusiveLanguageResult>("/api/recruiter/ai/inclusive-check", body),
  });
}

export function useSalaryBenchmark() {
  return useMutation({
    mutationFn: (body: { roleTitle: string; roleType: RoleType; location: string; requiredSkills: string[] }) =>
      USE_MOCKS
        ? Promise.resolve({
            suggestedMin: body.roleType === "PRODUCT" ? 12 : body.roleType === "STARTUP" ? 10 : 7,
            suggestedMax: body.roleType === "PRODUCT" ? 18 : body.roleType === "STARTUP" ? 16 : 10,
            median: body.roleType === "PRODUCT" ? 14 : body.roleType === "STARTUP" ? 12 : 8,
            reasoning: `Based on 340+ placements in ${body.location} for ${body.roleType} companies hiring ${body.requiredSkills[0] ?? "engineering"} roles in Q1 2026. ${body.roleType === "PRODUCT" ? "Product companies command 30–40% premium over service companies." : "Service-sector packages are competitive for volume hiring."}`,
          } as SalaryBenchmark)
        : apiPost<SalaryBenchmark>("/api/recruiter/ai/salary-benchmark", body),
  });
}

// ─── Interview AI hooks ───────────────────────────────────────────────────────

export function useAiInterviewQuestions() {
  return useMutation({
    mutationFn: (body: { roleTitle: string; roleType: string; requiredSkills: string[]; round: InterviewRound }) =>
      USE_MOCKS
        ? Promise.resolve([
            { question: `Explain your experience with ${body.requiredSkills[0] ?? "programming"} — describe a complex problem you solved.`, expectedAnswer: "Candidate should describe a real project, the challenge, their approach, and outcome with measurable impact.", difficulty: "MEDIUM" as const },
            { question: "Walk me through your most impactful project. What was your role and what did you learn?", expectedAnswer: "Look for ownership, clear impact, and reflective learning rather than just technical description.", difficulty: "MEDIUM" as const },
            { question: body.round === "HR" ? "Where do you see yourself in 3 years?" : `How would you design a ${body.requiredSkills[0] ?? "scalable"} system from scratch?`, expectedAnswer: body.round === "HR" ? "Alignment with role growth, realistic goals, enthusiasm for the company." : "Look for systematic thinking: requirements → architecture → trade-offs → implementation.", difficulty: body.round === "TECHNICAL" ? "HARD" as const : "EASY" as const },
            { question: "Describe a time you had a conflict with a teammate. How did you resolve it?", expectedAnswer: "Demonstrates emotional intelligence, communication, and constructive conflict resolution.", difficulty: "MEDIUM" as const },
            { question: body.round === "APTITUDE" ? "If a train travels 120 km in 1.5 hours, what is its speed in m/s?" : "What is the difference between horizontal and vertical scaling?", expectedAnswer: body.round === "APTITUDE" ? "120 km / 1.5 h = 80 km/h = 22.22 m/s" : "Horizontal: add more machines. Vertical: add more resources to one machine. Trade-offs: cost, complexity, limits.", difficulty: "EASY" as const },
          ] as InterviewQuestion[])
        : apiPost<InterviewQuestion[]>("/api/recruiter/ai/interview-questions", body),
  });
}

// ─── Offer intelligence hooks ─────────────────────────────────────────────────

export function useAiRankCandidates() {
  return useMutation({
    mutationFn: (jobId: string) => USE_MOCKS
      ? Promise.resolve(MOCK_APPLICANTS.map((a, i) => ({
          usn: a.studentUsn,
          rank: i + 1,
          fitScore: 90 - i * 8,
          rationale: `Strong match — CGPA ${a.cgpa}, ${a.skills.slice(0, 2).join(" + ")} skills verified`,
        })))
      : apiPost<AiRankedCandidate[]>(`/api/recruiter/jobs/${jobId}/ai/rank`, {}),
  });
}

export function useOfferPrediction() {
  return useMutation({
    mutationFn: (jobId: string) => USE_MOCKS
      ? Promise.resolve(MOCK_OFFER_PREDICTIONS)
      : apiPost<OfferPrediction[]>(`/api/recruiter/jobs/${jobId}/ai/offer-prediction`, {}),
  });
}

// ─── Bias & diversity hooks ───────────────────────────────────────────────────

export function useBiasAudit() {
  return useMutation({
    mutationFn: (body: { shortlistedUsns: string[]; allApplicantUsns: string[] }) => USE_MOCKS
      ? Promise.resolve(MOCK_BIAS_AUDIT)
      : apiPost<BiasAuditResult>("/api/recruiter/ai/bias-audit", body),
  });
}

export function useDiversityNudge() {
  return useMutation({
    mutationFn: (body: { jobId: string; currentShortlist: string[] }) => USE_MOCKS
      ? Promise.resolve([...body.currentShortlist].reverse())
      : apiPost<string[]>("/api/recruiter/ai/diversity-nudge", body),
  });
}

// ─── Analytics hooks ──────────────────────────────────────────────────────────

export function useRecruiterAnalytics() {
  return useQuery({
    queryKey: ["recruiter", "analytics"],
    queryFn: () => USE_MOCKS ? Promise.resolve(MOCK_ANALYTICS) : apiGet<RecruiterAnalytics>("/api/recruiter/analytics"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecruiterNlQuery() {
  return useMutation({
    mutationFn: (query: string): Promise<{ answer: string; table: Record<string, unknown>[] | undefined }> => USE_MOCKS
      ? Promise.resolve({
          answer: `Based on your hiring data: ${query.includes("CSE") ? "47 CSE students with CGPA above 8 were shortlisted in the last 2 years, with an 82% offer acceptance rate." : "Your pipeline shows 342 total applicants this quarter with a 12% shortlisting rate — 4% below your target of 16%."}`,
          table: query.includes("CSE") ? ([
            { Department: "CSE", "Students Shortlisted": 47, "Avg CGPA": "8.6", "Offer Rate": "82%" },
            { Department: "ISE", "Students Shortlisted": 28, "Avg CGPA": "8.3", "Offer Rate": "75%" },
          ] as Record<string, unknown>[]) : undefined,
        })
      : apiPost<{ answer: string; table: Record<string, unknown>[] | undefined }>("/api/recruiter/ai/nl-query", { query }),
  });
}

// ─── Drive management types ───────────────────────────────────────────────────

export type DriveTier = "POOL" | "DREAM" | "SUPER_DREAM" | "MASS" | "NICHE";
export type DriveStatus = "DRAFT" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface DriveCollege {
  collegeId: string;
  collegeName: string;
  city: string;
  tier: 1 | 2 | 3;
  tpoName: string;
  tpoEmail: string;
  eligibleStudentCount: number;
  slotDate?: string;
  slotConfirmed: boolean;
}

export interface CampusDrive {
  id: string;
  jobId: string;
  jobTitle: string;
  driveTier: DriveTier;
  targetColleges: DriveCollege[];
  driveDate?: string;
  status: DriveStatus;
  totalEligible: number;
  totalRegistered: number;
  totalOffered: number;
  estimatedHires: number;
  estimatedCostPerHire: number;
  createdAt: string;
}

export interface CreateDriveDto {
  jobId: string;
  driveTier: DriveTier;
  targetCollegeIds: string[];
  driveDate?: string;
  eligibilityOverrides?: {
    maxActiveBacklogs?: number;
    minCgpaOverride?: number;
    allowLateralEntry?: boolean;
  };
}

// ─── Pre-joining engagement types ─────────────────────────────────────────────

export type JoiningRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface PreJoinCandidate {
  usn: string;
  name: string;
  college: string;
  branch: string;
  offerCTC: number;
  joiningDate: string;
  joiningProbability: number;
  riskLevel: JoiningRiskLevel;
  riskReasons: string[];
  lastEngagedAt?: string;
  daysSinceLastContact: number;
  skillBridgeEnrolled: boolean;
  documentsComplete: boolean;
  buddyAssigned: boolean;
  parentCommunicationSent: boolean;
}

export interface EngagementAction {
  type: "CALL" | "WHATSAPP" | "EMAIL" | "BUDDY_CONNECT" | "FLEXIBILITY_OFFER" | "MANAGER_VIDEO";
  candidateUsn: string;
  message?: string;
  scheduledAt?: string;
}

// ─── TPO collaboration types ──────────────────────────────────────────────────

export type TpoApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO";

export interface TpoCoApproval {
  driveId: string;
  collegeId: string;
  collegeName: string;
  tpoName: string;
  shortlistCount: number;
  approvalStatus: TpoApprovalStatus;
  eligibilityFlags: string[];
  tpoNotes?: string;
  updatedAt: string;
}

export interface CollegePlacementPolicy {
  collegeId: string;
  collegeName: string;
  poolCTCCap: number;
  dreamCTCMin: number;
  superDreamCTCMin: number;
  maxBacklogsAllowed: number;
  activeBacklogsAllowed: boolean;
  oneOfferPerStudent: boolean;
  tierLockingEnabled: boolean;
}

// ─── Drive hooks ──────────────────────────────────────────────────────────────

const MOCK_DRIVES: CampusDrive[] = [
  {
    id: "drive-1", jobId: "job-1", jobTitle: "Software Engineer", driveTier: "DREAM",
    targetColleges: [
      { collegeId: "rvce", collegeName: "RVCE", city: "Bengaluru", tier: 1, tpoName: "Dr. Suresh Kumar", tpoEmail: "tpo@rvce.edu", eligibleStudentCount: 142, slotDate: "2026-07-15", slotConfirmed: true },
      { collegeId: "msrit", collegeName: "MSRIT", city: "Bengaluru", tier: 1, tpoName: "Prof. Anitha Rao", tpoEmail: "placement@msrit.edu", eligibleStudentCount: 98, slotDate: "2026-07-16", slotConfirmed: false },
    ],
    driveDate: "2026-07-15", status: "CONFIRMED",
    totalEligible: 240, totalRegistered: 0, totalOffered: 0,
    estimatedHires: 18, estimatedCostPerHire: 38000, createdAt: "2026-05-01",
  },
  {
    id: "drive-2", jobId: "job-2", jobTitle: "Frontend Developer", driveTier: "SUPER_DREAM",
    targetColleges: [
      { collegeId: "rvce", collegeName: "RVCE", city: "Bengaluru", tier: 1, tpoName: "Dr. Suresh Kumar", tpoEmail: "tpo@rvce.edu", eligibleStudentCount: 54, slotConfirmed: true },
    ],
    status: "DRAFT",
    totalEligible: 54, totalRegistered: 0, totalOffered: 0,
    estimatedHires: 6, estimatedCostPerHire: 52000, createdAt: "2026-04-28",
  },
];

const MOCK_PRE_JOIN: PreJoinCandidate[] = [
  { usn: "1RV21CS001", name: "Arjun Sharma", college: "RVCE", branch: "CSE", offerCTC: 8.5, joiningDate: "2026-08-01", joiningProbability: 78, riskLevel: "LOW", riskReasons: [], lastEngagedAt: "2026-04-28", daysSinceLastContact: 3, skillBridgeEnrolled: true, documentsComplete: true, buddyAssigned: true, parentCommunicationSent: true },
  { usn: "1RV21CS047", name: "Priya Patel", college: "RVCE", branch: "CSE", offerCTC: 12, joiningDate: "2026-08-01", joiningProbability: 42, riskLevel: "HIGH", riskReasons: ["Competing offer detected at ₹15 LPA", "No response in 12 days", "LinkedIn shows active job searching"], lastEngagedAt: "2026-04-19", daysSinceLastContact: 12, skillBridgeEnrolled: false, documentsComplete: false, buddyAssigned: false, parentCommunicationSent: false },
  { usn: "1RV21IS012", name: "Rohit Kumar", college: "RVCE", branch: "ISE", offerCTC: 6.5, joiningDate: "2026-07-15", joiningProbability: 91, riskLevel: "LOW", riskReasons: [], lastEngagedAt: "2026-05-01", daysSinceLastContact: 0, skillBridgeEnrolled: true, documentsComplete: true, buddyAssigned: true, parentCommunicationSent: true },
  { usn: "1RV21ECE024", name: "Sneha Reddy", college: "RVCE", branch: "ECE", offerCTC: 7.5, joiningDate: "2026-08-01", joiningProbability: 58, riskLevel: "MEDIUM", riskReasons: ["Family pressure to pursue higher studies", "Not enrolled in skill bridge"], lastEngagedAt: "2026-04-22", daysSinceLastContact: 9, skillBridgeEnrolled: false, documentsComplete: true, buddyAssigned: false, parentCommunicationSent: false },
];

const MOCK_TPO_APPROVALS: TpoCoApproval[] = [
  { driveId: "drive-1", collegeId: "rvce", collegeName: "RVCE", tpoName: "Dr. Suresh Kumar", shortlistCount: 22, approvalStatus: "APPROVED", eligibilityFlags: [], tpoNotes: "All candidates verified — no active backlogs, attendance above 75%.", updatedAt: "2026-05-01" },
  { driveId: "drive-1", collegeId: "msrit", collegeName: "MSRIT", tpoName: "Prof. Anitha Rao", shortlistCount: 14, approvalStatus: "PENDING", eligibilityFlags: ["2 candidates have year-down history — needs manual review"], updatedAt: "2026-04-30" },
];

export function useDrives() {
  return useQuery({
    queryKey: ["recruiter", "drives"],
    queryFn: () => USE_MOCKS ? Promise.resolve(MOCK_DRIVES) : apiGet<CampusDrive[]>("/api/recruiter/drives"),
  });
}

export function useCreateDrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDriveDto) => USE_MOCKS
      ? Promise.resolve({ id: `drive-${Date.now()}` })
      : apiPost<{ id: string }>("/api/recruiter/drives", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recruiter", "drives"] }),
  });
}

export function usePreJoinCandidates() {
  return useQuery({
    queryKey: ["recruiter", "pre-joining"],
    queryFn: () => USE_MOCKS ? Promise.resolve(MOCK_PRE_JOIN) : apiGet<PreJoinCandidate[]>("/api/recruiter/pre-joining"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEngagementAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: EngagementAction) => USE_MOCKS
      ? Promise.resolve()
      : apiPost("/api/recruiter/pre-joining/action", action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recruiter", "pre-joining"] }),
  });
}

export function useTpoApprovals(driveId: string) {
  return useQuery({
    queryKey: ["recruiter", "drives", driveId, "tpo-approvals"],
    queryFn: () => USE_MOCKS ? Promise.resolve(MOCK_TPO_APPROVALS) : apiGet<TpoCoApproval[]>(`/api/recruiter/drives/${driveId}/tpo-approvals`),
    enabled: !!driveId,
  });
}

export function useCollegePlacementPolicy(collegeId: string) {
  return useQuery({
    queryKey: ["recruiter", "colleges", collegeId, "policy"],
    queryFn: () => USE_MOCKS
      ? Promise.resolve({ collegeId, collegeName: "RVCE", poolCTCCap: 6, dreamCTCMin: 6, superDreamCTCMin: 10, maxBacklogsAllowed: 0, activeBacklogsAllowed: false, oneOfferPerStudent: true, tierLockingEnabled: true } as CollegePlacementPolicy)
      : apiGet<CollegePlacementPolicy>(`/api/recruiter/colleges/${collegeId}/placement-policy`),
    enabled: !!collegeId,
  });
}

// ─── Outreach hooks ───────────────────────────────────────────────────────────

export function useOutreachGenerator() {
  return useMutation({
    mutationFn: (body: { jobId: string; candidates: Candidate[]; channel: OutreachChannel }) =>
      USE_MOCKS
        ? Promise.resolve(body.candidates.map(c => {
            const skill = c.skills[0] ?? "technical";
            const isWhatsApp = body.channel === "WHATSAPP";
            const msg = isWhatsApp
              ? `Hi ${c.name.split(" ")[0]}! 👋 We came across your profile on EdAI and were impressed by your ${skill} skills and strong academic record (CGPA ${c.cgpa}). We have an exciting opening that's a great match for your profile. Would you be open to a quick 15-min chat this week? Reply YES to know more. — Recruiter`
              : `Hi ${c.name},\n\nI came across your profile on EdAI and was impressed by your expertise in ${skill} and your strong academic performance (CGPA ${c.cgpa}).\n\nWe are currently hiring for a role that closely aligns with your skills and career interests. I'd love to share more details.\n\nWould you have 15 minutes this week for a quick call?\n\nBest regards,\nRecruiter`;
            return {
              candidateUsn: c.studentId,
              candidateName: c.name,
              channel: body.channel,
              ...(body.channel === "EMAIL" ? { subject: `Exciting Opportunity — ${c.skills[0] ?? "Engineering"} Role` } : {}),
              body: msg,
              characterCount: msg.length,
              consentVerified: c.consentedToRecruiterDiscovery,
              ...(c.consentTimestamp ? { consentTimestamp: c.consentTimestamp } : {}),
              optedOut: false,
            } as OutreachMessage;
          }))
        : apiPost<OutreachMessage[]>("/api/recruiter/ai/outreach", body),
  });
}
