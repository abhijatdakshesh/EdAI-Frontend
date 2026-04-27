'use client';

import { useState, useEffect } from 'react';
import { getAtRiskStudents, getRiskSummary } from './repository';
import { RiskScore, RiskSummary, RiskLevel, RISK_COLORS } from './types';

const DEPARTMENTS = ['All', 'CSE', 'ECE', 'ME', 'CV', 'ISE', 'EEE'];
const SEMESTERS = ['All', '1', '2', '3', '4', '5', '6', '7', '8'];
const RISK_LEVELS = [
  { label: 'All Risk Levels', value: '' },
  { label: 'Critical Only',   value: 'CRITICAL' },
  { label: 'High & Critical', value: 'HIGH' },
  { label: 'Medium & Above',  value: 'MEDIUM' },
];

function RiskBadge({ level, score }: { level: RiskLevel; score: number }) {
  const c = RISK_COLORS[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.bar }} />
      {score} · {level}
    </span>
  );
}

function ScoreBar({ score, label, max = 45, color }: { score: number; label: string; max?: number; color: string }) {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 text-xs text-[#6B6358] text-right">{label}</div>
      <div className="flex-1 h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="w-8 text-xs text-[#3D3530] text-right font-medium">{score}</div>
    </div>
  );
}

export default function RiskDashboard() {
  const [students, setStudents] = useState<RiskScore[]>([]);
  const [summary, setSummary] = useState<RiskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('All');
  const [semester, setSemester] = useState('All');
  const [riskFilter, setRiskFilter] = useState('');
  const [expandedUsn, setExpandedUsn] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([getRiskSummary(), getAtRiskStudents({ minScore: 26 })]).then(([s, r]) => {
      setSummary(s);
      setStudents(r);
      setLoading(false);
    });
  }, []);

  const filtered = students.filter(s => {
    if (department !== 'All' && s.department !== department) return false;
    if (semester !== 'All' && s.semester !== parseInt(semester, 10)) return false;
    if (riskFilter === 'CRITICAL' && s.riskLevel !== 'CRITICAL') return false;
    if (riskFilter === 'HIGH' && !['HIGH', 'CRITICAL'].includes(s.riskLevel)) return false;
    if (riskFilter === 'MEDIUM' && s.riskLevel === 'LOW') return false;
    return true;
  });

  const totalCritical = summary.reduce((a, b) => a + b.critical, 0);
  const totalHigh = summary.reduce((a, b) => a + b.high, 0);
  const totalStudents = summary.reduce((a, b) => a + b.total, 0);
  const avgScore = summary.length
    ? (summary.reduce((a, b) => a + b.avgRiskScore, 0) / summary.length).toFixed(1)
    : '–';

  return (
    <div className="min-h-screen bg-[#F9F7F4] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1a1a1a] tracking-tight">Student Risk Tracker</h1>
        <p className="text-sm text-[#6B6358] mt-1">
          Real-time dropout and failure risk based on attendance, marks, fees, and trends.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Critical Risk',   value: totalCritical, color: '#8B2F2F', bg: '#F5E6E6', desc: 'Immediate action needed' },
          { label: 'High Risk',       value: totalHigh,     color: '#8B6914', bg: '#FFF3CD', desc: 'Coordinator review' },
          { label: 'Total Students',  value: totalStudents, color: '#2F567A', bg: '#E6EEF5', desc: 'Across all departments' },
          { label: 'Dept Avg Score',  value: avgScore,      color: '#3D6B4F', bg: '#EBF3EE', desc: 'Lower is better' },
        ].map(card => (
          <div key={card.label} className="bg-white border border-[#E5E0D8] rounded-xl p-4">
            <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
            <div className="text-sm font-medium text-[#1a1a1a] mt-0.5">{card.label}</div>
            <div className="text-xs text-[#A89F94] mt-0.5">{card.desc}</div>
          </div>
        ))}
      </div>

      {/* Department breakdown */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#1a1a1a] mb-4">Department Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Department', 'Total', 'Critical', 'High', 'Medium', 'Low', 'Avg Risk'].map(h => (
                  <th key={h} className="text-left pb-2 pr-6 text-xs font-medium text-[#6B6358] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map(d => (
                <tr key={d.department} className="border-t border-[#F0EDE8]">
                  <td className="py-2.5 pr-6 font-medium text-[#1a1a1a]">{d.department}</td>
                  <td className="py-2.5 pr-6 text-[#3D3530]">{d.total}</td>
                  <td className="py-2.5 pr-6"><span className="text-[#8B2F2F] font-semibold">{d.critical}</span></td>
                  <td className="py-2.5 pr-6"><span className="text-[#8B6914] font-semibold">{d.high}</span></td>
                  <td className="py-2.5 pr-6 text-[#3D3530]">{d.medium}</td>
                  <td className="py-2.5 pr-6 text-[#3D6B4F]">{d.low}</td>
                  <td className="py-2.5 pr-6">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${d.avgRiskScore}%`,
                            backgroundColor: d.avgRiskScore >= 50 ? '#C0392B' : d.avgRiskScore >= 30 ? '#E67E22' : '#27AE60',
                          }}
                        />
                      </div>
                      <span className="text-xs text-[#3D3530]">{d.avgRiskScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={department} onChange={e => setDepartment(e.target.value)}
          className="text-sm px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-[#3D3530] outline-none focus:border-[#1a1a1a]">
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={semester} onChange={e => setSemester(e.target.value)}
          className="text-sm px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-[#3D3530] outline-none focus:border-[#1a1a1a]">
          {SEMESTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Semesters' : `Semester ${s}`}</option>)}
        </select>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
          className="text-sm px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-[#3D3530] outline-none focus:border-[#1a1a1a]">
          {RISK_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <div className="ml-auto text-sm text-[#6B6358] self-center">
          {filtered.length} student{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Student table */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-[#A89F94]">Loading risk scores...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#A89F94]">No students match the current filters.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F7F4] border-b border-[#E5E0D8]">
                {['Student', 'Department', 'Risk Score', 'Attendance', 'Failing Subjects', 'Fee Status', 'Trend'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[#6B6358] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <>
                  <tr
                    key={s.studentUsn}
                    className="border-b border-[#F0EDE8] hover:bg-[#FAF8F6] cursor-pointer transition-colors"
                    onClick={() => setExpandedUsn(expandedUsn === s.studentUsn ? null : s.studentUsn)}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#1a1a1a]">{s.name}</div>
                      <div className="text-xs text-[#A89F94]">{s.studentUsn}</div>
                    </td>
                    <td className="px-5 py-3 text-[#3D3530]">{s.department} · Sem {s.semester}{s.section}</td>
                    <td className="px-5 py-3">
                      <RiskBadge level={s.riskLevel} score={s.riskScore} />
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold ${s.attendancePct < 60 ? 'text-[#8B2F2F]' : s.attendancePct < 75 ? 'text-[#8B6914]' : 'text-[#3D6B4F]'}`}>
                        {s.attendancePct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {s.failingSubjectCount > 0 ? (
                        <span className="text-[#8B2F2F] font-medium">{s.failingSubjectCount} subject{s.failingSubjectCount > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-[#3D6B4F]">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.feeStatus === 'OVERDUE' ? 'bg-[#F5E6E6] text-[#8B2F2F]' :
                        s.feeStatus === 'PARTIAL' ? 'bg-[#FFF3CD] text-[#8B6914]' :
                        s.feeStatus === 'PENDING' ? 'bg-[#F5EDDB] text-[#8B6914]' :
                        'bg-[#EBF3EE] text-[#3D6B4F]'
                      }`}>
                        {s.feeStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${s.attTrendDelta < -10 ? 'text-[#8B2F2F]' : s.attTrendDelta < 0 ? 'text-[#8B6914]' : 'text-[#3D6B4F]'}`}>
                        {s.attTrendDelta > 0 ? '↑' : s.attTrendDelta < 0 ? '↓' : '→'} {Math.abs(s.attTrendDelta).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                  {expandedUsn === s.studentUsn && (
                    <tr key={`${s.studentUsn}-expanded`} className="bg-[#FAF8F6] border-b border-[#E5E0D8]">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="max-w-md">
                          <p className="text-xs font-semibold text-[#6B6358] uppercase tracking-wider mb-3">Score Breakdown</p>
                          <div className="space-y-2">
                            <ScoreBar score={s.breakdown.attendanceScore} label="Attendance" max={45} color={RISK_COLORS[s.riskLevel].bar} />
                            <ScoreBar score={s.breakdown.marksScore}     label="Marks"      max={36} color={RISK_COLORS[s.riskLevel].bar} />
                            <ScoreBar score={s.breakdown.feeScore}       label="Fee"        max={20} color={RISK_COLORS[s.riskLevel].bar} />
                            <ScoreBar score={s.breakdown.trendScore}     label="Trend"      max={12} color={RISK_COLORS[s.riskLevel].bar} />
                          </div>
                          <p className="text-xs text-[#A89F94] mt-3">
                            Total: {s.riskScore}/100 · Updated {new Date(s.computedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
