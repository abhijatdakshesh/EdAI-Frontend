"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/use-auth";
import { useStudentHostel, useRaiseComplaint, useRequestLeave } from "@/lib/api/hostel";
import { useStudentTransport } from "@/lib/api/transport";

export function HostelTransport() {
  const { session } = useAuth();
  const usn = session?.user?.id ?? "";
  const [complaintMsg, setComplaintMsg] = useState<string | null>(null);
  const [leaveMsg, setLeaveMsg] = useState<string | null>(null);

  const { data: hostel } = useStudentHostel(usn);
  const { data: transport } = useStudentTransport(usn);
  const raiseComplaint = useRaiseComplaint(usn);
  const requestLeave = useRequestLeave(usn);

  async function handleComplaint() {
    const description = window.prompt("Describe the issue (e.g. water leakage in bathroom):");
    if (!description) return;
    try {
      await raiseComplaint.mutateAsync({ category: "GENERAL", description });
      setComplaintMsg("Complaint raised. Warden will contact you within 24 hours.");
    } catch {
      setComplaintMsg("Failed to raise complaint. Please try again.");
    }
  }

  async function handleLeaveRequest() {
    const fromDate = window.prompt("Leave from (YYYY-MM-DD):");
    const toDate = fromDate ? window.prompt("Leave to (YYYY-MM-DD):") : null;
    const reason = toDate ? window.prompt("Reason:") : null;
    if (!fromDate || !toDate || !reason) return;
    try {
      await requestLeave.mutateAsync({ fromDate, toDate, reason });
      setLeaveMsg("Leave request submitted for warden approval.");
    } catch {
      setLeaveMsg("Failed to submit leave request.");
    }
  }

  const hostelRows = hostel
    ? [
        ["Room Number", hostel.roomNumber],
        ["Bed Number", String(hostel.bedNo)],
        ["Floor", String(hostel.floor)],
        ["Warden", hostel.warden ?? "—"],
        ["Warden Contact", hostel.wardenPhone ?? "—"],
        ["Mess Type", hostel.messType],
        ["Status", hostel.status],
      ]
    : [];

  const transportRows = transport
    ? [
        ["Bus Number", transport.vehicleNo ?? "—"],
        ["Driver", transport.driverName ?? "—"],
        ["Driver Contact", transport.driverPhone ?? "—"],
        ["Boarding Stop", transport.stopName ?? "—"],
        ["Pickup Time", transport.pickupTime ?? "—"],
        ["Pass", transport.passStatus],
        ["Transport Fees", transport.feeStatus],
      ]
    : [];

  return (
    <AppShell title="Hostel & Transport">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Hostel */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track">Hostel Details</p>
          <div className="mt-3 grid gap-3">
            {hostel ? (
              <>
                <div className="rounded bg-cream-100 p-3">
                  <p className="text-xs text-text-muted">Hostel Block</p>
                  <p className="font-medium">{hostel.block}</p>
                </div>
                <dl className="grid gap-2 text-sm">
                  {hostelRows.map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-border pb-1 last:border-0">
                      <dt className="text-text-muted">{k}</dt><dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                {hostel.messMenu.length > 0 && (
                  <div className="rounded bg-cream-100 p-3">
                    <p className="text-xs text-text-muted mb-1">This Week&apos;s Mess Menu</p>
                    <ul className="text-xs grid gap-1">
                      {hostel.messMenu.map((m) => (
                        <li key={m.day} className="flex justify-between gap-2">
                          <span className="font-medium">{m.day}</span>
                          <span className="text-text-muted text-right">
                            {[m.breakfast, m.lunch, m.dinner].filter(Boolean).join(" · ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-text-muted">No hostel allocation found.</p>
            )}
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => void handleComplaint()}>
                Raise Complaint
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => void handleLeaveRequest()}>
                Leave Request
              </Button>
            </div>
            {complaintMsg && <p className="text-xs text-[#3D6B4F]">{complaintMsg}</p>}
            {leaveMsg && <p className="text-xs text-[#3D6B4F]">{leaveMsg}</p>}
          </div>
        </div>

        {/* Transport */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track">Transport Details</p>
          <div className="mt-3 grid gap-3">
            {transport ? (
              <>
                {/* Live tracking banner */}
                <div className="rounded bg-cream-100 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-muted">{transport.routeCode} — {transport.routeName}</p>
                    <p className="font-medium">
                      {transport.live
                        ? transport.etaMinutes != null
                          ? `Arriving in ~${transport.etaMinutes} min`
                          : "On the way"
                        : "Not currently tracking"}
                    </p>
                  </div>
                  {transport.live && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#3D6B4F]">
                      <span className="h-2 w-2 rounded-full bg-[#3D6B4F] animate-pulse" /> LIVE
                    </span>
                  )}
                </div>
                <dl className="grid gap-2 text-sm">
                  {transportRows.map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-border pb-1 last:border-0">
                      <dt className="text-text-muted">{k}</dt><dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className="text-sm text-text-muted">No transport allocation found.</p>
            )}
          </div>
        </div>

        {/* Notices */}
        <div className="lg:col-span-2">
          <p className="label-track mb-2">Hostel &amp; Transport Notices</p>
          <p className="text-sm text-text-muted rounded border border-dashed border-border p-4 text-center">
            No notices at this time.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
