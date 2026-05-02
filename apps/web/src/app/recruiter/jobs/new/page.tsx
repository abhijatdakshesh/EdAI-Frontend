"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, Loader2, Plus, X, CheckCircle, AlertCircle, IndianRupee, Languages, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  usePostJob, useAiGenerateJd, useJdImprover, useInclusiveLanguageCheck, useSalaryBenchmark,
  type RoleType,
} from "@/lib/api/recruiter";

const BRANCHES = ["CSE", "ISE", "ECE", "EEE", "ME", "CV", "CH", "BT"];
const ROLE_TYPES: RoleType[] = ["PRODUCT", "SERVICE", "STARTUP", "CORE"];

export default function PostJobPage() {
  const router = useRouter();
  const { mutate: postJob, isPending: posting } = usePostJob();
  const { mutate: generateJd, isPending: generating } = useAiGenerateJd();
  const { mutate: improveJd, isPending: improving, data: jdFeedback } = useJdImprover();
  const { mutate: checkLanguage, isPending: checking, data: languageResult } = useInclusiveLanguageCheck();
  const { mutate: benchmarkSalary, isPending: benchmarking, data: salaryData } = useSalaryBenchmark();

  const [form, setForm] = useState({
    title: "", description: "", roleType: "SERVICE" as RoleType,
    ctcLpa: 6, minCgpa: 7.0, location: "Bengaluru", applyDeadline: "",
    eligibleBranches: [] as string[],
    eligibleSemesters: [8] as number[],
    requiredSkills: [] as string[],
    maxActiveBacklogs: 0,
    maxHistoricalBacklogs: 0,
    lateralEntryAllowed: false,
  });
  const [skillInput, setSkillInput] = useState("");
  const [companyName, setCompanyName] = useState("");

  function toggleBranch(b: string) {
    setForm(f => ({
      ...f,
      eligibleBranches: f.eligibleBranches.includes(b)
        ? f.eligibleBranches.filter(x => x !== b)
        : [...f.eligibleBranches, b],
    }));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !form.requiredSkills.includes(s)) {
      setForm(f => ({ ...f, requiredSkills: [...f.requiredSkills, s] }));
    }
    setSkillInput("");
  }

  function handleGenerateJd() {
    if (!form.title) return;
    generateJd(
      { roleTitle: form.title, companyName, roleType: form.roleType, requiredSkills: form.requiredSkills, ctcLpa: form.ctcLpa },
      { onSuccess: jd => setForm(f => ({ ...f, description: jd.description })) },
    );
  }

  function handleAnalyseJd() {
    if (form.description.length > 50) {
      improveJd({ jdText: form.description, ctcLpa: form.ctcLpa, minCgpa: form.minCgpa, location: form.location });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    postJob(form, { onSuccess: () => router.push("/recruiter/jobs") });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Post a New Job</h1>
        <p className="text-stone-500 mt-1">AI-powered job creation with inclusivity checks and salary benchmarking</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Job Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Job Title *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Software Engineer" required />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Company Name</label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. TCS, Razorpay" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Role Type</label>
                <select
                  className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
                  value={form.roleType}
                  onChange={e => setForm(f => ({ ...f, roleType: e.target.value as RoleType }))}
                >
                  {ROLE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">CTC (LPA)</label>
                <div className="flex gap-1">
                  <Input type="number" min="1" step="0.5" value={form.ctcLpa} onChange={e => setForm(f => ({ ...f, ctcLpa: +e.target.value }))} />
                  <Button
                    type="button" variant="outline" size="sm"
                    onClick={() => benchmarkSalary({ roleTitle: form.title || "Engineer", roleType: form.roleType, location: form.location, requiredSkills: form.requiredSkills })}
                    disabled={benchmarking}
                    className="shrink-0 text-xs text-green-700 border-green-200"
                    title="AI Salary Benchmark"
                  >
                    {benchmarking ? <Loader2 className="h-3 w-3 animate-spin" /> : <IndianRupee className="h-3 w-3" />}
                  </Button>
                </div>
                {salaryData && (
                  <p className="text-xs text-green-700 mt-1">
                    Benchmark: ₹{salaryData.suggestedMin}–{salaryData.suggestedMax}L (median ₹{salaryData.median}L)
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Min CGPA</label>
                <Input type="number" min="0" max="10" step="0.1" value={form.minCgpa} onChange={e => setForm(f => ({ ...f, minCgpa: +e.target.value }))} />
              </div>
            </div>

            {salaryData && (
              <p className="text-xs text-stone-500 bg-green-50 rounded px-3 py-2">{salaryData.reasoning}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Location</label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Bengaluru" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Apply Deadline</label>
                <Input type="date" value={form.applyDeadline} onChange={e => setForm(f => ({ ...f, applyDeadline: e.target.value }))} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VTU Eligibility Rules */}
        <Card>
          <CardHeader><CardTitle className="text-base">Eligibility Rules (VTU / AICTE)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Max Active Backlogs</label>
                <div className="flex gap-1">
                  {[0, 1, 2].map(n => (
                    <button
                      key={n} type="button"
                      onClick={() => setForm(f => ({ ...f, maxActiveBacklogs: n }))}
                      className={`w-10 h-9 rounded text-sm font-medium transition-colors ${form.maxActiveBacklogs === n ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}
                    >{n}</button>
                  ))}
                </div>
                <p className="text-xs text-stone-400 mt-1">Students with more active backlogs excluded</p>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Max Historical Backlogs</label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map(n => (
                    <button
                      key={n} type="button"
                      onClick={() => setForm(f => ({ ...f, maxHistoricalBacklogs: n }))}
                      className={`w-10 h-9 rounded text-sm font-medium transition-colors ${form.maxHistoricalBacklogs === n ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}
                    >{n}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="lateral" checked={form.lateralEntryAllowed} onChange={e => setForm(f => ({ ...f, lateralEntryAllowed: e.target.checked }))} className="rounded" />
              <label htmlFor="lateral" className="text-sm text-stone-700">Allow lateral entry students</label>
            </div>
            <p className="text-xs text-stone-400 bg-stone-50 rounded px-3 py-2">
              These rules are enforced server-side — students not meeting them will not appear in candidate search for this job, and TPO co-approval will flag violations before offers.
            </p>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader><CardTitle className="text-base">Required Skills</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="e.g. Java, Python, React"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addSkill}><Plus className="h-4 w-4" /></Button>
            </div>
            {form.requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.requiredSkills.map(s => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    {s}
                    <button type="button" onClick={() => setForm(f => ({ ...f, requiredSkills: f.requiredSkills.filter(x => x !== s) }))}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eligible Branches */}
        <Card>
          <CardHeader><CardTitle className="text-base">Eligible Branches</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map(b => (
                <button
                  key={b} type="button" onClick={() => toggleBranch(b)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    form.eligibleBranches.includes(b) ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job Description with AI */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Job Description</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button" variant="outline" size="sm"
                onClick={handleAnalyseJd}
                disabled={improving || form.description.length < 50}
                className="gap-1.5 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
              >
                {improving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
                Analyse JD
              </Button>
              <Button
                type="button" variant="outline" size="sm"
                onClick={() => checkLanguage({ jdText: form.description })}
                disabled={checking || !form.description}
                className="gap-1.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                Check Language
              </Button>
              <Button
                type="button" variant="outline" size="sm"
                onClick={handleGenerateJd}
                disabled={generating || !form.title}
                className="gap-1.5 text-xs text-violet-700 border-violet-200 hover:bg-violet-50"
              >
                {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                AI Generate
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the role, responsibilities, and what you're looking for. Or click AI Generate above."
              rows={6}
              required
            />

            {/* Inclusive Language Results */}
            {languageResult && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Languages className="h-3.5 w-3.5 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-700">Inclusive Language Score: {languageResult.overallScore}/100</p>
                </div>
                {languageResult.flagged.length === 0 ? (
                  <p className="text-xs text-green-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> No exclusionary language detected.</p>
                ) : (
                  <div className="space-y-1.5">
                    {languageResult.flagged.map((f, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium text-red-600">"{f.phrase}"</span>
                        <span className="text-stone-500"> → </span>
                        <span className="text-green-700">"{f.suggestion}"</span>
                        <p className="text-stone-500 mt-0.5">{f.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* JD Improver Results */}
            {improving && (
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Analysing JD for improvements…
              </div>
            )}
            {jdFeedback && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-amber-700">AI JD Feedback</p>
                  <span className="text-xs text-stone-500">{jdFeedback.poolImpact}</span>
                </div>
                <ul className="space-y-1">
                  {jdFeedback.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                      <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-stone-400">AI generates from your role title, type, and required skills. Suggestions appear on blur.</p>
          </CardContent>
        </Card>

        <Button type="submit" disabled={posting} className="w-full">
          {posting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Posting…</> : "Post Job"}
        </Button>
      </form>
    </div>
  );
}
