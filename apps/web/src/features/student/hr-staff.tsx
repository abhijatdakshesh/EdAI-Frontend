"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api/client";

const HR_CONTACTS = [
  { name: "Ms. Anitha Rao", role: "Student Welfare Officer", email: "anitha.rao@rvce.edu", phone: "+91 80 6717 8990", dept: "Admin" },
  { name: "Mr. Prakash Nair", role: "Academic Coordinator", email: "prakash.nair@rvce.edu", phone: "+91 80 6717 8991", dept: "Academic" },
  { name: "Ms. Sushma Kumari", role: "Placement Coordinator", email: "sushma.k@rvce.edu", phone: "+91 80 6717 8992", dept: "Placement" },
  { name: "Dr. Vidya Krishnan", role: "Examination Cell Head", email: "vidya.k@rvce.edu", phone: "+91 80 6717 8993", dept: "Exam" },
  { name: "Mr. Arun Kumar", role: "Hostel Superintendent", email: "arun.k@rvce.edu", phone: "+91 80 6717 8994", dept: "Hostel" },
];

const SERVICES = [
  { title: "Bonafide Certificate", desc: "Request official bonafide certificate for banking, visa, etc.", days: "3 working days", type: "BONAFIDE" },
  { title: "Transfer Certificate", desc: "Apply for TC when discontinuing or transferring.", days: "7 working days", type: "TC" },
  { title: "Character Certificate", desc: "Character certificate for employment/higher studies.", days: "5 working days", type: "CHARACTER" },
  { title: "Fee Receipt Duplicate", desc: "Request duplicate fee payment receipt.", days: "1 working day", type: "FEE_RECEIPT" },
  { title: "NOC for Internship", desc: "No-objection certificate for off-campus internship.", days: "2 working days", type: "NOC" },
  { title: "Scholarship Verification", desc: "Document verification for scholarship applications.", days: "3 working days", type: "SCHOLARSHIP" },
];

export function HRStaff() {
  const [requestMsg, setRequestMsg] = useState<Record<string, string>>({});
  const [grievance, setGrievance] = useState("");
  const [grievanceMsg, setGrievanceMsg] = useState<string | null>(null);
  const [showGrievanceForm, setShowGrievanceForm] = useState(false);

  async function handleRequest(type: string) {
    setRequestMsg((m) => ({ ...m, [type]: "Submitting…" }));
    try {
      await apiPost(`/api/hr/service-requests`, { type });
      setRequestMsg((m) => ({ ...m, [type]: "Requested! You will receive an email confirmation." }));
    } catch {
      setRequestMsg((m) => ({ ...m, [type]: "Failed. Please try again." }));
    }
  }

  async function handleGrievance() {
    if (!grievance.trim()) return;
    setGrievanceMsg(null);
    try {
      await apiPost("/api/hr/grievances", { description: grievance.trim() });
      setGrievanceMsg("Grievance submitted. You will hear back within 3 working days.");
      setGrievance("");
      setShowGrievanceForm(false);
    } catch {
      setGrievanceMsg("Submission failed. Please try again.");
    }
  }

  return (
    <AppShell title="HR & Staff">
      <div className="grid gap-6">
        {/* Key contacts */}
        <div>
          <p className="label-track mb-3">Key Contacts</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HR_CONTACTS.map((c) => (
              <div key={c.email} className="rounded border border-border bg-surface p-4">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-text-muted">{c.role}</p>
                <p className="text-xs mt-2">{c.email}</p>
                <p className="text-xs text-text-muted">{c.phone}</p>
                <div className="mt-3 flex gap-2">
                  <a href={`mailto:${c.email}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full text-xs" aria-label={`Email ${c.name}`}>
                      Email
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Self-service */}
        <div>
          <p className="label-track mb-3">Student Services</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SERVICES.map((s) => (
              <div key={s.title} className="rounded border border-border bg-surface p-4">
                <div>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{s.desc}</p>
                  <p className="text-xs text-text-muted mt-1">⏱ {s.days}</p>
                  {requestMsg[s.type] && (
                    <p className={`text-xs mt-1 ${(requestMsg[s.type] ?? "").includes("Requested") ? "text-[#3D6B4F]" : "text-[#8B2F2F]"}`}>
                      {requestMsg[s.type]}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline" className="mt-2"
                  onClick={() => void handleRequest(s.type)}
                  disabled={requestMsg[s.type]?.includes("Requested") ?? false}>
                  Request
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Grievance */}
        <div className="rounded border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Raise a Grievance</p>
              <p className="text-xs text-text-muted">Academic, hostel, or administrative issues</p>
            </div>
            <Button size="sm" onClick={() => setShowGrievanceForm((v) => !v)}>
              {showGrievanceForm ? "Cancel" : "New Grievance"}
            </Button>
          </div>
          {showGrievanceForm && (
            <div className="mt-4 grid gap-2">
              <textarea
                value={grievance}
                onChange={(e) => setGrievance(e.target.value)}
                rows={3}
                placeholder="Describe your issue in detail…"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                aria-label="Grievance description"
              />
              <Button size="sm" onClick={() => void handleGrievance()} disabled={!grievance.trim()}>
                Submit
              </Button>
            </div>
          )}
          {grievanceMsg && (
            <p className={`text-xs mt-2 ${grievanceMsg.includes("submitted") ? "text-[#3D6B4F]" : "text-[#8B2F2F]"}`}>
              {grievanceMsg}
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
