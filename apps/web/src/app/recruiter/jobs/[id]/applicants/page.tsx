"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Brain, Loader2, CheckSquare, Square, TrendingUp, ShieldAlert, Shuffle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useApplicants, useUpdateApplicationStatus, useBulkShortlist,
  useAiRankCandidates, useOfferPrediction, useBiasAudit, useDiversityNudge,
  type ApplicationStatus, type AiRankedCandidate, type OfferPrediction, type BiasAuditResult,
} from "@/lib/api/recruiter";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  APPLIED: "bg-blue-50 text-blue-700",
  SHORTLISTED: "bg-amber-50 text-amber-700",
  INTERVIEW: "bg-violet-50 text-violet-700",
  OFFERED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-stone-100 text-stone-500",
};

const DECLINE_RISK_COLOR = { LOW: "text-green-600", MEDIUM: "text-amber-600", HIGH: "text-red-600" };

function BiasBar({ label, shortlistPct, poolPct }: { label: string; shortlistPct: number; poolPct: number }) {
  const diff = shortlistPct - poolPct;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-24 shrink-0 text-stone-600">{label}</span>
      <div className="flex-1 bg-stone-100 rounded-full h-2 relative">
        <div className="absolute left-0 top-0 h-2 rounded-full bg-violet-400" style={{ width: `${shortlistPct}%` }} />
        <div className="absolute top-0 h-2 w-0.5 bg-stone-400" style={{ left: `${poolPct}%` }} title={`Pool: ${poolPct}%`} />
      </div>
      <span className={`w-14 shrink-0 text-right font-medium ${diff > 10 ? "text-red-600" : diff < -10 ? "text-amber-600" : "text-green-600"}`}>
        {diff > 0 ? "+" : ""}{diff}%
      </span>
    </div>
  );
}

function BiasAuditModal({ result, onClose }: { result: BiasAuditResult; onClose: () => void }) {
  const biasColor = result.overallBiasScore > 60 ? "text-red-600" : result.overallBiasScore > 40 ? "text-amber-600" : "text-green-600";
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <div>
            <h2 className="font-semibold text-stone-900">Bias Audit Report</h2>
            <p className="text-xs text-stone-500 mt-0.5">Shortlist vs applicant pool distribution</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* Overall score */}
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <ShieldAlert className={`h-5 w-5 ${biasColor}`} />
            <div>
              <p className="text-sm font-medium text-stone-900">Bias Score: <span className={biasColor}>{result.overallBiasScore}/100</span></p>
              <p className="text-xs text-stone-500">Lower is better. Purple bar = shortlist %, grey line = pool %</p>
            </div>
          </div>

          {/* Gender */}
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase mb-2">Gender</p>
            <div className="space-y-1.5">
              {result.genderBreakdown.map(d => <BiasBar key={d.label} {...d} />)}
            </div>
          </div>

          {/* College tier */}
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase mb-2">College Tier</p>
            <div className="space-y-1.5">
              {result.collegeTierBreakdown.map(d => <BiasBar key={d.label} {...d} />)}
            </div>
          </div>

          {/* Region */}
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase mb-2">Region</p>
            <div className="space-y-1.5">
              {result.regionBreakdown.map(d => <BiasBar key={d.label} {...d} />)}
            </div>
          </div>

          {/* AI flags */}
          {result.flags.length > 0 && (
            <div className="space-y-2">
              {result.flags.map((flag, i) => (
                <div key={i} className="flex gap-2 text-xs text-red-700 bg-red-50 rounded px-3 py-2">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-stone-100">
          <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicantsPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const { data: applicants = [], isLoading } = useApplicants(jobId);
  const { mutate: updateStatus } = useUpdateApplicationStatus();
  const { mutate: bulkShortlist, isPending: shortlisting } = useBulkShortlist();
  const { mutate: aiRank, isPending: ranking, data: rankings } = useAiRankCandidates();
  const { mutate: predictOffers, isPending: predicting, data: offerPredictions } = useOfferPrediction();
  const { mutate: runBiasAudit, isPending: auditing, data: biasAuditResult } = useBiasAudit();
  const { mutate: diversityNudge, isPending: nudging } = useDiversityNudge();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBiasModal, setShowBiasModal] = useState(false);
  const [diversityMode, setDiversityMode] = useState(false);

  function toggleSelect(usn: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(usn) ? next.delete(usn) : next.add(usn);
      return next;
    });
  }

  function handleBulkShortlist() {
    bulkShortlist({ jobId, studentUsns: Array.from(selected) }, { onSuccess: () => setSelected(new Set()) });
  }

  function handleBiasAudit() {
    const shortlisted = applicants.filter(a => a.status === "SHORTLISTED").map(a => a.studentUsn);
    const all = applicants.map(a => a.studentUsn);
    runBiasAudit({ shortlistedUsns: shortlisted, allApplicantUsns: all }, { onSuccess: () => setShowBiasModal(true) });
  }

  function handleDiversityNudge() {
    const shortlisted = applicants.filter(a => a.status === "SHORTLISTED").map(a => a.studentUsn);
    diversityNudge({ jobId, currentShortlist: shortlisted }, { onSuccess: () => setDiversityMode(true) });
  }

  const rankMap = new Map<string, AiRankedCandidate>((rankings ?? []).map(r => [r.usn, r]));
  const offerMap = new Map<string, OfferPrediction>((offerPredictions ?? []).map(p => [p.usn, p]));

  const sorted = rankings
    ? [...applicants].sort((a, b) => (rankMap.get(a.studentUsn)?.rank ?? 999) - (rankMap.get(b.studentUsn)?.rank ?? 999))
    : applicants;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Applicants</h1>
          <p className="text-stone-500 mt-1">{applicants.length} total applications</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selected.size > 0 && (
            <Button onClick={handleBulkShortlist} disabled={shortlisting} variant="outline" className="gap-2 text-amber-700 border-amber-200">
              {shortlisting ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
              Shortlist {selected.size}
            </Button>
          )}
          <Button onClick={handleDiversityNudge} disabled={nudging} variant="outline" className="gap-2 text-violet-700 border-violet-200" size="sm">
            {nudging ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shuffle className="h-3 w-3" />}
            Diversity Nudge
          </Button>
          <Button onClick={handleBiasAudit} disabled={auditing} variant="outline" className="gap-2 text-red-700 border-red-200" size="sm">
            {auditing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldAlert className="h-3 w-3" />}
            Audit for Bias
          </Button>
          <Button onClick={() => predictOffers(jobId)} disabled={predicting} variant="outline" className="gap-2 text-green-700 border-green-200" size="sm">
            {predicting ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />}
            Predict Offers
          </Button>
          <Button onClick={() => aiRank(jobId)} disabled={ranking} className="gap-2 bg-violet-600 hover:bg-violet-700">
            {ranking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {ranking ? "AI Ranking…" : "AI Rank All"}
          </Button>
        </div>
      </div>

      {/* Status banners */}
      {rankings && (
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-violet-700 font-medium">AI ranking complete — candidates sorted by fit score</p>
          </CardContent>
        </Card>
      )}
      {offerPredictions && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-green-700 font-medium">Offer predictions ready — acceptance % and joining risk shown per candidate</p>
          </CardContent>
        </Card>
      )}
      {diversityMode && (
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-violet-700 font-medium">Diversity mode active — shortlist re-ordered to surface underrepresented candidates</p>
          </CardContent>
        </Card>
      )}

      {/* Applicant list */}
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-stone-400 text-sm text-center py-8">Loading applicants…</p>
          ) : sorted.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-8">No applicants yet.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {sorted.map(app => {
                const rank = rankMap.get(app.studentUsn);
                const offer = offerMap.get(app.studentUsn);
                return (
                  <div key={app.applicationId} className="py-3 flex items-start gap-3">
                    <button type="button" onClick={() => toggleSelect(app.studentUsn)} className="text-stone-400 hover:text-amber-600 shrink-0 mt-0.5">
                      {selected.has(app.studentUsn) ? <CheckSquare className="h-4 w-4 text-amber-600" /> : <Square className="h-4 w-4" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-stone-900 text-sm">{app.name}</p>
                        <span className="text-xs text-stone-400">{app.studentUsn}</span>
                        {rank && (
                          <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                            #{rank.rank} · {rank.fitScore}% fit
                          </span>
                        )}
                        {offer?.declineRisk === "HIGH" && (
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1">
                            ⚠ Competing offers likely
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {app.department} · Sem {app.semester} · CGPA {app.cgpa}
                        {app.placementScore && ` · Score ${app.placementScore}`}
                        {app.percentile && ` (${app.percentile}th %ile)`}
                      </p>
                      {rank?.rationale && <p className="text-xs text-violet-600 mt-0.5 italic">{rank.rationale}</p>}
                      {offer && (
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-stone-500">
                            Accept: <span className={`font-medium ${offer.acceptProbability >= 70 ? "text-green-600" : offer.acceptProbability >= 50 ? "text-amber-600" : "text-red-600"}`}>{offer.acceptProbability}%</span>
                          </span>
                          <span className="text-xs text-stone-500">
                            Join: <span className={`font-medium ${offer.joiningProbability >= 70 ? "text-green-600" : offer.joiningProbability >= 50 ? "text-amber-600" : "text-red-600"}`}>{offer.joiningProbability}%</span>
                          </span>
                          <span className={`text-xs font-medium ${DECLINE_RISK_COLOR[offer.declineRisk]}`}>
                            Risk: {offer.declineRisk}
                          </span>
                          {offer.suggestedCTC && (
                            <span className="text-xs text-stone-500">Suggest ₹{offer.suggestedCTC}L CTC</span>
                          )}
                        </div>
                      )}
                      {offer?.declineReason && <p className="text-xs text-red-500 mt-0.5 italic">{offer.declineReason}</p>}
                      {app.skills?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {app.skills.slice(0, 5).map(s => (
                            <span key={s} className="text-xs bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                      <select
                        className="text-xs border border-stone-200 rounded px-2 py-1 bg-white"
                        value={app.status}
                        onChange={e => updateStatus({ jobId, usn: app.studentUsn, status: e.target.value as ApplicationStatus })}
                      >
                        {(["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED"] as ApplicationStatus[]).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bias audit modal */}
      {showBiasModal && biasAuditResult && (
        <BiasAuditModal result={biasAuditResult} onClose={() => setShowBiasModal(false)} />
      )}
    </div>
  );
}
