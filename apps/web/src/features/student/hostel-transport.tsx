"use client";

import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";

export function HostelTransport() {
  return (
    <AppShell title="Hostel & Transport">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Hostel */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track">Hostel Details</p>
          <div className="mt-3 grid gap-3">
            <div className="rounded bg-cream-100 p-3">
              <p className="text-xs text-text-muted">Hostel Block</p>
              <p className="font-medium">Block B — Boys Hostel</p>
            </div>
            <dl className="grid gap-2 text-sm">
              {[
                ["Room Number","B-214"],["Bed Number","2"],
                ["Floor","2nd Floor"],["Warden","Mr. Suresh Kumar"],
                ["Warden Contact","+91 98765 43210"],
                ["Mess Type","Vegetarian (South Indian)"],
                ["Fees Status","Paid — ₹45,000 / year"],
              ].map(([k,v])=>(
                <div key={k} className="flex justify-between border-b border-border pb-1 last:border-0">
                  <dt className="text-text-muted">{k}</dt><dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" className="flex-1">Raise Complaint</Button>
              <Button size="sm" variant="outline" className="flex-1">Leave Request</Button>
            </div>
          </div>
        </div>

        {/* Transport */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track">Transport Details</p>
          <div className="mt-3 grid gap-3">
            <div className="rounded bg-cream-100 p-3">
              <p className="text-xs text-text-muted">Bus Route</p>
              <p className="font-medium">Route 7 — Jayanagar → RVITM</p>
            </div>
            <dl className="grid gap-2 text-sm">
              {[
                ["Bus Number","KA-09-F-1234"],["Driver","Mr. Rajesh"],
                ["Driver Contact","+91 99887 76655"],
                ["Morning Pickup","7:45 AM — Jayanagar 4th Block"],
                ["Evening Drop","5:30 PM — Jayanagar 4th Block"],
                ["Transport Fees","₹18,000 / year — Paid"],
              ].map(([k,v])=>(
                <div key={k} className="flex justify-between border-b border-border pb-1 last:border-0">
                  <dt className="text-text-muted">{k}</dt><dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <Button size="sm" variant="outline">Track Bus</Button>
          </div>
        </div>

        {/* Notices */}
        <div className="lg:col-span-2">
          <p className="label-track mb-2">Hostel & Transport Notices</p>
          <div className="grid gap-2">
            {[
              { title: "Mess menu change — effective Jan 15", date: "Jan 10, 2025" },
              { title: "Route 7 bus time change — pickup now 7:30 AM", date: "Jan 8, 2025" },
              { title: "Hostel visitor policy updated", date: "Jan 5, 2025" },
            ].map((n,i)=>(
              <div key={i} className="rounded border border-border bg-surface p-3 flex justify-between items-center">
                <p className="text-sm">{n.title}</p>
                <p className="text-xs text-text-muted">{n.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
