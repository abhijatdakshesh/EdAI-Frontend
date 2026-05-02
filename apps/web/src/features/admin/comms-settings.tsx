"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiPatch } from "@/lib/api/client";

interface Channel { key: string; label: string; enabled: boolean; description: string }
interface Template { id: string; name: string; channel: string; trigger: string; language: string; lastEdited: string }

const CHANNELS: Channel[] = [
  { key: "sms", label: "SMS", enabled: true, description: "Twilio-powered SMS to parents and students" },
  { key: "email", label: "Email", enabled: true, description: "SendGrid SMTP for announcements and reports" },
  { key: "voice", label: "AI Voice Calls", enabled: true, description: "Deepgram + ElevenLabs automated parent calls" },
  { key: "whatsapp", label: "WhatsApp", enabled: false, description: "WhatsApp Business API (Meta)" },
  { key: "push", label: "Push Notifications", enabled: true, description: "FCM push to mobile app users" },
];

const TEMPLATES: Template[] = [
  { id: "t1", name: "Attendance Below 75%", channel: "SMS + Voice", trigger: "Attendance < 75%", language: "Kannada / English", lastEdited: "2025-01-05" },
  { id: "t2", name: "Fee Due Reminder", channel: "SMS + Email", trigger: "Fee overdue > 7 days", language: "English", lastEdited: "2025-01-03" },
  { id: "t3", name: "Exam Schedule Announcement", channel: "Email + Push", trigger: "Manual", language: "English", lastEdited: "2024-12-20" },
  { id: "t4", name: "IA Marks Published", channel: "Push + SMS", trigger: "Marks uploaded", language: "English", lastEdited: "2025-01-08" },
  { id: "t5", name: "Performance Drop Alert", channel: "Voice Call", trigger: "IA score < 35%", language: "Kannada / English / Hindi", lastEdited: "2025-01-07" },
];

export function CommsSettings() {
  const [channels, setChannels] = useState(CHANNELS);

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      apiPatch<void>(`/api/admin/comms/channels/${key}`, { enabled }),
    onError: (err, { key }) => {
      // Rollback on failure
      setChannels(ch => ch.map(c => c.key === key ? { ...c, enabled: !c.enabled } : c));
      console.error("Channel toggle failed:", (err as Error).message);
    },
  });

  const toggle = (key: string) => {
    const ch = channels.find(c => c.key === key);
    if (!ch) return;
    setChannels(prev => prev.map(c => c.key === key ? { ...c, enabled: !c.enabled } : c));
    toggleMutation.mutate({ key, enabled: !ch.enabled });
  };

  return (
    <AppShell title="Communication Settings">
      <div className="grid gap-6 max-w-4xl">
        {/* Channel toggles */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">Communication Channels</p>
          <div className="grid gap-3">
            {channels.map(ch=>(
              <div key={ch.key} className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{ch.label}</p>
                  <p className="text-xs text-text-muted">{ch.description}</p>
                </div>
                <button onClick={()=>toggle(ch.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ch.enabled ? "bg-[#1C1810]" : "bg-border"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ch.enabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="label-track">Message Templates</p>
            <Button size="sm">+ New Template</Button>
          </div>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead className="bg-cream-200">
                <tr>
                  {["Template","Channel","Trigger","Language","Last Edited","Actions"].map(h=>(
                    <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TEMPLATES.map(t=>(
                  <tr key={t.id} className="border-t border-border even:bg-cream-50">
                    <td className="px-4 py-2 font-medium">{t.name}</td>
                    <td className="px-4 py-2 text-text-muted">{t.channel}</td>
                    <td className="px-4 py-2">{t.trigger}</td>
                    <td className="px-4 py-2">{t.language}</td>
                    <td className="px-4 py-2 text-text-muted">{t.lastEdited}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button className="text-xs text-[#2F567A] hover:underline">Edit</button>
                        <button className="text-xs text-[#2F567A] hover:underline">Preview</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Test broadcast */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-3">Send Test Message</p>
          <div className="flex flex-wrap gap-3">
            <input type="email" placeholder="Recipient email or phone"
              className="rounded border border-border bg-background px-3 py-1.5 text-sm flex-1 min-w-[200px] focus:outline-none" />
            <select className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none">
              {TEMPLATES.map(t=><option key={t.id}>{t.name}</option>)}
            </select>
            <Button size="sm">Send Test</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
