'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { StudentPlacementProfile, CompanyMatch, CompanyType } from './types';
import { STATUS_STYLE, COMPANY_TYPES, MOCK_PROFILE, MOCK_MATCHES } from './types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export default function StudentPlacementView() {
  const { data: session } = useSession();
  const usn = session?.user?.id;

  const [profile, setProfile] = useState<StudentPlacementProfile | null>(null);
  const [matches, setMatches] = useState<CompanyMatch[]>([]);
  const [generating, setGenerating] = useState(false);
  const [companyType, setCompanyType] = useState<CompanyType>('SERVICE');
  const [tab, setTab] = useState<'score' | 'companies' | 'resume'>('score');

  useEffect(() => {
    if (!usn && !USE_MOCK) return;
    if (USE_MOCK) { setProfile(MOCK_PROFILE); setMatches(MOCK_MATCHES); return; }
    fetch(`/api/placement/student/${usn}`).then(r => r.json()).then((d: StudentPlacementProfile) => setProfile(d));
    fetch(`/api/placement/student/${usn}/matches`).then(r => r.json()).then((d: CompanyMatch[]) => setMatches(d));
  }, [usn]);

  const handleGenerateResume = async () => {
    setGenerating(true);
    try {
      if (USE_MOCK) { await new Promise(r => setTimeout(r, 2000)); alert('Mock: PDF would download.'); return; }
      const res = await fetch(`/api/placement/student/${usn}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyType }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${usn}_resume_${companyType}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } finally { setGenerating(false); }
  };

  if (!profile) return <div className="p-8 text-center text-gray-400">Loading placement profile...</div>;

  const statusStyle = STATUS_STYLE[profile.placementStatus];
  const scoreColor = profile.readinessScore >= 75 ? 'text-green-600' : profile.readinessScore >= 50 ? 'text-yellow-600' : 'text-red-600';

  const breakdown = [
    { label: 'Academic (CGPA)', pts: profile.scoreBreakdown.cgpaPts, max: 35 },
    { label: 'Attendance', pts: profile.scoreBreakdown.attendancePts, max: 25 },
    { label: 'No Backlogs', pts: profile.scoreBreakdown.backlogPts, max: 20 },
    { label: 'Marks Trend', pts: profile.scoreBreakdown.trendPts, max: 10 },
    { label: 'Final Year Bonus', pts: profile.scoreBreakdown.semesterPts, max: 10 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-gray-500 mt-0.5">{profile.usn} · {profile.department} · Semester {profile.semester}</p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-black ${scoreColor}`}>{profile.readinessScore}</div>
            <div className="text-xs text-gray-400 mt-1">Readiness Score / 100</div>
          </div>
        </div>
        <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full border text-sm font-medium ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
          {statusStyle.label}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5">
          {[
            { label: 'CGPA', value: profile.cgpa.toFixed(1) + ' / 10' },
            { label: 'Attendance', value: profile.attendancePct + '%' },
            { label: 'Backlogs', value: profile.backlogs === 0 ? 'None' : String(profile.backlogs) },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {([['score', 'Score Breakdown'], ['companies', 'Matched Companies'], ['resume', 'Generate Resume']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'score' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">How your score is calculated</h2>
          {breakdown.map(b => (
            <div key={b.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{b.label}</span>
                <span className="font-medium text-gray-900">{b.pts} / {b.max}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${(b.pts / b.max) * 100}%` }} />
              </div>
            </div>
          ))}
          {profile.placementStatus !== 'PLACEMENT_READY' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
              <p className="text-sm font-medium text-yellow-800">What to improve:</p>
              <ul className="mt-1 text-sm text-yellow-700 space-y-1">
                {profile.cgpa < 7 && <li>Improve CGPA — aim for 7.0+ to qualify for most companies</li>}
                {profile.attendancePct < 80 && <li>Attendance is {profile.attendancePct}% — companies check this</li>}
                {profile.backlogs > 0 && <li>Clear your {profile.backlogs} backlog subject(s) — most companies require 0 backlogs</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'companies' && (
        <div className="space-y-3">
          {matches.length === 0 && <p className="text-center text-gray-400 py-12">No company matches yet.</p>}
          {matches.map((m, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{m.companyName}</h3>
                  <p className="text-sm text-gray-500">{m.roleOffered} · {m.ctcLpa} LPA · {m.companyType}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${m.fitScore >= 75 ? 'text-green-600' : m.fitScore >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{m.fitScore}%</div>
                  <div className="text-xs text-gray-400">Fit score</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 italic">&ldquo;{m.claudeRationale}&rdquo;</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span>Offer probability: <b className="text-gray-700">{m.predictionPct}%</b></span>
                {m.driveDate && <span>Drive: <b className="text-gray-700">{new Date(m.driveDate).toLocaleDateString('en-IN')}</b></span>}
                {m.requiredSkills?.length > 0 && <span>Skills: {m.requiredSkills.join(', ')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'resume' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-1">AI Resume Generator</h2>
          <p className="text-sm text-gray-500 mb-6">Claude writes a professional resume using your real academic data.</p>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Company Type</label>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {COMPANY_TYPES.map(t => (
              <button key={t} onClick={() => setCompanyType(t)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${companyType === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {t === 'PRODUCT' ? 'Product Company' : t === 'SERVICE' ? 'Service Company' : t === 'STARTUP' ? 'Startup' : 'Core Engineering'}
              </button>
            ))}
          </div>
          <button onClick={() => void handleGenerateResume()} disabled={generating}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-xl font-medium transition-colors">
            {generating ? 'Claude is writing your resume...' : 'Generate & Download Resume PDF'}
          </button>
        </div>
      )}
    </div>
  );
}
