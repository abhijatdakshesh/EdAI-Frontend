"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Building2, Calendar, Users, TrendingUp, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDrives, useTpoApprovals, type DriveTier, type DriveStatus, type TpoApprovalStatus } from "@/lib/api/recruiter";

const TIER_COLORS: Record<DriveTier, string> = {
  POOL: "bg-stone-100 text-stone-700",
  DREAM: "bg-blue-100 text-blue-700",
  SUPER_DREAM: "bg-violet-100 text-violet-700",
  MASS: "bg-green-100 text-green-700",
  NICHE: "bg-rose-100 text-rose-700",
};

const STATUS_COLORS: Record<DriveStatus, string> = {
  DRAFT: "bg-stone-100 text-stone-600",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-stone-200 text-stone-500",
  CANCELLED: "bg-red-100 text-red-700",
};

const TPO_STATUS_ICONS: Record<TpoApprovalStatus, React.ElementType> = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  REJECTED: AlertCircle,
  NEEDS_INFO: AlertCircle,
};

const TPO_STATUS_COLORS: Record<TpoApprovalStatus, string> = {
  PENDING: "text-amber-500",
  APPROVED: "text-green-600",
  REJECTED: "text-red-500",
  NEEDS_INFO: "text-orange-500",
};

function TpoApprovalPanel({ driveId }: { driveId: string }) {
  const { data: approvals = [], isLoading } = useTpoApprovals(driveId);
  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-stone-400" /></div>;
  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">TPO Approvals</p>
      {approvals.map(a => {
        const Icon = TPO_STATUS_ICONS[a.approvalStatus];
        return (
          <div key={a.collegeId} className="flex items-start gap-3 p-2 rounded-lg bg-stone-50 border border-stone-100">
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${TPO_STATUS_COLORS[a.approvalStatus]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-stone-800">{a.collegeName}</p>
                <span className="text-xs text-stone-400">{a.shortlistCount} shortlisted</span>
              </div>
              <p className="text-xs text-stone-500">{a.tpoName}</p>
              {a.eligibilityFlags.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {a.eligibilityFlags.map((f, i) => (
                    <p key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-0.5">⚠ {f}</p>
                  ))}
                </div>
              )}
              {a.tpoNotes && <p className="text-xs text-green-700 mt-1 italic">"{a.tpoNotes}"</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DrivesPage() {
  const { data: drives = [], isLoading } = useDrives();
  const [expandedDrive, setExpandedDrive] = useState<string | null>(null);

  const stats = {
    total: drives.length,
    confirmed: drives.filter(d => d.status === "CONFIRMED" || d.status === "ACTIVE").length,
    totalEligible: drives.reduce((s, d) => s + d.totalEligible, 0),
    estimatedHires: drives.reduce((s, d) => s + d.estimatedHires, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Campus Drives</h1>
          <p className="text-stone-500 mt-1">Plan and track multi-college placement drives</p>
        </div>
        <Link href="/recruiter/drives/new">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Plan Drive</Button>
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Drives", value: stats.total, icon: Calendar },
          { label: "Active / Confirmed", value: stats.confirmed, icon: CheckCircle },
          { label: "Eligible Students", value: stats.totalEligible.toLocaleString(), icon: Users },
          { label: "Est. Hires", value: stats.estimatedHires, icon: TrendingUp },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="h-3.5 w-3.5 text-stone-400" />
                <p className="text-xs text-stone-500">{s.label}</p>
              </div>
              <p className="text-2xl font-bold text-stone-900">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drive list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
      ) : drives.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-8 w-8 mx-auto text-stone-300 mb-3" />
            <p className="text-stone-500">No drives planned yet.</p>
            <Link href="/recruiter/drives/new">
              <Button variant="outline" className="mt-4 gap-2"><Plus className="h-4 w-4" /> Plan your first drive</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {drives.map(drive => (
            <Card key={drive.id} className="overflow-hidden">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-stone-900">{drive.jobTitle}</h3>
                      <Badge className={`text-xs ${TIER_COLORS[drive.driveTier]}`}>{drive.driveTier.replace("_", " ")}</Badge>
                      <Badge className={`text-xs ${STATUS_COLORS[drive.status]}`}>{drive.status}</Badge>
                    </div>

                    {/* Colleges */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {drive.targetColleges.map(c => (
                        <div key={c.collegeId} className="flex items-center gap-1.5 px-2 py-1 rounded bg-stone-50 border border-stone-100">
                          <Building2 className="h-3 w-3 text-stone-400" />
                          <span className="text-xs font-medium text-stone-700">{c.collegeName}</span>
                          <span className="text-xs text-stone-400">{c.eligibleStudentCount} eligible</span>
                          {c.slotConfirmed
                            ? <CheckCircle className="h-3 w-3 text-green-500" />
                            : <Clock className="h-3 w-3 text-amber-400" />
                          }
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    {drive.driveDate && (
                      <p className="text-xs text-stone-500">{new Date(drive.driveDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    )}
                    <p className="text-sm font-medium text-stone-700">{drive.totalEligible} eligible</p>
                    <p className="text-xs text-stone-400">est. {drive.estimatedHires} hires · ₹{(drive.estimatedCostPerHire / 1000).toFixed(0)}K/hire</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                  <button
                    onClick={() => setExpandedDrive(expandedDrive === drive.id ? null : drive.id)}
                    className="text-xs text-amber-700 hover:underline"
                  >
                    {expandedDrive === drive.id ? "Hide" : "Show"} TPO Approval Status
                  </button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs">View Details</Button>
                    {drive.status === "DRAFT" && (
                      <Button size="sm" className="text-xs">Confirm Drive</Button>
                    )}
                  </div>
                </div>

                {expandedDrive === drive.id && <TpoApprovalPanel driveId={drive.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
