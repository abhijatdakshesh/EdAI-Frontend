"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle, ChevronRight, Loader2, Users, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRecruiterJobs, useCreateDrive, type DriveTier, type CreateDriveDto } from "@/lib/api/recruiter";

const TIERS: { id: DriveTier; label: string; desc: string; ctcRange: string }[] = [
  { id: "POOL", label: "Pool Campus", desc: "All eligible students can participate. Students with prior offers may reapply.", ctcRange: "Up to ₹6 LPA" },
  { id: "DREAM", label: "Dream Company", desc: "Students who already have Pool offers may participate. CTC above pool threshold.", ctcRange: "₹6–12 LPA" },
  { id: "SUPER_DREAM", label: "Super Dream", desc: "Top-tier only. Students can decline lower-tier offers to participate.", ctcRange: "₹12+ LPA" },
  { id: "MASS", label: "Mass Recruiter", desc: "High-volume entry-level hiring across all branches.", ctcRange: "₹3–6 LPA" },
  { id: "NICHE", label: "Niche / Specialized", desc: "Filtered to specific branches or skill profiles. Lower volume, higher fit.", ctcRange: "Varies" },
];

// Static college list for demo — in production, fetched from /recruiter/colleges
const AVAILABLE_COLLEGES = [
  { id: "rvce", name: "Raycraft", city: "Bengaluru", tier: 1, eligible: 142 },
  { id: "msrit", name: "MSRIT", city: "Bengaluru", tier: 1, eligible: 98 },
  { id: "bit_bengaluru", name: "BIT Bengaluru", city: "Bengaluru", tier: 2, eligible: 87 },
  { id: "rvpu", name: "RV Polytechnic", city: "Bengaluru", tier: 2, eligible: 64 },
  { id: "bms", name: "BMS College of Engg", city: "Bengaluru", tier: 1, eligible: 121 },
  { id: "vtu_dharwad", name: "SDM College Dharwad", city: "Dharwad", tier: 2, eligible: 73 },
  { id: "nie_mysore", name: "NIE Mysore", city: "Mysuru", tier: 2, eligible: 89 },
  { id: "sjce", name: "SJCE Mysuru", city: "Mysuru", tier: 2, eligible: 56 },
];

const STEPS = ["Select Job", "Drive Tier", "Target Colleges", "Eligibility Rules", "Confirm"];

export default function NewDrivePage() {
  const router = useRouter();
  const { data: jobs = [], isLoading: loadingJobs } = useRecruiterJobs();
  const { mutate: createDrive, isPending: creating } = useCreateDrive();

  const [step, setStep] = useState(0);
  const [selectedJob, setSelectedJob] = useState("");
  const [tier, setTier] = useState<DriveTier>("DREAM");
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [driveDate, setDriveDate] = useState("");
  const [maxBacklogs, setMaxBacklogs] = useState(0);
  const [allowLateral, setAllowLateral] = useState(false);

  function toggleCollege(id: string) {
    setSelectedColleges(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  const totalEligible = AVAILABLE_COLLEGES
    .filter(c => selectedColleges.includes(c.id))
    .reduce((s, c) => s + c.eligible, 0);

  function handleSubmit() {
    const dto: CreateDriveDto = {
      jobId: selectedJob,
      driveTier: tier,
      targetCollegeIds: selectedColleges,
      ...(driveDate ? { driveDate } : {}),
      eligibilityOverrides: {
        maxActiveBacklogs: maxBacklogs,
        allowLateralEntry: allowLateral,
      },
    };
    createDrive(dto, { onSuccess: () => router.push("/recruiter/drives") });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Plan a Campus Drive</h1>
        <p className="text-stone-500 mt-1">Multi-college drive coordinator — Pool, Dream, and Super Dream tiers enforced automatically</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <button
              onClick={() => i < step && setStep(i)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                i === step ? "bg-amber-600 text-white" :
                i < step ? "bg-amber-100 text-amber-700 cursor-pointer hover:bg-amber-200" :
                "bg-stone-100 text-stone-400"
              }`}
            >
              {i + 1}. {s}
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-stone-300" />}
          </div>
        ))}
      </div>

      {/* Step 0: Select Job */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Which job is this drive for?</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loadingJobs ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-stone-400" /></div>
            ) : (
              jobs.map(j => (
                <button
                  key={j.id}
                  onClick={() => setSelectedJob(j.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedJob === j.id ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-900">{j.title}</p>
                      <p className="text-sm text-stone-500">{j.location} · ₹{j.ctcLpa} LPA · Min CGPA {j.minCgpa}</p>
                    </div>
                    {selectedJob === j.id && <CheckCircle className="h-5 w-5 text-amber-600 shrink-0" />}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Drive Tier */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Select Drive Tier</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-stone-500">The tier determines placement policy enforcement — who can participate, offer locking, and TPO co-approval rules.</p>
            {TIERS.map(t => (
              <button
                key={t.id}
                onClick={() => setTier(t.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  tier === t.id ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-stone-900">{t.label}</p>
                    <p className="text-sm text-stone-500 mt-0.5">{t.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium text-stone-600">{t.ctcRange}</span>
                    {tier === t.id && <CheckCircle className="h-4 w-4 text-amber-600 ml-auto mt-1" />}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Target Colleges */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Target Colleges</CardTitle>
              {selectedColleges.length > 0 && (
                <Badge className="bg-amber-100 text-amber-700">{selectedColleges.length} selected · {totalEligible} eligible</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_COLLEGES.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleCollege(c.id)}
                  className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    selectedColleges.includes(c.id) ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-stone-900">{c.name}</p>
                        <span className="text-xs text-stone-400">Tier {c.tier}</span>
                      </div>
                      <p className="text-xs text-stone-500">{c.city} · {c.eligible} eligible</p>
                    </div>
                    {selectedColleges.includes(c.id) && <CheckCircle className="h-4 w-4 text-amber-600 shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Eligibility Rules */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Eligibility Rules</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <p className="text-xs text-stone-500 bg-blue-50 border border-blue-100 rounded px-3 py-2">
              Base CGPA cutoff and branch filters are inherited from the job posting. These rules override or extend them per drive.
            </p>
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 block">Max Historical Backlogs Allowed</label>
              <div className="flex items-center gap-3">
                {[0, 1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setMaxBacklogs(n)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      maxBacklogs === n ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {maxBacklogs === 0 && <p className="text-xs text-stone-400 mt-1">Students with any historical backlog excluded</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 block">Drive Date (optional)</label>
              <Input type="date" value={driveDate} onChange={e => setDriveDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="lateral"
                checked={allowLateral}
                onChange={e => setAllowLateral(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="lateral" className="text-sm text-stone-700">Allow lateral entry students</label>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">One-Offer-Per-Student Rule (Auto-enforced)</p>
              <p className="text-xs text-amber-600">
                {tier === "POOL"
                  ? "Pool drive: Students who accept a Pool offer are locked out of Dream and Super Dream drives. Enforced by TPO co-approval."
                  : tier === "DREAM"
                  ? "Dream drive: Students who accepted Pool offers may still participate. Students with Dream offers are locked out of other Dream drives."
                  : tier === "SUPER_DREAM"
                  ? "Super Dream drive: Students can decline lower-tier offers to participate. TPO will notify affected students."
                  : "Mass / Niche: Standard pool rules apply. TPO approval required before offers."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Confirm Drive</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Job", value: jobs.find(j => j.id === selectedJob)?.title ?? selectedJob },
              { label: "Drive Tier", value: TIERS.find(t => t.id === tier)?.label ?? tier },
              { label: "Target Colleges", value: `${selectedColleges.length} colleges` },
              { label: "Total Eligible Students", value: totalEligible.toLocaleString() },
              { label: "Max Backlogs Allowed", value: maxBacklogs },
              { label: "Drive Date", value: driveDate || "TBD" },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-2 border-b border-stone-100 last:border-0">
                <span className="text-sm text-stone-500">{row.label}</span>
                <span className="text-sm font-medium text-stone-900">{row.value}</span>
              </div>
            ))}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                After creation, drive invitations are sent to selected college TPOs for slot confirmation and eligibility approval. Offers cannot be extended until TPO co-approval is complete.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={
              (step === 0 && !selectedJob) ||
              (step === 2 && selectedColleges.length === 0)
            }
          >
            Continue <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={creating}>
            {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</> : "Create Drive"}
          </Button>
        )}
      </div>
    </div>
  );
}
