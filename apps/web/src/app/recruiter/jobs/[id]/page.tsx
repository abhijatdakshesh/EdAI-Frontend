"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Brain, Loader2, ArrowRight, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecruiterJob, useAiInterviewQuestions, type InterviewRound } from "@/lib/api/recruiter";

const ROUNDS: InterviewRound[] = ["APTITUDE", "TECHNICAL", "HR"];
const DIFFICULTY_COLOR = { EASY: "text-green-600", MEDIUM: "text-amber-600", HARD: "text-red-600" };

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useRecruiterJob(id);
  const { mutate: genQuestions, isPending: generating, data: questions } = useAiInterviewQuestions();
  const [round, setRound] = useState<InterviewRound>("TECHNICAL");

  if (isLoading) return <p className="text-stone-400 text-sm py-8 text-center">Loading…</p>;
  if (!job) return <p className="text-stone-500 text-sm py-8 text-center">Job not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{job.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge>{job.status}</Badge>
            <Badge variant="outline">{job.roleType}</Badge>
            <span className="text-sm text-stone-500">₹{job.ctcLpa} LPA · {job.location}</span>
          </div>
        </div>
        <Button asChild>
          <Link href={`/recruiter/jobs/${id}/applicants`} className="flex items-center gap-2">
            <Users className="h-4 w-4" /> View Applicants <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-center">
        {[
          { label: "Applicants", value: job.applicantCount },
          { label: "Shortlisted", value: job.shortlistedCount },
          { label: "Offers", value: job.offerCount },
        ].map(({ label, value }) => (
          <Card key={label}><CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-stone-900">{value}</p>
            <p className="text-xs text-stone-500">{label}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Job Description</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-stone-600 whitespace-pre-wrap">{job.description}</p>
          <div className="mt-4">
            <p className="text-xs font-medium text-stone-500 mb-2">Required Skills</p>
            <div className="flex flex-wrap gap-1">
              {job.requiredSkills.map(s => (
                <span key={s} className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-stone-500 mb-1">Eligible Branches</p>
            <p className="text-sm text-stone-600">{job.eligibleBranches.join(", ") || "All"}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Interview Questions */}
      <Card className="border-violet-200">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">AI Interview Questions</CardTitle>
            <p className="text-xs text-stone-500 mt-0.5">Generate round-specific questions for this role</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="text-sm border border-stone-200 rounded px-3 py-1.5 bg-white"
              value={round}
              onChange={e => setRound(e.target.value as InterviewRound)}
            >
              {ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button
              onClick={() => genQuestions({ roleTitle: job.title, roleType: job.roleType, requiredSkills: job.requiredSkills, round })}
              disabled={generating}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
              size="sm"
            >
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
              {generating ? "Generating…" : "Generate"}
            </Button>
          </div>
        </CardHeader>
        {questions && (
          <CardContent>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="border border-stone-100 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-stone-400 mt-0.5 w-5 shrink-0">{i + 1}.</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-stone-900">{q.question}</p>
                        <span className={`text-xs font-medium shrink-0 ${DIFFICULTY_COLOR[q.difficulty]}`}>{q.difficulty}</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1"><span className="font-medium">Expected:</span> {q.expectedAnswer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
