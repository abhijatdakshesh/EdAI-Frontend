"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { useMyChildren } from "@/lib/api/parent";
import { useStudentHostel } from "@/lib/api/hostel";
import { useStudentTransport } from "@/lib/api/transport";

/**
 * Parent view of a child's hostel allocation + live bus tracking. Read-only —
 * complaint/leave actions stay on the student portal.
 */
export function ParentHostel() {
  const { data: children = [] } = useMyChildren();
  const [selected, setSelected] = useState<string | null>(null);
  const usn = selected ?? children[0]?.usn ?? "";

  const { data: hostel } = useStudentHostel(usn);
  const { data: transport } = useStudentTransport(usn);

  return (
    <AppShell title="Hostel & Transport">
      {children.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {children.map((c) => (
            <button
              key={c.usn}
              onClick={() => setSelected(c.usn)}
              className={`rounded px-3 py-1.5 text-sm ${
                usn === c.usn ? "bg-[#3D6B4F] text-white" : "bg-cream-100 hover:bg-border"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Hostel */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track">Hostel Details</p>
          {hostel ? (
            <div className="mt-3 grid gap-3">
              <div className="rounded bg-cream-100 p-3">
                <p className="text-xs text-text-muted">Block · Room</p>
                <p className="font-medium">{hostel.block} · {hostel.roomNumber}</p>
              </div>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between border-b border-border pb-1">
                  <dt className="text-text-muted">Warden</dt>
                  <dd className="font-medium">{hostel.warden ?? "—"}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <dt className="text-text-muted">Warden Contact</dt>
                  <dd className="font-medium">{hostel.wardenPhone ?? "—"}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <dt className="text-text-muted">Mess</dt>
                  <dd className="font-medium">{hostel.messType}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-3 text-sm text-text-muted">No hostel allocation.</p>
          )}
        </div>

        {/* Transport with live ETA */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track">Transport & Live Tracking</p>
          {transport ? (
            <div className="mt-3 grid gap-3">
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
                <div className="flex justify-between border-b border-border pb-1">
                  <dt className="text-text-muted">Boarding Stop</dt>
                  <dd className="font-medium">{transport.stopName ?? "—"}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <dt className="text-text-muted">Pickup Time</dt>
                  <dd className="font-medium">{transport.pickupTime ?? "—"}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <dt className="text-text-muted">Driver</dt>
                  <dd className="font-medium">{transport.driverName ?? "—"} · {transport.driverPhone ?? "—"}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-3 text-sm text-text-muted">No transport allocation.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
