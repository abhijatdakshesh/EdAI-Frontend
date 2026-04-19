"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";

export function StudentProfile() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "Arjun Nair",
    usn: "1RVCE22CS089",
    email: "arjun.nair@rvce.edu",
    phone: "+91 98765 43210",
    dob: "2004-03-15",
    blood: "O+",
    address: "14, 4th Cross, Jayanagar, Bengaluru — 560041",
    parent: "Suresh Nair",
    parentPhone: "+91 99887 76655",
    parentEmail: "suresh.nair@gmail.com",
    department: "Computer Science & Engineering",
    batch: "2022–2026",
    section: "CSE 6A",
    semester: "VI",
    cgpa: "8.42",
    prefLang: "Kannada",
  });

  return (
    <AppShell title="Profile">
      <div className="grid gap-5 max-w-3xl">
        {/* Avatar + basic */}
        <div className="rounded border border-border bg-surface p-5 flex items-start gap-5">
          <div className="h-16 w-16 rounded-full bg-[#1C1810] flex items-center justify-center text-2xl text-[#F2EFE9] shrink-0">
            {profile.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-medium">{profile.name}</h3>
            <p className="text-sm text-text-muted">{profile.usn}</p>
            <p className="text-sm text-text-muted">{profile.department} · {profile.batch}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="rounded bg-cream-100 px-2 py-0.5 text-xs">Sem {profile.semester}</span>
              <span className="rounded bg-cream-100 px-2 py-0.5 text-xs">{profile.section}</span>
              <span className="rounded bg-cream-100 px-2 py-0.5 text-xs">CGPA {profile.cgpa}</span>
              <span className="rounded bg-cream-100 px-2 py-0.5 text-xs">Blood: {profile.blood}</span>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={()=>setEditing(!editing)}>
            {editing ? "Save" : "Edit"}
          </Button>
        </div>

        {/* Contact info */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">Contact Information</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Email", key: "email" as const },
              { label: "Phone", key: "phone" as const },
              { label: "Date of Birth", key: "dob" as const },
              { label: "Preferred Language", key: "prefLang" as const },
            ].map(f=>(
              <div key={f.key}>
                <p className="text-xs text-text-muted mb-1">{f.label}</p>
                {editing ? (
                  <input value={profile[f.key]} onChange={e=>setProfile(p=>({...p,[f.key]:e.target.value}))}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none" />
                ) : (
                  <p className="text-sm font-medium">{profile[f.key]}</p>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <div className="mt-3">
              <p className="text-xs text-text-muted mb-1">Address</p>
              <textarea value={profile.address} onChange={e=>setProfile(p=>({...p,address:e.target.value}))} rows={2}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
            </div>
          )}
          {!editing && (
            <div className="mt-3">
              <p className="text-xs text-text-muted">Address</p>
              <p className="text-sm font-medium">{profile.address}</p>
            </div>
          )}
        </div>

        {/* Parent info */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">Parent / Guardian</p>
          <dl className="grid gap-2 sm:grid-cols-3 text-sm">
            {[["Name", profile.parent], ["Phone", profile.parentPhone], ["Email", profile.parentEmail]].map(([k,v])=>(
              <div key={k}><dt className="text-xs text-text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        </div>

        {/* Account */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-3">Account</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline">Change Password</Button>
            <Button size="sm" variant="outline">Download ID Card</Button>
            <Button size="sm" variant="outline">Download Transcripts</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
