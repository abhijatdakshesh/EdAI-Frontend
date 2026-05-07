"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/use-auth";
import { apiPatch } from "@/lib/api/client";

export function StudentProfile() {
  const { session } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    usn: "",
    email: "",
    phone: "",
    dob: "",
    blood: "",
    address: "",
    parent: "",
    parentPhone: "",
    parentEmail: "",
    department: "",
    batch: "",
    section: "",
    semester: "",
    cgpa: "",
    prefLang: "",
  });

  // Depend on scalar fields, not the whole session object (which gets a new
  // reference on every next-auth poll and would re-fire this effect forever).
  const sessionName = session?.user?.name ?? null;
  const sessionUsn = session?.user?.id ?? null;
  const sessionEmail = session?.user?.email ?? null;
  useEffect(() => {
    if (!sessionUsn && !sessionEmail) return;
    setProfile((p) => ({
      ...p,
      name: sessionName ?? p.name,
      usn: sessionUsn ?? p.usn,
      email: sessionEmail ?? p.email,
    }));
  }, [sessionName, sessionUsn, sessionEmail]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiPatch(`/api/students/${profile.usn}/profile`, {
        phone: profile.phone,
        dob: profile.dob,
        address: profile.address,
        parentPhone: profile.parentPhone,
        parentEmail: profile.parentEmail,
        preferredLanguage: profile.prefLang,
      });
      setEditing(false);
      setSaveMsg("Profile saved successfully.");
    } catch {
      setSaveMsg("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Profile">
      <div className="grid gap-5 max-w-3xl">
        {/* Avatar + basic */}
        <div className="rounded border border-border bg-surface p-5 flex items-start gap-5">
          <div className="h-16 w-16 rounded-full bg-[#1C1810] flex items-center justify-center text-2xl text-[#F2EFE9] shrink-0">
            {profile.name.charAt(0) || "?"}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-medium">{profile.name || "—"}</h3>
            <p className="text-sm text-text-muted">{profile.usn}</p>
            <p className="text-sm text-text-muted">{profile.department || "—"} · {profile.batch || "—"}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.semester && <span className="rounded bg-cream-100 px-2 py-0.5 text-xs">Sem {profile.semester}</span>}
              {profile.section && <span className="rounded bg-cream-100 px-2 py-0.5 text-xs">{profile.section}</span>}
              {profile.cgpa && <span className="rounded bg-cream-100 px-2 py-0.5 text-xs">CGPA {profile.cgpa}</span>}
              {profile.blood && <span className="rounded bg-cream-100 px-2 py-0.5 text-xs">Blood: {profile.blood}</span>}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => editing ? void handleSave() : setEditing(true)} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save" : "Edit"}
          </Button>
        </div>

        {saveMsg && (
          <p className={`text-sm text-center ${saveMsg.includes("success") ? "text-[#3D6B4F]" : "text-[#8B2F2F]"}`}>
            {saveMsg}
          </p>
        )}

        {/* Contact info */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">Contact Information</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { label: "Email", key: "email" as const, readOnly: true },
              { label: "Phone", key: "phone" as const },
              { label: "Date of Birth", key: "dob" as const },
              { label: "Preferred Language", key: "prefLang" as const },
            ] as { label: string; key: keyof typeof profile; readOnly?: boolean }[]).map((f) => (
              <div key={f.key}>
                <p className="text-xs text-text-muted mb-1">{f.label}</p>
                {editing && !f.readOnly ? (
                  <input value={profile[f.key]} onChange={(e) => setProfile((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none" />
                ) : (
                  <p className="text-sm font-medium">{profile[f.key] || "—"}</p>
                )}
              </div>
            ))}
          </div>
          {editing ? (
            <div className="mt-3">
              <p className="text-xs text-text-muted mb-1">Address</p>
              <textarea value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} rows={2}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-xs text-text-muted">Address</p>
              <p className="text-sm font-medium">{profile.address || "—"}</p>
            </div>
          )}
        </div>

        {/* Parent info */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">Parent / Guardian</p>
          <dl className="grid gap-2 sm:grid-cols-3 text-sm">
            {([["Name", "parent"], ["Phone", "parentPhone"], ["Email", "parentEmail"]] as [string, keyof typeof profile][]).map(([k, key]) => (
              <div key={k}>
                <dt className="text-xs text-text-muted">{k}</dt>
                {editing ? (
                  <input value={profile[key]} onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none mt-1" />
                ) : (
                  <dd className="font-medium">{profile[key] || "—"}</dd>
                )}
              </div>
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
