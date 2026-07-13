"use client";

import { Button } from "@/components/ui/button";
import {
  useComplaints, useResolveComplaint,
  useLeaveRequests, useDecideLeave, useOccupancy,
} from "@/lib/api/hostel";

export default function HostelManagement() {
  const { data: complaints = [] } = useComplaints("OPEN");
  const { data: leave = [] } = useLeaveRequests("PENDING");
  const { data: occupancy = [] } = useOccupancy();
  const resolve = useResolveComplaint();
  const decide = useDecideLeave();

  return (
    <div className="grid gap-5">
      {/* Occupancy */}
      <section className="rounded border border-border bg-surface p-5">
        <p className="label-track mb-3">Block Occupancy</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {occupancy.map((o) => {
            const pct = o.capacity ? Math.round((o.occupied / o.capacity) * 100) : 0;
            return (
              <div key={o.block} className="rounded bg-cream-100 p-3">
                <p className="text-xs text-text-muted">{o.block} · {o.type}</p>
                <p className="font-medium">{o.occupied} / {o.capacity}</p>
                <div className="mt-1 h-1.5 w-full rounded bg-border">
                  <div className="h-1.5 rounded bg-[#3D6B4F]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {occupancy.length === 0 && <p className="text-sm text-text-muted">No blocks configured.</p>}
        </div>
      </section>

      {/* Complaints triage */}
      <section className="rounded border border-border bg-surface p-5">
        <p className="label-track mb-3">Open Complaints ({complaints.length})</p>
        <div className="grid gap-2">
          {complaints.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded bg-cream-100 p-3 text-sm">
              <div>
                <p className="font-medium">{c.studentUsn} · {c.category}</p>
                <p className="text-text-muted">{c.description}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={resolve.isPending}
                onClick={() => resolve.mutate(c.id)}
              >
                Resolve
              </Button>
            </div>
          ))}
          {complaints.length === 0 && <p className="text-sm text-text-muted">No open complaints.</p>}
        </div>
      </section>

      {/* Leave approvals */}
      <section className="rounded border border-border bg-surface p-5">
        <p className="label-track mb-3">Pending Leave Requests ({leave.length})</p>
        <div className="grid gap-2">
          {leave.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 rounded bg-cream-100 p-3 text-sm">
              <div>
                <p className="font-medium">{l.studentUsn}</p>
                <p className="text-text-muted">{l.fromDate} → {l.toDate} · {l.reason}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: l.id, approve: true })}>
                  Approve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => decide.mutate({ id: l.id, approve: false })}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
          {leave.length === 0 && <p className="text-sm text-text-muted">No pending requests.</p>}
        </div>
      </section>
    </div>
  );
}
