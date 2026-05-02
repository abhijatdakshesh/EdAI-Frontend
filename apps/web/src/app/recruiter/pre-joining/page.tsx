"use client";

import { useState } from "react";
import { Phone, MessageSquare, Mail, UserCheck, FileText, BookOpen, Users, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePreJoinCandidates, useEngagementAction, type PreJoinCandidate, type JoiningRiskLevel, type EngagementAction } from "@/lib/api/recruiter";

const RISK_COLORS: Record<JoiningRiskLevel, string> = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-700",
  CRITICAL: "bg-red-200 text-red-800",
};

const RISK_BORDER: Record<JoiningRiskLevel, string> = {
  LOW: "border-green-100",
  MEDIUM: "border-amber-200",
  HIGH: "border-red-200",
  CRITICAL: "border-red-300",
};

function JoiningProbabilityBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-green-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold text-stone-700 w-8 text-right">{value}%</span>
    </div>
  );
}

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {done
        ? <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
        : <Clock className="h-3.5 w-3.5 text-stone-300 shrink-0" />
      }
      <span className={done ? "text-stone-500 line-through" : "text-stone-700"}>{label}</span>
    </div>
  );
}

function CandidateCard({ c, onAction }: { c: PreJoinCandidate; onAction: (a: EngagementAction) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`border ${RISK_BORDER[c.riskLevel]}`}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-stone-900">{c.name}</p>
              <Badge className={`text-xs ${RISK_COLORS[c.riskLevel]}`}>{c.riskLevel} RISK</Badge>
            </div>
            <p className="text-sm text-stone-500 mt-0.5">{c.college} · {c.branch} · ₹{c.offerCTC} LPA · Joining {new Date(c.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
            <p className="text-xs text-stone-400 mt-0.5">Last contacted {c.daysSinceLastContact === 0 ? "today" : `${c.daysSinceLastContact}d ago`}</p>
          </div>
          <div className="shrink-0 w-32">
            <p className="text-xs text-stone-400 mb-1">Joining probability</p>
            <JoiningProbabilityBar value={c.joiningProbability} />
          </div>
        </div>

        {/* Risk reasons */}
        {c.riskReasons.length > 0 && (
          <div className="mt-3 space-y-1">
            {c.riskReasons.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 rounded px-2 py-1">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                {r}
              </div>
            ))}
          </div>
        )}

        {/* Expand for checklist + actions */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 text-xs text-amber-700 hover:underline"
        >
          {expanded ? "Hide" : "Show"} checklist & actions
        </button>

        {expanded && (
          <div className="mt-3 space-y-4">
            {/* Checklist */}
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
              <ChecklistItem label="Skill Bridge enrolled" done={c.skillBridgeEnrolled} />
              <ChecklistItem label="Documents complete" done={c.documentsComplete} />
              <ChecklistItem label="Buddy assigned" done={c.buddyAssigned} />
              <ChecklistItem label="Parent letter sent" done={c.parentCommunicationSent} />
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
              <Button
                size="sm" variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => onAction({ type: "CALL", candidateUsn: c.usn })}
              >
                <Phone className="h-3 w-3" /> Call HR
              </Button>
              <Button
                size="sm" variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => onAction({ type: "WHATSAPP", candidateUsn: c.usn })}
              >
                <MessageSquare className="h-3 w-3" /> WhatsApp
              </Button>
              <Button
                size="sm" variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => onAction({ type: "MANAGER_VIDEO", candidateUsn: c.usn })}
              >
                <Mail className="h-3 w-3" /> Manager Video
              </Button>
              {!c.buddyAssigned && (
                <Button
                  size="sm" variant="outline"
                  className="gap-1.5 text-xs text-blue-700 border-blue-200"
                  onClick={() => onAction({ type: "BUDDY_CONNECT", candidateUsn: c.usn })}
                >
                  <UserCheck className="h-3 w-3" /> Assign Buddy
                </Button>
              )}
              {!c.documentsComplete && (
                <Button
                  size="sm" variant="outline"
                  className="gap-1.5 text-xs text-violet-700 border-violet-200"
                  onClick={() => onAction({ type: "FLEXIBILITY_OFFER", candidateUsn: c.usn })}
                >
                  <FileText className="h-3 w-3" /> Chase Docs
                </Button>
              )}
              {!c.skillBridgeEnrolled && (
                <Button
                  size="sm" variant="outline"
                  className="gap-1.5 text-xs text-green-700 border-green-200"
                  onClick={() => onAction({ type: "BUDDY_CONNECT", candidateUsn: c.usn })}
                >
                  <BookOpen className="h-3 w-3" /> Enrol Skill Bridge
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PreJoiningPage() {
  const { data: candidates = [], isLoading } = usePreJoinCandidates();
  const { mutate: triggerAction } = useEngagementAction();
  const [filter, setFilter] = useState<"ALL" | JoiningRiskLevel>("ALL");

  const stats = {
    total: candidates.length,
    atRisk: candidates.filter(c => c.riskLevel === "HIGH" || c.riskLevel === "CRITICAL").length,
    avgProbability: candidates.length
      ? Math.round(candidates.reduce((s, c) => s + c.joiningProbability, 0) / candidates.length)
      : 0,
    docsPending: candidates.filter(c => !c.documentsComplete).length,
  };

  const filtered = filter === "ALL" ? candidates : candidates.filter(c => c.riskLevel === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Pre-Joining Engagement</h1>
        <p className="text-stone-500 mt-1">Monitor and engage accepted candidates during the 6–9 month gap. Target: &lt;10% offer drop-out.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Accepted Candidates", value: stats.total, icon: Users, color: "text-stone-700" },
          { label: "At Risk", value: stats.atRisk, icon: AlertTriangle, color: "text-red-600" },
          { label: "Avg Joining Probability", value: `${stats.avgProbability}%`, icon: CheckCircle, color: "text-green-600" },
          { label: "Docs Pending", value: stats.docsPending, icon: FileText, color: "text-amber-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                <p className="text-xs text-stone-500">{s.label}</p>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk filter */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {f === "ALL" ? `All (${candidates.length})` : `${f} Risk (${candidates.filter(c => c.riskLevel === f).length})`}
          </button>
        ))}
      </div>

      {/* Candidate cards */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <CandidateCard
              key={c.usn}
              c={c}
              onAction={action => triggerAction(action)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-stone-400 py-12">No candidates in this risk category.</p>
          )}
        </div>
      )}
    </div>
  );
}
