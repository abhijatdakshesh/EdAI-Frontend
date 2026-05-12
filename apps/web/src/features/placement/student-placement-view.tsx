'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/shell';
import type { StudentPlacementProfile, CompanyMatch, CompanyType } from './types';
import { STATUS_STYLE, COMPANY_TYPES, MOCK_PROFILE, MOCK_MATCHES } from './types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export default function StudentPlacementView() {
  const { data: session, status } = useSession();
  const usn = session?.user?.id;

  const [profile, setProfile] = useState<StudentPlacementProfile | null>(null);
  const [matches, setMatches] = useState<CompanyMatch[]>([]);
  const [generating, setGenerating] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [companyType, setCompanyType] = useState<CompanyType>('SERVICE');
  const [tab, setTab] = useState<'score' | 'companies' | 'resume'>('score');

  useEffect(() => {
    if (USE_MOCK) { setProfile(MOCK_PROFILE); setMatches(MOCK_MATCHES); return; }
    if (!usn) return;
    fetch(`/api/placement/student/${usn}`).then(r => r.json()).then((d: StudentPlacementProfile) => setProfile(d));
    fetch(`/api/placement/student/${usn}/matches`).then(r => r.json()).then((d: CompanyMatch[]) => setMatches(d));
  }, [usn]);

  const handleGenerateResume = async () => {
    if (!usn) return;
    setGenerating(true);
    setResumeError(null);
    try {
      if (USE_MOCK) { await new Promise(r => setTimeout(r, 2000)); setResumeError('Mock mode: PDF download skipped.'); return; }
      const res = await fetch(`/api/placement/student/${usn}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyType }),
      });
      if (!res.ok) { setResumeError(`Failed to generate resume (${res.status})`); return; }
      const contentType = res.headers.get('Content-Type') ?? '';
      if (!contentType.includes('pdf')) { setResumeError('Server returned an unexpected response.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${usn}_resume_${companyType}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      setResumeError('Failed to generate resume. Please try again.');
    } finally { setGenerating(false); }
  };

  if (status === 'loading') return <AppShell title="Placement"><div className="p-8 text-center text-sm text-text-muted">Loading…</div></AppShell>;
  if (!usn && !USE_MOCK) return <AppShell title="Placement"><div className="p-8 text-center text-sm text-text-muted">Please sign in to view your placement profile.</div></AppShell>;
  if (!profile) return <AppShell title="Placement"><div className="p-8 text-center text-sm text-text-muted">Loading placement profile…</div></AppShell>;

  const statusStyle = STATUS_STYLE[profile.placementStatus] ?? STATUS_STYLE['NEEDS_COACHING'];
  const readinessScore = profile.readinessScore ?? 0;
  const scoreColor = readinessScore >= 75 ? 'text-green-600' : readinessScore >= 50 ? 'text-yellow-600' : 'text-red-600';

  const sb = profile.scoreBreakdown ?? { cgpaPts: 0, attendancePts: 0, backlogPts: 0, trendPts: 0, semesterPts: 0 };
  const breakdown = [
    { label: 'Academic (CGPA)', pts: sb.cgpaPts, max: 35 },
    { label: 'Attendance', pts: sb.attendancePts, max: 25 },
    { label: 'No Backlogs', pts: sb.backlogPts, max: 20 },
    { label: 'Marks Trend', pts: sb.trendPts, max: 10 },
    { label: 'Final Year Bonus', pts: sb.semesterPts, max: 10 },
  ];

  // r20 — restyled to match the cream/espresso AppShell look used across
  // /student/courses, /student/attendance etc. Same border/border-l-4
  // accent palette, KPI rows, label-track type rhythm.
  return (
    <AppShell title="Placement">
      <div className="grid gap-5">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-[#1C1810] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Profile header card */}
        <div className="rounded border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label-track">Placement Profile</p>
              <h1 className="mt-1 text-2xl font-light">{profile.name}</h1>
              <p className="text-sm text-text-muted mt-0.5">{profile.usn} · {profile.department} · Semester {profile.semester}</p>
              <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full border text-xs font-medium ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                {statusStyle.label}
              </div>
            </div>
            <div className="text-right">
              <p className="label-track">Readiness</p>
              <p className={`text-4xl font-light mt-1 ${scoreColor}`}>{readinessScore}<span className="text-base text-text-muted ml-1">/ 100</span></p>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'CGPA', value: (profile.cgpa ?? 0).toFixed(2) + ' / 10', warn: (profile.cgpa ?? 0) < 7 },
            { label: 'Attendance', value: (profile.attendancePct ?? 0) + '%', warn: (profile.attendancePct ?? 0) < 80 },
            { label: 'Backlogs', value: (profile.backlogs ?? 0) === 0 ? 'None' : String(profile.backlogs), warn: (profile.backlogs ?? 0) > 0 },
          ].map((stat) => (
            <div key={stat.label} className={`rounded border-l-4 bg-surface p-4 ${stat.warn ? 'border-l-[#8B6914]' : 'border-l-[#3D6B4F]'}`}>
              <p className="label-track">{stat.label}</p>
              <p className="text-2xl font-light mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {([['score', 'Score Breakdown'], ['companies', 'Matched Companies'], ['resume', 'Generate Resume']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm transition-colors ${tab === t ? 'border-b-2 border-[#1C1810] font-medium' : 'text-text-muted hover:text-text-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'score' && (
          <div className="rounded border border-border bg-surface p-5 grid gap-4">
            <h2 className="label-track">How your score is calculated</h2>
            {breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">{b.label}</span>
                  <span className="font-medium">{b.pts} / {b.max}</span>
                </div>
                <div className="h-2 bg-cream-200 rounded-full">
                  <div
                    className="h-2 bg-[#3D6B4F] rounded-full transition-all"
                    style={{ width: `${(b.pts / b.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {profile.placementStatus !== 'PLACEMENT_READY' && (
              <div className="rounded border border-[#F5EDDB] bg-[#FDF9EE] p-4 mt-2">
                <p className="text-sm font-medium text-[#8B6914]">What to improve:</p>
                <ul className="mt-1 text-sm text-[#8B6914] space-y-1 list-disc pl-5">
                  {profile.cgpa < 7 && <li>Improve CGPA — aim for 7.0+ to qualify for most companies</li>}
                  {profile.attendancePct < 80 && <li>Attendance is {profile.attendancePct}% — companies check this</li>}
                  {profile.backlogs > 0 && <li>Clear your {profile.backlogs} backlog subject(s) — most companies require 0 backlogs</li>}
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === 'companies' && (
          <div className="grid gap-3">
            {matches.length === 0 && (
              <p className="rounded border border-dashed border-border p-10 text-center text-sm text-text-muted">
                No company matches yet.
              </p>
            )}
            {matches.map((m, i) => (
              <div key={i} className="rounded border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{m.companyName}</p>
                    <p className="text-xs text-text-muted">{m.roleOffered} · {m.ctcLpa} LPA · {m.companyType}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-light ${m.fitScore >= 75 ? 'text-[#3D6B4F]' : m.fitScore >= 50 ? 'text-[#8B6914]' : 'text-[#8B2F2F]'}`}>{m.fitScore}%</p>
                    <p className="text-xs text-text-muted">Fit score</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mt-3 italic">&ldquo;{m.claudeRationale}&rdquo;</p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-text-muted">
                  <span>Offer probability: <b className="text-text-primary">{m.predictionPct}%</b></span>
                  {m.driveDate && <span>Drive: <b className="text-text-primary">{new Date(m.driveDate).toLocaleDateString('en-IN')}</b></span>}
                  {m.requiredSkills?.length > 0 && <span>Skills: {m.requiredSkills.join(', ')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'resume' && (
          <div className="rounded border border-border bg-surface p-5">
            <p className="label-track">AI Resume Generator</p>
            <h2 className="mt-1 text-lg font-medium">Generate a tailored resume</h2>
            <p className="text-sm text-text-muted mt-1 mb-5">Claude writes a professional resume using your real academic data.</p>
            <p className="label-track mb-2">Target Company Type</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {COMPANY_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setCompanyType(t)}
                  className={`rounded border px-4 py-2 text-sm transition-colors ${
                    companyType === t
                      ? 'border-[#1C1810] bg-cream-100 font-medium'
                      : 'border-border hover:border-[#1C1810]'
                  }`}
                >
                  {t === 'PRODUCT' ? 'Product Company' : t === 'SERVICE' ? 'Service Company' : t === 'STARTUP' ? 'Startup' : 'Core Engineering'}
                </button>
              ))}
            </div>
            <button
              onClick={() => void handleGenerateResume()}
              disabled={generating}
              className="w-full rounded bg-[#1C1810] py-2.5 text-sm text-[#F2EFE9] transition-colors hover:bg-[#2C2418] disabled:opacity-50"
            >
              {generating ? 'Claude is writing your resume…' : 'Generate & Download Resume PDF'}
            </button>
            {resumeError && (
              <p className="text-sm text-[#8B2F2F] text-center mt-2">{resumeError}</p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
