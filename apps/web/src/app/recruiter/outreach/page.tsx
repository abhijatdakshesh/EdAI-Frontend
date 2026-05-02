"use client";

import { useState } from "react";
import { Loader2, MessageSquare, Copy, Check, Send, Smartphone, Mail, Linkedin, Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useRecruiterJobs, useCandidates, useOutreachGenerator,
  type Candidate, type OutreachChannel,
} from "@/lib/api/recruiter";

const CHANNEL_CONFIG: Record<OutreachChannel, { label: string; icon: React.ElementType; color: string; limit?: number }> = {
  WHATSAPP: { label: "WhatsApp", icon: Smartphone, color: "text-green-600", limit: 1000 },
  EMAIL: { label: "Email", icon: Mail, color: "text-blue-600" },
  LINKEDIN: { label: "LinkedIn DM", icon: Linkedin, color: "text-blue-700", limit: 300 },
};

function MessageCard({ msg, copied, onCopy }: {
  msg: { candidateName: string; channel: OutreachChannel; subject?: string; body: string; characterCount: number; consentVerified: boolean };
  copied: boolean;
  onCopy: () => void;
}) {
  const cfg = CHANNEL_CONFIG[msg.channel];
  const overLimit = cfg.limit && msg.characterCount > cfg.limit;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <p className="font-medium text-stone-900 text-sm">{msg.candidateName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <cfg.icon className={`h-3 w-3 ${cfg.color}`} />
            <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
            {msg.subject && <span className="text-xs text-stone-400">· {msg.subject}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${overLimit ? "text-red-500" : "text-stone-400"}`}>
            {msg.characterCount}{cfg.limit ? `/${cfg.limit}` : ""} chars
          </span>
          <Button variant="outline" size="sm" onClick={onCopy} className="gap-1.5 h-7 text-xs">
            {copied ? <><Check className="h-3 w-3 text-green-600" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="text-sm text-stone-700 whitespace-pre-wrap font-sans bg-stone-50 rounded-lg p-3 border border-stone-100">{msg.body}</pre>
        {overLimit && (
          <p className="text-xs text-red-500 mt-1">⚠ Exceeds {cfg.label} character limit — consider shortening.</p>
        )}
        {!msg.consentVerified && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1 mt-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            Consent not verified — do not send until student opts in.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function OutreachPage() {
  const { data: jobs = [] } = useRecruiterJobs();
  // Only load candidates who have consented — empty filter disabled, pre-seeded list used in mock
  // Only show candidates who have explicitly opted in to recruiter discovery (DPDP Act 2023)
  const { data: allCandidates = [] } = useCandidates({ semester: 8 }, { enabled: true });
  const consentedCandidates = allCandidates.filter(c => c.consentedToRecruiterDiscovery);
  const { mutate: generate, isPending: generating, data: messages } = useOutreachGenerator();

  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<OutreachChannel>("WHATSAPP");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function toggleCandidate(id: string) {
    setSelectedCandidates(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleGenerate() {
    const candidates = consentedCandidates.filter(c => selectedCandidates.has(c.studentId));
    generate({ jobId: selectedJobId, candidates, channel });
  }

  function copyMessage(usn: string, body: string) {
    navigator.clipboard.writeText(body).then(() => {
      setCopiedId(usn);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">AI Outreach Generator</h1>
        <p className="text-stone-500 mt-1">Generate personalized messages per candidate — referencing their skills and projects</p>
      </div>

      {/* DPDP compliance banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex gap-3">
        <Shield className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">DPDP Act 2023 — Consent Required</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Only students who have explicitly opted in to recruiter discovery are shown below ({consentedCandidates.length} of {allCandidates.length} eligible).
            Students who have not consented or have opted out are excluded automatically.
          </p>
        </div>
      </div>
      {allCandidates.length > consentedCandidates.length && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {allCandidates.length - consentedCandidates.length} candidate(s) hidden — no recruiter discovery consent on file.
        </div>
      )}

      {/* Configuration */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step 1 — Select job */}
        <Card>
          <CardHeader><CardTitle className="text-sm">1. Select Job</CardTitle></CardHeader>
          <CardContent>
            <select
              className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
            >
              <option value="">Choose a job posting…</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title} — ₹{j.ctcLpa}L · {j.location}</option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Step 2 — Channel */}
        <Card>
          <CardHeader><CardTitle className="text-sm">2. Select Channel</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(CHANNEL_CONFIG) as [OutreachChannel, typeof CHANNEL_CONFIG[OutreachChannel]][]).map(([ch, cfg]) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm font-medium transition-colors ${
                    channel === ch ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <cfg.icon className="h-4 w-4" />
                  {cfg.label}
                  {cfg.limit && <span className="text-xs opacity-60">{cfg.limit} chars</span>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step 3 — Select candidates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">3. Select Candidates</CardTitle>
          {selectedCandidates.size > 0 && (
            <Badge variant="secondary">{selectedCandidates.size} selected</Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {consentedCandidates.map((c: Candidate) => (
              <button
                key={c.studentId}
                onClick={() => toggleCandidate(c.studentId)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  selectedCandidates.has(c.studentId) ? "border-amber-400 bg-amber-50" : "border-stone-200 hover:bg-stone-50"
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                  selectedCandidates.has(c.studentId) ? "border-amber-500 bg-amber-500" : "border-stone-300"
                }`}>
                  {selectedCandidates.has(c.studentId) && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900">{c.name}</p>
                  <p className="text-xs text-stone-500">{c.department} · CGPA {c.cgpa} · {c.skills.slice(0, 2).join(", ")}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate */}
      <Button
        onClick={handleGenerate}
        disabled={generating || selectedCandidates.size === 0 || !selectedJobId}
        className="gap-2 bg-violet-600 hover:bg-violet-700"
      >
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {generating ? "Generating personalized messages…" : `Generate ${selectedCandidates.size || ""} Messages`}
      </Button>

      {/* Generated messages */}
      {messages && messages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-violet-600" />
            <h2 className="font-semibold text-stone-900">Generated Messages</h2>
            <Badge variant="secondary">{messages.length} messages</Badge>
          </div>
          {messages.map(msg => (
            <MessageCard
              key={msg.candidateUsn}
              msg={msg}
              copied={copiedId === msg.candidateUsn}
              onCopy={() => copyMessage(msg.candidateUsn, msg.body)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
