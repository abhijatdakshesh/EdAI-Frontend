"use client";

import { useState } from "react";
import { Search, Brain, Loader2, Filter, Copy, Sparkles, Users2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useCandidates, useAiCandidateSearch, useSemanticJdMatch, useLookAlikeSearch,
  useHiddenGemFinder, useSkillAdjacency,
  type Candidate, type SearchMode,
} from "@/lib/api/recruiter";

const BRANCHES = ["", "CSE", "ISE", "ECE", "EEE", "ME", "CV", "CH", "BT"];
const MODES: { id: SearchMode; label: string; icon: React.ElementType; color: string }[] = [
  { id: "FILTER", label: "Smart Filters", icon: Filter, color: "stone" },
  { id: "NL", label: "Natural Language", icon: Brain, color: "violet" },
  { id: "JD_MATCH", label: "JD Match", icon: Search, color: "blue" },
  { id: "LOOK_ALIKE", label: "Look-Alike", icon: Users2, color: "amber" },
  { id: "HIDDEN_GEMS", label: "Hidden Gems", icon: Sparkles, color: "green" },
  { id: "SKILL_ADJACENCY", label: "Skill Adjacency", icon: Zap, color: "rose" },
];

function CandidateCard({ c, extra }: { c: Candidate; extra?: React.ReactNode }) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-stone-900">{c.name}</p>
              <span className="text-xs text-stone-400">{c.studentId}</span>
            </div>
            <p className="text-sm text-stone-500 mt-0.5">{c.department} · Sem {c.semester} · CGPA {c.cgpa}</p>
            {extra}
            {c.skills?.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {c.skills.slice(0, 6).map(s => (
                  <span key={s} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            {c.placementScore && (
              <>
                <p className="text-xl font-bold text-amber-600">{c.placementScore}</p>
                <p className="text-xs text-stone-400">Placement Score</p>
                {c.percentile && <p className="text-xs text-stone-500">{c.percentile}th %ile</p>}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CandidatesPage() {
  const [mode, setMode] = useState<SearchMode>("FILTER");

  // Filter state
  const [branch, setBranch] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const [minScore, setMinScore] = useState("");
  const [skills, setSkills] = useState("");
  const [semester, setSemester] = useState("");

  // NL state
  const [aiQuery, setAiQuery] = useState("");
  const { mutate: aiSearch, isPending: aiSearching, data: aiResult } = useAiCandidateSearch();

  // JD Match state
  const [jdText, setJdText] = useState("");
  const { mutate: jdMatch, isPending: jdMatching, data: jdResults } = useSemanticJdMatch();

  // Look-alike state
  const [lookAlikeUsn, setLookAlikeUsn] = useState("");
  const { mutate: lookAlike, isPending: lookAliking, data: lookAlikeResults } = useLookAlikeSearch();

  // Hidden gems state
  const { mutate: findGems, isPending: findingGems, data: gemResults } = useHiddenGemFinder();

  // Skill adjacency state
  const [targetSkill, setTargetSkill] = useState("");
  const { mutate: adjacencySearch, isPending: adjacencySearching, data: adjacencyResults } = useSkillAdjacency();

  // Filter candidates — only fetch when at least one filter is active (avoids full table scan on mount)
  const candidateFilter = {
    ...(branch ? { branch } : {}),
    ...(minCgpa ? { minCgpa: +minCgpa } : {}),
    ...(minScore ? { minScore: +minScore } : {}),
    ...(skills ? { skills } : {}),
    ...(semester ? { semester: +semester } : {}),
  };
  const hasFilters = Object.keys(candidateFilter).length > 0;
  const { data: filterCandidates = [], isLoading: filterLoading } = useCandidates(candidateFilter, { enabled: hasFilters });

  const modeColor = (m: typeof MODES[0]) => ({
    stone: !!(mode === m.id) ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200",
    violet: !!(mode === m.id) ? "bg-violet-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200",
    blue: !!(mode === m.id) ? "bg-blue-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200",
    amber: !!(mode === m.id) ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200",
    green: !!(mode === m.id) ? "bg-green-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200",
    rose: !!(mode === m.id) ? "bg-rose-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200",
  }[m.color]);

  const isLoading = mode === "FILTER" ? filterLoading
    : mode === "NL" ? aiSearching
    : mode === "JD_MATCH" ? jdMatching
    : mode === "LOOK_ALIKE" ? lookAliking
    : mode === "HIDDEN_GEMS" ? findingGems
    : adjacencySearching;

  type CandidateDisplay = { candidate: Candidate; extra?: React.ReactNode };
  const displayItems: CandidateDisplay[] = mode === "FILTER"
    ? filterCandidates.map(c => ({ candidate: c }))
    : mode === "NL" && aiResult
    ? aiResult.candidates.map(c => ({ candidate: c }))
    : mode === "JD_MATCH" && jdResults
    ? jdResults.map(r => ({ candidate: r.candidate, extra: (
        <div className="mt-1">
          <span className="text-xs font-semibold text-blue-600">{r.matchScore}% match</span>
          <ul className="text-xs text-stone-500 mt-0.5 space-y-0.5">
            {r.matchReasons.slice(0, 2).map((reason, i) => <li key={i}>· {reason}</li>)}
          </ul>
        </div>
      )}))
    : mode === "LOOK_ALIKE" && lookAlikeResults
    ? lookAlikeResults.map(r => ({ candidate: r.candidate, extra: (
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-amber-600">{r.similarityScore}% similar</span>
          {r.sharedTraits.map(t => <Badge key={t} variant="outline" className="text-xs py-0">{t}</Badge>)}
        </div>
      )}))
    : mode === "HIDDEN_GEMS" && gemResults
    ? gemResults.map(gem => ({ candidate: gem, extra: (
        <div className="mt-1">
          <span className="text-xs font-semibold text-green-600">Gem Score {gem.gemScore}</span>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {gem.signals.map((s, i) => <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">✦ {s}</span>)}
          </div>
        </div>
      )}))
    : mode === "SKILL_ADJACENCY" && adjacencyResults
    ? adjacencyResults.map(r => ({ candidate: r.candidate, extra: (
        <div className="mt-1 flex items-center gap-3 flex-wrap">
          {r.targetSkillMatch
            ? <span className="text-xs font-semibold text-rose-600">Direct match</span>
            : <span className="text-xs text-stone-500">Ramp: ~{r.estimatedRampWeeks} weeks</span>
          }
          <span className="text-xs text-stone-400">Adjacent: {r.adjacentSkills.join(", ")}</span>
        </div>
      )}))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Find Candidates</h1>
        <p className="text-stone-500 mt-1">6 AI-powered search modes — filters, natural language, JD matching, look-alike, hidden gems, skill adjacency</p>
      </div>

      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${modeColor(m)}`}
          >
            <m.icon className="h-3 w-3" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Mode panels */}
      {mode === "FILTER" && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Branch</label>
                <select className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm" value={branch} onChange={e => setBranch(e.target.value)}>
                  {BRANCHES.map(b => <option key={b} value={b}>{b || "All branches"}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Semester</label>
                <select className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm" value={semester} onChange={e => setSemester(e.target.value)}>
                  <option value="">Any</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Min CGPA</label>
                <Input type="number" min="0" max="10" step="0.1" value={minCgpa} onChange={e => setMinCgpa(e.target.value)} placeholder="e.g. 7.5" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Min Placement Score</label>
                <Input type="number" min="0" max="100" value={minScore} onChange={e => setMinScore(e.target.value)} placeholder="e.g. 60" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Skills (comma-sep)</label>
                <Input value={skills} onChange={e => setSkills(e.target.value)} placeholder="Python, React" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === "NL" && (
        <Card className="border-violet-200">
          <CardHeader><CardTitle className="text-sm text-violet-700">Natural Language Search</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && aiSearch(aiQuery)}
                placeholder='e.g. "Final-year CSE students with React + Node.js, CGPA above 7.5, open to Bengaluru"'
                className="flex-1"
              />
              <Button onClick={() => aiSearch(aiQuery)} disabled={aiSearching || !aiQuery} className="bg-violet-600 hover:bg-violet-700 gap-2">
                {aiSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
            </div>
            {aiResult && <p className="text-xs text-violet-600 mt-2 italic">{aiResult.interpretation}</p>}
          </CardContent>
        </Card>
      )}

      {mode === "JD_MATCH" && (
        <Card className="border-blue-200">
          <CardHeader><CardTitle className="text-sm text-blue-700">Semantic JD-to-Candidate Matching</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full min-h-[120px] rounded-md border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste your full job description here — AI finds candidates who semantically match even if they don't use the exact same keywords."
            />
            <Button onClick={() => jdMatch(jdText)} disabled={jdMatching || !jdText} className="bg-blue-600 hover:bg-blue-700 gap-2">
              {jdMatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Find Matching Candidates
            </Button>
          </CardContent>
        </Card>
      )}

      {mode === "LOOK_ALIKE" && (
        <Card className="border-amber-200">
          <CardHeader><CardTitle className="text-sm text-amber-700">Look-Alike Search</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-stone-500 mb-3">Found a great candidate? Enter their USN to surface students with comparable profiles, skills, and trajectories.</p>
            <div className="flex gap-2">
              <Input value={lookAlikeUsn} onChange={e => setLookAlikeUsn(e.target.value)} placeholder="e.g. 1RV21CS047" className="flex-1" />
              <Button onClick={() => lookAlike(lookAlikeUsn)} disabled={lookAliking || !lookAlikeUsn} className="bg-amber-600 hover:bg-amber-700 gap-2">
                {lookAliking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users2 className="h-4 w-4" />}
                Find Similar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === "HIDDEN_GEMS" && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-sm text-green-700">Hidden Gem Finder</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-stone-500 mb-3">
              Surfaces high-potential candidates who don&apos;t pass obvious CGPA filters but have strong signals — top aptitude scores, exceptional GitHub activity, hackathon wins, or fast skill growth.
            </p>
            <Button onClick={() => findGems(candidateFilter)} disabled={findingGems} className="bg-green-600 hover:bg-green-700 gap-2">
              {findingGems ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Find Hidden Gems
            </Button>
          </CardContent>
        </Card>
      )}

      {mode === "SKILL_ADJACENCY" && (
        <Card className="border-rose-200">
          <CardHeader><CardTitle className="text-sm text-rose-700">Skill Adjacency Search</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-stone-500 mb-3">Pool too small for your target skill? AI surfaces candidates with adjacent skills who can ramp up within weeks — with estimated time-to-productivity.</p>
            <div className="flex gap-2">
              <Input value={targetSkill} onChange={e => setTargetSkill(e.target.value)} placeholder='e.g. "React", "Go", "Rust", "FPGA"' className="flex-1" />
              <Button onClick={() => adjacencySearch({ targetSkill })} disabled={adjacencySearching || !targetSkill} className="bg-rose-600 hover:bg-rose-700 gap-2">
                {adjacencySearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div>
        <p className="text-sm text-stone-500 mb-3">
          {isLoading ? "Searching…" : `${displayItems.length} candidate${displayItems.length !== 1 ? "s" : ""} found`}
        </p>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {displayItems.map(({ candidate: c, extra }) => (
              <CandidateCard key={c.studentId} c={c} extra={extra} />
            ))}
            {displayItems.length === 0 && mode !== "FILTER" && (
              <p className="text-stone-400 text-sm col-span-2 text-center py-8">Use the search above to find candidates.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
