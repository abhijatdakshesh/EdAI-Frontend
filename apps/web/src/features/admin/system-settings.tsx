"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiPatch } from "@/lib/api/client";

interface SettingField { key: string; label: string; value: string; type: "text" | "select" | "toggle"; options?: string[] }

const SETTINGS_GROUPS: { group: string; fields: SettingField[] }[] = [
  {
    group: "Institution",
    fields: [
      { key: "inst_name", label: "Institution Name", value: "RV Institute of Technology & Management", type: "text" },
      { key: "inst_code", label: "VTU Institution Code", value: "1RV", type: "text" },
      { key: "academic_year", label: "Current Academic Year", value: "2024-25", type: "text" },
      { key: "semester", label: "Current Semester", value: "Even Semester (Jan-Jun 2025)", type: "text" },
    ],
  },
  {
    group: "Attendance",
    fields: [
      { key: "min_attendance", label: "Minimum Attendance %", value: "75", type: "text" },
      { key: "attendance_warn", label: "Warning Threshold %", value: "80", type: "text" },
      { key: "condonation", label: "Condonation Allowed", value: "true", type: "toggle" },
      { key: "auto_alert", label: "Auto-Alert Parents Below Threshold", value: "true", type: "toggle" },
    ],
  },
  {
    group: "AI & Automation",
    fields: [
      { key: "ai_calls", label: "Enable AI Parent Calls", value: "true", type: "toggle" },
      { key: "call_lang", label: "Default Call Language", value: "Kannada", type: "select", options: ["Kannada","English","Hindi","Tamil","Telugu"] },
      { key: "chatbot", label: "Student Chatbot Enabled", value: "true", type: "toggle" },
      { key: "placement_ai", label: "Placement Predictor AI", value: "true", type: "toggle" },
    ],
  },
  {
    group: "Security",
    fields: [
      { key: "mfa", label: "Require MFA for Admin", value: "false", type: "toggle" },
      { key: "session_ttl", label: "Session Timeout (minutes)", value: "60", type: "text" },
      { key: "password_policy", label: "Password Policy", value: "Strong (8+ chars, mixed)", type: "select", options: ["Basic","Strong (8+ chars, mixed)","Very Strong (12+ chars)"] },
    ],
  },
];

export function SystemSettings() {
  const [settings, setSettings] = useState(() => {
    const flat: Record<string, string> = {};
    SETTINGS_GROUPS.forEach(g => g.fields.forEach(f => { flat[f.key] = f.value; }));
    return flat;
  });

  const saveMutation = useMutation({
    mutationFn: () => apiPatch<void>("/api/admin/settings", settings),
  });

  return (
    <AppShell title="System Settings">
      <div className="grid gap-6 max-w-3xl">
        {SETTINGS_GROUPS.map(group=>(
          <div key={group.group} className="rounded border border-border bg-surface p-5">
            <p className="label-track mb-4">{group.group}</p>
            <div className="grid gap-4">
              {group.fields.map(f=>(
                <div key={f.key} className="flex items-center justify-between gap-4">
                  <label htmlFor={f.key} className="text-sm font-medium min-w-[240px]">{f.label}</label>
                  {f.type === "toggle" ? (
                    <button
                      onClick={()=>setSettings(s=>({...s,[f.key]: s[f.key]==="true"?"false":"true"}))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[f.key]==="true" ? "bg-[#1C1810]" : "bg-border"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[f.key]==="true" ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  ) : f.type === "select" ? (
                    <select value={settings[f.key]} onChange={e=>setSettings(s=>({...s,[f.key]:e.target.value}))}
                      className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none flex-1 max-w-[280px]">
                      {f.options?.map(o=><option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input id={f.key} type="text" value={settings[f.key]}
                      onChange={e=>setSettings(s=>({...s,[f.key]:e.target.value}))}
                      className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none flex-1 max-w-[280px]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {saveMutation.isError && (
          <p className="text-sm text-[#8B2F2F]">Save failed: {(saveMutation.error as Error).message}</p>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving…" : saveMutation.isSuccess ? "✓ Saved" : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={() => {
            const flat: Record<string, string> = {};
            SETTINGS_GROUPS.forEach(g => g.fields.forEach(f => { flat[f.key] = f.value; }));
            setSettings(flat);
          }}>Reset to Defaults</Button>
        </div>
      </div>
    </AppShell>
  );
}
