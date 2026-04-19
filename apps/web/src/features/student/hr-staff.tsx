"use client";

import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";

const HR_CONTACTS = [
  { name: "Ms. Anitha Rao", role: "Student Welfare Officer", email: "anitha.rao@rvce.edu", phone: "+91 80 6717 8990", dept: "Admin" },
  { name: "Mr. Prakash Nair", role: "Academic Coordinator", email: "prakash.nair@rvce.edu", phone: "+91 80 6717 8991", dept: "Academic" },
  { name: "Ms. Sushma Kumari", role: "Placement Coordinator", email: "sushma.k@rvce.edu", phone: "+91 80 6717 8992", dept: "Placement" },
  { name: "Dr. Vidya Krishnan", role: "Examination Cell Head", email: "vidya.k@rvce.edu", phone: "+91 80 6717 8993", dept: "Exam" },
  { name: "Mr. Arun Kumar", role: "Hostel Superintendent", email: "arun.k@rvce.edu", phone: "+91 80 6717 8994", dept: "Hostel" },
];

const SERVICES = [
  { title: "Bonafide Certificate", desc: "Request official bonafide certificate for banking, visa, etc.", days: "3 working days" },
  { title: "Transfer Certificate", desc: "Apply for TC when discontinuing or transferring.", days: "7 working days" },
  { title: "Character Certificate", desc: "Character certificate for employment/higher studies.", days: "5 working days" },
  { title: "Fee Receipt Duplicate", desc: "Request duplicate fee payment receipt.", days: "1 working day" },
  { title: "NOC for Internship", desc: "No-objection certificate for off-campus internship.", days: "2 working days" },
  { title: "Scholarship Verification", desc: "Document verification for scholarship applications.", days: "3 working days" },
];

export function HRStaff() {
  return (
    <AppShell title="HR & Staff">
      <div className="grid gap-6">
        {/* Key contacts */}
        <div>
          <p className="label-track mb-3">Key Contacts</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HR_CONTACTS.map(c=>(
              <div key={c.email} className="rounded border border-border bg-surface p-4">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-text-muted">{c.role}</p>
                <p className="text-xs mt-2">{c.email}</p>
                <p className="text-xs text-text-muted">{c.phone}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs">Email</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Self-service */}
        <div>
          <p className="label-track mb-3">Student Services</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SERVICES.map(s=>(
              <div key={s.title} className="rounded border border-border bg-surface p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{s.desc}</p>
                  <p className="text-xs text-text-muted mt-1">⏱ {s.days}</p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0">Request</Button>
              </div>
            ))}
          </div>
        </div>

        {/* Grievance shortcut */}
        <div className="rounded border border-border bg-surface p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Raise a Grievance</p>
            <p className="text-xs text-text-muted">Academic, hostel, or administrative issues</p>
          </div>
          <Button size="sm">New Grievance</Button>
        </div>
      </div>
    </AppShell>
  );
}
