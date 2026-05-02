"use client";

import Link from "next/link";
import { Briefcase, Users, CheckCircle, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecruiterJobs } from "@/lib/api/recruiter";

export default function RecruiterDashboardPage() {
  const { data: jobs = [], isLoading } = useRecruiterJobs();

  const totalApplicants = jobs.reduce((s, j) => s + (j.applicantCount ?? 0), 0);
  const totalShortlisted = jobs.reduce((s, j) => s + (j.shortlistedCount ?? 0), 0);
  const totalOffers = jobs.reduce((s, j) => s + (j.offerCount ?? 0), 0);
  const openJobs = jobs.filter(j => j.status === "OPEN").length;

  const stats = [
    { label: "Open Jobs", value: openJobs, icon: Briefcase, color: "text-blue-600" },
    { label: "Total Applicants", value: totalApplicants, icon: Users, color: "text-violet-600" },
    { label: "Shortlisted", value: totalShortlisted, icon: CheckCircle, color: "text-amber-600" },
    { label: "Offers Made", value: totalOffers, icon: TrendingUp, color: "text-green-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Recruiter Dashboard</h1>
          <p className="text-stone-500 mt-1">Manage your job postings and find the best candidates</p>
        </div>
        <Button asChild>
          <Link href="/recruiter/jobs/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Post a Job
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Icon className={`h-6 w-6 ${color}`} />
                <div>
                  <p className="text-2xl font-bold text-stone-900">{isLoading ? "—" : value}</p>
                  <p className="text-xs text-stone-500">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Job Posts</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/recruiter/jobs" className="flex items-center gap-1 text-sm">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-stone-400 text-sm py-4 text-center">Loading…</p>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-10 w-10 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 text-sm">No jobs posted yet.</p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/recruiter/jobs/new">Post your first job</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-900 text-sm">{job.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {job.roleType} · ₹{job.ctcLpa}LPA · {job.applicantCount} applicants
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === "OPEN" ? "default" : "secondary"} className="text-xs">
                      {job.status}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/recruiter/jobs/${job.id}/applicants`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
