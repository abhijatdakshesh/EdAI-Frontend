"use client";

import Link from "next/link";
import { Plus, Users, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecruiterJobs, useCloseJob } from "@/lib/api/recruiter";

export default function RecruiterJobsPage() {
  const { data: jobs = [], isLoading } = useRecruiterJobs();
  const { mutate: closeJob, isPending: closing } = useCloseJob();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">My Job Posts</h1>
          <p className="text-stone-500 mt-1">{jobs.length} posting{jobs.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/recruiter/jobs/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Post a Job
          </Link>
        </Button>
      </div>

      {isLoading && <p className="text-stone-400 text-sm">Loading…</p>}

      {!isLoading && jobs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-stone-500">No jobs posted yet.</p>
            <Button asChild className="mt-4">
              <Link href="/recruiter/jobs/new">Post your first job</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {jobs.map(job => (
          <Card key={job.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-stone-900">{job.title}</h2>
                    <Badge variant={job.status === "OPEN" ? "default" : "secondary"} className="text-xs">
                      {job.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{job.roleType}</Badge>
                  </div>
                  <p className="text-sm text-stone-500 mt-1">
                    ₹{job.ctcLpa} LPA · {job.location} · Min CGPA {job.minCgpa} · Deadline {job.applyDeadline}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {job.applicantCount} applied
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" /> {job.shortlistedCount} shortlisted
                    </span>
                    {job.offerCount > 0 && (
                      <span className="flex items-center gap-1 text-green-600">
                        {job.offerCount} offer{job.offerCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {job.requiredSkills.slice(0, 5).map(s => (
                      <span key={s} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {job.status === "OPEN" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => closeJob(job.id)}
                      disabled={closing}
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Close
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/recruiter/jobs/${job.id}/applicants`} className="flex items-center gap-1">
                      Applicants <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
