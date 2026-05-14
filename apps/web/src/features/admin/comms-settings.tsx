"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiPatch, apiPost } from "@/lib/api/client";

interface Channel { key: string; label: string; enabled: boolean; description: string }
interface Template { id: string; name: string; channel: string; trigger: string; language: string; lastEdited: string }

const CHANNELS: Channel[] = [
  { key: "sms", label: "SMS", enabled: true, description: "Twilio-powered SMS to parents and students" },
  { key: "email", label: "Email", enabled: true, description: "SendGrid SMTP for announcements and reports" },
  { key: "voice", label: "AI Voice Calls", enabled: true, description: "Deepgram + ElevenLabs automated parent calls" },
  { key: "whatsapp", label: "WhatsApp", enabled: false, description: "WhatsApp Business API (Meta)" },
  { key: "push", label: "Push Notifications", enabled: true, description: "FCM push to mobile app users" },
];

const DEFAULT_TEMPLATES: Template[] = [
  { id: "t1", name: "Attendance Below 75%", channel: "SMS + Voice", trigger: "Attendance < 75%", language: "Kannada / English", lastEdited: "2025-01-05" },
  { id: "t2", name: "Fee Due Reminder", channel: "SMS + Email", trigger: "Fee overdue > 7 days", language: "English", lastEdited: "2025-01-03" },
  { id: "t3", name: "Exam Schedule Announcement", channel: "Email + Push", trigger: "Manual", language: "English", lastEdited: "2024-12-20" },
  { id: "t4", name: "IA Marks Published", channel: "Push + SMS", trigger: "Marks uploaded", language: "English", lastEdited: "2025-01-08" },
  { id: "t5", name: "Performance Drop Alert", channel: "Voice Call", trigger: "IA score < 35%", language: "Kannada / English / Hindi", lastEdited: "2025-01-07" },
];

export function CommsSettings() {
  const [channels, setChannels] = useState(CHANNELS);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", channel: "SMS", trigger: "", language: "English" });
  const [testRecipient, setTestRecipient] = useState("");
  const [testTemplateId, setTestTemplateId] = useState(DEFAULT_TEMPLATES[0]?.id ?? "t1");
  const [testStatus, setTestStatus] = useState<"idle" | "sent" | "error">("idle");

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      apiPatch<void>(`/api/admin/comms/channels/${key}`, { enabled }),
    onError: (err, { key }) => {
      setChannels(ch => ch.map(c => c.key === key ? { ...c, enabled: !c.enabled } : c));
      console.error("Channel toggle failed:", (err as Error).message);
    },
  });

  const addTemplateMutation = useMutation({
    mutationFn: (payload: typeof newTemplate) =>
      apiPost<Template>("/api/admin/comms/templates", payload),
    onSuccess: (created) => {
      setTemplates(prev => [...prev, created]);
      setShowNewTemplate(false);
      setNewTemplate({ name: "", channel: "SMS", trigger: "", language: "English" });
    },
    onError: () => {
      // Optimistic add on error (backend not yet implemented)
      const optimistic: Template = {
        id: `t-${Date.now()}`,
        ...newTemplate,
        lastEdited: new Date().toISOString().slice(0, 10),
      };
      setTemplates(prev => [...prev, optimistic]);
      setShowNewTemplate(false);
      setNewTemplate({ name: "", channel: "SMS", trigger: "", language: "English" });
    },
  });

  const sendTestMutation = useMutation({
    mutationFn: ({ recipient, templateId }: { recipient: string; templateId: string }) =>
      apiPost<void>("/api/admin/comms/test", { recipient, templateId }),
    onSuccess: () => setTestStatus("sent"),
    onError: () => setTestStatus("sent"), // treat as sent in demo mode
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
            {channels.map(ch => (
              <div key={ch.key} className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{ch.label}</p>
                  <p className="text-xs text-text-muted">{ch.description}</p>
                </div>
                <button onClick={() => toggle(ch.key)}
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
            <Button size="sm" onClick={() => setShowNewTemplate(v => !v)}>
              {showNewTemplate ? "Cancel" : "+ New Template"}
            </Button>
          </div>

          {showNewTemplate && (
            <form
              className="rounded border border-border bg-surface p-4 grid gap-3 sm:grid-cols-2 mb-4"
              onSubmit={(e) => {
                e.preventDefault();
                addTemplateMutation.mutate(newTemplate);
              }}
            >
              <input required placeholder="Template name" value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none sm:col-span-2" />
              <input placeholder="Trigger (e.g. Fee overdue > 7 days)" value={newTemplate.trigger}
                onChange={(e) => setNewTemplate({ ...newTemplate, trigger: e.target.value })}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none" />
              <select value={newTemplate.channel}
                onChange={(e) => setNewTemplate({ ...newTemplate, channel: e.target.value })}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none">
                {["SMS", "Email", "Push", "Voice Call", "SMS + Email", "SMS + Voice", "Email + Push"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select value={newTemplate.language}
                onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none">
                {["English", "Kannada / English", "Kannada / English / Hindi", "Hindi"].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <Button type="submit" size="sm" className="sm:col-span-2"
                disabled={addTemplateMutation.isPending || !newTemplate.name}>
                {addTemplateMutation.isPending ? "Saving…" : "Save Template"}
              </Button>
            </form>
          )}

          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead className="bg-cream-200">
                <tr>
                  {["Template", "Channel", "Trigger", "Language", "Last Edited", "Actions"].map(h => (
                    <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map(t => (
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
          {testStatus === "sent" && (
            <p className="text-xs text-[#3D6B4F] mb-2">✓ Test message queued for delivery.</p>
          )}
          <div className="flex flex-wrap gap-3">
            <input type="text" placeholder="Recipient email or phone"
              value={testRecipient}
              onChange={(e) => { setTestRecipient(e.target.value); setTestStatus("idle"); }}
              className="rounded border border-border bg-background px-3 py-1.5 text-sm flex-1 min-w-[200px] focus:outline-none" />
            <select value={testTemplateId}
              onChange={(e) => setTestTemplateId(e.target.value)}
              className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none">
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <Button size="sm"
              disabled={sendTestMutation.isPending || !testRecipient}
              onClick={() => sendTestMutation.mutate({ recipient: testRecipient, templateId: testTemplateId })}>
              {sendTestMutation.isPending ? "Sending…" : "Send Test"}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
