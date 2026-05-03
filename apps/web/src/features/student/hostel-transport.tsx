"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/use-auth";

interface HostelInfo {
  block: string;
  roomNumber: string;
  bedNumber: string;
  floor: string;
  warden: string;
  wardenContact: string;
  messType: string;
  feesStatus: string;
}

interface TransportInfo {
  routeName: string;
  busNumber: string;
  driver: string;
  driverContact: string;
  morningPickup: string;
  eveningDrop: string;
  feesStatus: string;
}

export function HostelTransport() {
  const { session } = useAuth();
  const usn = session?.user?.id ?? "";
  const [complaintMsg, setComplaintMsg] = useState<string | null>(null);
  const [leaveMsg, setLeaveMsg] = useState<string | null>(null);

  const { data: hostel } = useQuery<HostelInfo>({
    queryKey: ["hostel", usn],
    queryFn: () => apiGet<HostelInfo>(`/api/hostel/student/${usn}`),
    enabled: !!usn,
  });

  const { data: transport } = useQuery<TransportInfo>({
    queryKey: ["transport", usn],
    queryFn: () => apiGet<TransportInfo>(`/api/transport/student/${usn}`),
    enabled: !!usn,
  });

  async function handleComplaint() {
    try {
      await apiPost("/api/hostel/complaints", { studentUsn: usn });
      setComplaintMsg("Complaint raised. Warden will contact you within 24 hours.");
    } catch {
      setComplaintMsg("Failed to raise complaint. Please try again.");
    }
  }

  async function handleLeaveRequest() {
    try {
      await apiPost("/api/hostel/leave-requests", { studentUsn: usn });
      setLeaveMsg("Leave request submitted.");
    } catch {
      setLeaveMsg("Failed to submit leave request.");
    }
  }

  const hostelRows = hostel ? [
    ["Room Number", hostel.roomNumber],
    ["Bed Number", hostel.bedNumber],
    ["Floor", hostel.floor],
    ["Warden", hostel.warden],
    ["Warden Contact", hostel.wardenContact],
    ["Mess Type", hostel.messType],
    ["Fees Status", hostel.feesStatus],
  ] : [];

  const transportRows = transport ? [
    ["Bus Number", transport.busNumber],
    ["Driver", transport.driver],
    ["Driver Contact", transport.driverContact],
    ["Morning Pickup", transport.morningPickup],
    ["Evening Drop", transport.eveningDrop],
    ["Transport Fees", transport.feesStatus],
  ] : [];

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
                <div className="rounded bg-cream-100 p-3">
                  <p className="text-xs text-text-muted">Bus Route</p>
                  <p className="font-medium">{transport.routeName}</p>
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
            <Button size="sm" variant="outline" aria-label="Track bus location">
              Track Bus
            </Button>
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
