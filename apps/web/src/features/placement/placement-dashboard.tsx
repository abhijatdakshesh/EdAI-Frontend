'use client';

import { useState, useEffect } from 'react';
import type { DepartmentSummary } from './types';
import { MOCK_PROFILE } from './types';

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? 'true') === 'true' || process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const MOCK_SUMMARY: DepartmentSummary[] = [
  { department: 'Computer Science', semester: 8, total: 120, ready: 78, coaching: 32, highRisk: 10, avgScore: 72, avgCgpa: 7.8 },
  { department: 'Information Science', semester: 8, total: 60, ready: 38, coaching: 17, highRisk: 5, avgScore: 68, avgCgpa: 7.4 },
  { department: 'Electronics', semester: 8, total: 60, ready: 31, coaching: 22, highRisk: 7, avgScore: 63, avgCgpa: 7.1 },
  { department: 'Mechanical', semester: 8, total: 60, ready: 22, coaching: 28, highRisk: 10, avgScore: 58, avgCgpa: 6.8 },
];

interface Company {
  id: string;
  name: string;
  role_offered: string;
  ctc_lpa: number;
  company_type: string;
  min_cgpa: number;
  drive_date: string | null;
  matched_students: number;
}

export default function PlacementDashboard() {
  const [summary, setSummary] = useState<DepartmentSummary[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tab, setTab] = useState<'overview' | 'companies' | 'lookup'>('overview');
  const [running, setRunning] = useState<string | null>(null);
  const [searchUsn, setSearchUsn] = useState('');
  const [studentProfile, setStudentProfile] = useState<typeof MOCK_PROFILE | null>(null);

  useEffect(() => {
    if (USE_MOCK) { setSummary(MOCK_SUMMARY); return; }
    fetch('/api/placement/dashboard/summary').then(r => r.json()).then((d: DepartmentSummary[]) => setSummary(d));
    fetch('/api/placement/companies').then(r => r.json()).then((d: Company[]) => setCompanies(d));
  }, []);

  const handleLookup = async () => {
    if (!searchUsn.trim()) return;
    if (USE_MOCK) { setStudentProfile({ ...MOCK_PROFILE, usn: searchUsn }); return; }
    const res = await fetch(`/api/placement/student/${searchUsn}`);
    setStudentProfile(await res.json() as typeof MOCK_PROFILE);
  };

  const handleRunMatching = async (companyId: string) => {
    setRunning(companyId);
    try {
      const res = await fetch(`/api/placement/companies/${companyId}/match`, { method: 'POST' });
      const data = await res.json() as { matched: number };
      alert(`Matched ${data.matched} students.`);
    } finally { setRunning(null); }
  };

  const totals = summary.reduce((acc, d) => ({
    total: acc.total + d.total,
    ready: acc.ready + d.ready,
    coaching: acc.coaching + d.coaching,
    highRisk: acc.highRisk + d.highRisk,
  }), { total: 0, ready: 0, coaching: 0, highRisk: 0 });

  const mockCompanies: Company[] = [
    { id: '1', name: 'Infosys', role_offered: 'Systems Engineer', ctc_lpa: 3.6, company_type: 'SERVICE', min_cgpa: 6.5, drive_date: '2026-05-15', matched_students: 89 },
    { id: '2', name: 'Zoho', role_offered: 'Junior Developer', ctc_lpa: 5.0, company_type: 'PRODUCT', min_cgpa: 7.0, drive_date: '2026-06-01', matched_students: 0 },
  ];

  const displayCompanies = USE_MOCK ? mockCompanies : companies;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Placement Intelligence</h1>
        <p className="text-gray-500 mt-1">AI-powered placement readiness and company matching</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Final Year', value: totals.total, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Placement Ready', value: totals.ready, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Needs Coaching', value: totals.coaching, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'High Risk', value: totals.highRisk, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl border border-gray-200 p-4 shadow-sm`}>
            <div className={`text-3xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {([['overview', 'Department Overview'], ['companies', 'Companies'], ['lookup', 'Student Lookup']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Department', 'Total', 'Ready', 'Coaching', 'High Risk', 'Avg Score', 'Avg CGPA'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {summary.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.department}</td>
                  <td className="px-4 py-3 text-gray-600">{row.total}</td>
                  <td className="px-4 py-3 font-medium text-green-600">{row.ready}</td>
                  <td className="px-4 py-3 text-yellow-600">{row.coaching}</td>
                  <td className="px-4 py-3 text-red-600">{row.highRisk}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${row.avgScore}%` }} />
                      </div>
                      <span className="text-gray-700 font-medium">{row.avgScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.avgCgpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'companies' && (
        <div className="space-y-3">
          {displayCompanies.map(co => (
            <div key={co.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{co.name}</h3>
                <p className="text-sm text-gray-500">{co.role_offered} · {co.ctc_lpa} LPA · Min CGPA {co.min_cgpa} · {co.company_type}</p>
                {co.drive_date && <p className="text-xs text-gray-400 mt-0.5">Drive: {new Date(co.drive_date).toLocaleDateString('en-IN')}</p>}
              </div>
              <div className="flex items-center gap-3">
                {co.matched_students > 0 && (
                  <span className="text-sm text-green-600 font-medium">{co.matched_students} matched</span>
                )}
                <button onClick={() => void handleRunMatching(co.id)} disabled={running === co.id}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
                  {running === co.id ? 'Matching...' : 'Run AI Match'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'lookup' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input type="text" value={searchUsn} onChange={e => setSearchUsn(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && void handleLookup()}
              placeholder="Enter student USN (e.g. 1RV21CS047)"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => void handleLookup()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">
              Look Up
            </button>
          </div>
          {studentProfile && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{studentProfile.name}</h3>
                  <p className="text-gray-500 text-sm">{studentProfile.usn} · {studentProfile.department} · Sem {studentProfile.semester}</p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-black ${studentProfile.readinessScore >= 75 ? 'text-green-600' : studentProfile.readinessScore >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {studentProfile.readinessScore}
                  </div>
                  <div className="text-xs text-gray-400">/ 100</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="font-bold text-gray-900">{studentProfile.cgpa.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">CGPA / 10</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="font-bold text-gray-900">{studentProfile.attendancePct}%</div>
                  <div className="text-xs text-gray-500">Attendance</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className={`font-bold ${studentProfile.backlogs === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {studentProfile.backlogs === 0 ? 'None' : String(studentProfile.backlogs)}
                  </div>
                  <div className="text-xs text-gray-500">Backlogs</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
