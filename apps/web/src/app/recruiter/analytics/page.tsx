"use client";

import { useState } from "react";
import { Loader2, TrendingUp, MessageSquare, BarChart, Send } from "lucide-react";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecruiterAnalytics, useRecruiterNlQuery } from "@/lib/api/recruiter";

const CHART_COLORS = {
  espresso: "#1C1810",
  blue: "#2F567A",
  green: "#3D6B4F",
  amber: "#8B6914",
  red: "#8B2F2F",
  muted: "#9B9489",
};

function ScarcityBar({ skill, demand, supply, scarcityScore }: { skill: string; demand: number; supply: number; scarcityScore: number }) {
  const color = scarcityScore > 35 ? CHART_COLORS.red : scarcityScore > 15 ? CHART_COLORS.amber : CHART_COLORS.green;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-20 shrink-0 text-stone-600 font-medium">{skill}</span>
      <div className="flex-1 relative h-4 bg-stone-100 rounded">
        <div className="absolute left-0 top-0 h-4 rounded bg-stone-200" style={{ width: `${supply}%` }} />
        <div className="absolute left-0 top-0 h-4 rounded" style={{ width: `${Math.min(demand, supply)}%`, background: CHART_COLORS.green, opacity: 0.6 }} />
      </div>
      <span className="w-16 text-right font-semibold shrink-0" style={{ color }}>
        {scarcityScore > 0 ? `−${scarcityScore} scarce` : "Abundant"}
      </span>
    </div>
  );
}

export default function RecruiterAnalyticsPage() {
  const { data: analytics, isLoading } = useRecruiterAnalytics();
  const { mutate: nlQuery, isPending: nlQuerying, data: nlResult } = useRecruiterNlQuery();
  const [nlInput, setNlInput] = useState("");

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>;
  }

  if (!analytics) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Recruiter Analytics</h1>
        <p className="text-stone-500 mt-1">{analytics.period} · AI-powered hiring intelligence</p>
      </div>

      {/* AI Insights */}
      <div className="grid gap-3 sm:grid-cols-2">
        {analytics.aiInsights.map((insight, i) => (
          <div key={i} className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <TrendingUp className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            {insight}
          </div>
        ))}
      </div>

      {/* Hiring Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart className="h-4 w-4" /> Hiring Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <ReBarChart data={analytics.funnel} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D0C9BC" />
              <XAxis dataKey="stage" tick={{ fill: "#6B6358", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6B6358", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#F2EFE9", border: "1px solid #D0C9BC", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {analytics.funnel.map((_, i) => (
                  <Cell key={i} fill={i < 2 ? CHART_COLORS.espresso : i < 4 ? CHART_COLORS.blue : CHART_COLORS.green} />
                ))}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex gap-6 text-xs text-stone-500">
            {analytics.funnel.slice(1).map(s => (
              <span key={s.stage}>{s.stage}: <strong className="text-stone-700">{s.conversionRate}%</strong></span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Source ROI */}
        <Card>
          <CardHeader><CardTitle className="text-base">Source-of-Hire ROI</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <ReBarChart data={analytics.sourceRoi} layout="vertical" margin={{ left: 20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D0C9BC" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6B6358", fontSize: 10 }} />
                <YAxis dataKey="college" type="category" tick={{ fill: "#6B6358", fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ background: "#F2EFE9", border: "1px solid #D0C9BC", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="qualityScore" fill={CHART_COLORS.green} radius={[0, 4, 4, 0]} name="qualityScore" />
                <Bar dataKey="hires" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} name="hires" />
              </ReBarChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {analytics.sourceRoi.map(s => (
                <div key={s.college} className="flex justify-between text-xs text-stone-500">
                  <span>{s.college}</span>
                  <span>₹{s.costPerHire.toLocaleString()} / hire · Quality {s.qualityScore}/100</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skill Demand Heatmap */}
        <Card>
          <CardHeader><CardTitle className="text-base">Skill Scarcity Index</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-stone-400 mb-4">Red = critically scarce, Green = abundant</p>
            <div className="space-y-2.5">
              {analytics.skillDemand
                .sort((a, b) => b.scarcityScore - a.scarcityScore)
                .map(s => <ScarcityBar key={s.skill} {...s} />)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NL Query */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Ask Your Hiring Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={nlInput}
              onChange={e => setNlInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && nlQuery(nlInput)}
              placeholder='e.g. "How many CSE students with CGPA above 8 have we shortlisted?" or "What is our offer-to-join rate?"'
              className="flex-1"
            />
            <Button onClick={() => nlQuery(nlInput)} disabled={nlQuerying || !nlInput} className="gap-2">
              {nlQuerying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Ask
            </Button>
          </div>

          {nlResult && (
            <div className="rounded-lg bg-stone-50 border border-stone-200 p-4 space-y-3">
              <p className="text-sm text-stone-800">{nlResult.answer}</p>
              {nlResult.table && nlResult.table.length > 0 && (
                <div className="overflow-auto">
                  <table className="text-xs w-full border-collapse">
                    <thead>
                      <tr>
                        {Object.keys(nlResult.table[0] ?? {}).map(h => (
                          <th key={h} className="text-left px-2 py-1.5 bg-stone-100 border border-stone-200 font-medium text-stone-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nlResult.table.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-2 py-1.5 border border-stone-200 text-stone-700">{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {["How many CSE students with CGPA > 8 did we shortlist?", "What's our offer-to-join rate this quarter?", "Which college gave us the best hires?"].map(q => (
              <button key={q} onClick={() => { setNlInput(q); nlQuery(q); }} className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded hover:bg-stone-200 transition-colors">
                {q}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
