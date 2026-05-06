"use client";

import { useState } from "react";
import { Building2, CheckCircle, Clock, AlertCircle, MessageSquare, Shield, TrendingUp, Users, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDrives, useTpoApprovals, useCollegePlacementPolicy, type TpoApprovalStatus } from "@/lib/api/recruiter";

const STATUS_CONFIG: Record<TpoApprovalStatus, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "Awaiting TPO", color: "bg-amber-100 text-amber-700", icon: Clock },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700", icon: AlertCircle },
  NEEDS_INFO: { label: "Needs Info", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
};

function PolicyCard({ collegeId }: { collegeId: string }) {
  const { data: policy, isLoading } = useCollegePlacementPolicy(collegeId);
  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-stone-400" /></div>;
  if (!policy) return null;
  return (
    <div className="mt-3 bg-stone-50 border border-stone-100 rounded-lg p-3 space-y-2">
      <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Placement Policy — {policy.collegeName}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {[
          { label: "Pool CTC cap", value: `₹${policy.poolCTCCap} LPA` },
          { label: "Dream CTC min", value: `₹${policy.dreamCTCMin} LPA` },
          { label: "Super Dream min", value: `₹${policy.superDreamCTCMin} LPA` },
          { label: "Max backlogs", value: policy.maxBacklogsAllowed },
          { label: "Active backlogs", value: policy.activeBacklogsAllowed ? "Allowed" : "Not allowed" },
          { label: "One-offer rule", value: policy.oneOfferPerStudent ? "Yes — enforced" : "No" },
        ].map(r => (
          <div key={r.label} className="text-xs">
            <span className="text-stone-400">{r.label}: </span>
            <span className="font-medium text-stone-700">{r.value}</span>
          </div>
        ))}
      </div>
      {policy.tierLockingEnabled && (
        <div className="flex items-start gap-1.5 text-xs text-blue-700 bg-blue-50 rounded px-2 py-1.5">
          <Shield className="h-3 w-3 shrink-0 mt-0.5" />
          Tier locking enabled — students who accept a Pool offer are automatically excluded from Dream and Super Dream drives.
        </div>
      )}
    </div>
  );
}

function DriveApprovalView({ driveId, jobTitle }: { driveId: string; jobTitle: string }) {
  const { data: approvals = [], isLoading } = useTpoApprovals(driveId);
  const [showPolicy, setShowPolicy] = useState<string | null>(null);

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-stone-400" /></div>;

  return (
    <div className="space-y-3">
      {approvals.map(a => {
        const cfg = STATUS_CONFIG[a.approvalStatus];
        const Icon = cfg.icon;
        return (
          <div key={a.collegeId} className="border border-stone-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Building2 className="h-4 w-4 text-stone-400" />
                  <p className="font-medium text-stone-900">{a.collegeName}</p>
                  <Badge className={`text-xs ${cfg.color}`}>
                    <Icon className="h-3 w-3 mr-1" />
                    {cfg.label}
                  </Badge>
                </div>
                <p className="text-sm text-stone-500 mt-0.5">TPO: {a.tpoName} · {a.shortlistCount} students shortlisted</p>
                <p className="text-xs text-stone-400">Updated {new Date(a.updatedAt).toLocaleDateString("en-IN")}</p>

                {/* Eligibility flags */}
                {a.eligibilityFlags.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {a.eligibilityFlags.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                        <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                        {f}
                      </div>
                    ))}
                  </div>
                )}

                {/* TPO notes */}
                {a.tpoNotes && (
                  <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1 mt-2 italic">
                    "{a.tpoNotes}"
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm" variant="outline"
                  className="text-xs gap-1"
                  onClick={() => setShowPolicy(showPolicy === a.collegeId ? null : a.collegeId)}
                >
                  <Info className="h-3 w-3" /> Policy
                </Button>
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <MessageSquare className="h-3 w-3" /> Message TPO
                </Button>
              </div>
            </div>

            {showPolicy === a.collegeId && <PolicyCard collegeId={a.collegeId} />}
          </div>
        );
      })}
    </div>
  );
}

export default function TpoPage() {
  const { data: drives = [], isLoading } = useDrives();
  const [selectedDrive, setSelectedDrive] = useState<string>("");

  const drivesWithApprovals = drives.filter(d => d.status !== "DRAFT");
  const selectedDriveObj = drives.find(d => d.id === selectedDrive);

  const totalPending = 1; // from mock — would come from real data
  const totalApproved = 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">TPO Collaboration</h1>
        <p className="text-stone-500 mt-1">Two-way sync with college placement offices. Offers cannot be released until TPO co-approval is complete.</p>
      </div>

      {/* Compliance callout */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex gap-3">
        <Shield className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">TPO Co-Approval Required Before Every Offer</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Per VTU / autonomous college placement policy, the TPO must verify each student's eligibility (CGPA, backlog status, tier locks) before any offer letter is generated. Ed8AI enforces this automatically — no offer can be created without TPO approval status = APPROVED.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Drives Pending TPO", value: totalPending, color: "text-amber-600", icon: Clock },
          { label: "Drives Approved", value: totalApproved, color: "text-green-600", icon: CheckCircle },
          { label: "Active College TPOs", value: drivesWithApprovals.length > 0 ? 2 : 0, color: "text-stone-700", icon: Users },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                <p className="text-xs text-stone-500">{s.label}</p>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drive selector */}
      <Card>
        <CardHeader><CardTitle className="text-base">Drive Approval Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-stone-400" /></div>
          ) : drivesWithApprovals.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-8">No drives in progress. <a href="/recruiter/drives/new" className="text-amber-700 underline">Plan a drive</a> to begin.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {drivesWithApprovals.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDrive(d.id)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedDrive === d.id ? "border-amber-500 bg-amber-50 text-amber-700" : "border-stone-200 text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    {d.jobTitle}
                    <span className="ml-2 text-xs text-stone-400">{d.driveTier.replace("_", " ")}</span>
                  </button>
                ))}
              </div>

              {selectedDrive ? (
                <DriveApprovalView driveId={selectedDrive} jobTitle={selectedDriveObj?.jobTitle ?? ""} />
              ) : (
                <p className="text-stone-400 text-sm text-center py-4">Select a drive to view TPO approval status.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
