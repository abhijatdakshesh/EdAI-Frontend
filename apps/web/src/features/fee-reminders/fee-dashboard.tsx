'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  getFeeDashboardSummary,
  getOutstandingFees,
  getReminderHistory,
  triggerManualCall,
} from './repository';
import {
  FeeRiskRow,
  FeeDashboardSummary,
  ReminderRecord,
  FEE_RISK_COLORS,
  FeeRiskLevel,
} from './types';

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

const DEPTS = ['All', 'CSE', 'ECE', 'ME', 'CV', 'ISE', 'EEE'];

const REMINDER_LABELS: Record<string, string> = {
  WHATSAPP_10D: 'WhatsApp (10 days)',
  CALL_5D:      'Voice Call (5 days)',
  CALL_1D:      'Voice Call (1 day)',
  SMS_2D:       'SMS (2 days)',
  MANUAL_CALL:  'Manual Call',
  OVERDUE_CALL: 'Overdue Call',
};

const REMINDER_CHAIN_STEPS = [
  { label: 'Day 10', action: 'WhatsApp', risk: 'HIGH',   color: '#E6EEF5' },
  { label: 'Day 5',  action: 'Voice Call', risk: 'HIGH', color: '#FFF3CD' },
  { label: 'Day 1',  action: 'Voice Call', risk: 'HIGH', color: '#F5E6E6' },
  { label: 'Day 5',  action: 'WhatsApp', risk: 'MEDIUM', color: '#E6EEF5' },
  { label: 'Day 2',  action: 'SMS', risk: 'LOW',         color: '#EBF3EE' },
];

function RiskBadge({ level, score }: { level: FeeRiskLevel; score: number }) {
  const c = FEE_RISK_COLORS[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {score} · {level}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'ANSWERED' || status === 'DELIVERED' ? 'bg-[#27AE60]' :
    status === 'FAILED' ? 'bg-[#C0392B]' : 'bg-[#F39C12]';
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
}

export default function FeeDashboard() {
  const [summary, setSummary] = useState<FeeDashboardSummary | null>(null);
  const [fees, setFees] = useState<FeeRiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, ReminderRecord[]>>({});
  const [callingId, setCallingId] = useState<string | null>(null);
  const [callResult, setCallResult] = useState<Record<string, string>>({});

  const loadFees = useCallback(
    async (opts?: { riskLevel?: string; department?: string; overdueOnly?: boolean }) => {
      setLoading(true);
      const f = await getOutstandingFees(opts);
      setFees(f);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    void Promise.all([getFeeDashboardSummary(), getOutstandingFees()]).then(([s, f]) => {
      setSummary(s);
      setFees(f);
      setLoading(false);
    });
  }, []);

  const applyFilters = () => {
    const opts: Parameters<typeof loadFees>[0] = { overdueOnly };
    if (riskFilter) opts.riskLevel = riskFilter;
    if (deptFilter !== 'All') opts.department = deptFilter;
    void loadFees(opts);
  };

  const handleExpand = async (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
    if (!history[id]) {
      const h = await getReminderHistory(id);
      setHistory(prev => ({ ...prev, [id]: h }));
    }
  };

  const handleCallNow = async (fee: FeeRiskRow) => {
    setCallingId(fee.feePaymentId);
    try {
      const res = await triggerManualCall(fee.feePaymentId);
      setCallResult(prev => ({ ...prev, [fee.feePaymentId]: res.message }));
    } catch {
      setCallResult(prev => ({ ...prev, [fee.feePaymentId]: 'Call failed. Check voice service.' }));
    } finally {
      setCallingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Fee Collection Intelligence</h1>
        <p className="text-sm text-text-secondary mt-1">
          AI-predicted default risk · automated WhatsApp, SMS, and voice reminder chains.
        </p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Outstanding',  value: fmt(summary.totalOutstandingAmount), sub: `${summary.totalOutstandingCount} students`,          color: '#2F567A', bg: '#E6EEF5' },
            { label: 'Overdue Now',        value: fmt(summary.overdueAmount),          sub: `${summary.overdueCount} payments`,                   color: '#8B2F2F', bg: '#F5E6E6' },
            { label: 'High Risk',          value: fmt(summary.highRiskAmount),         sub: `${summary.highRiskCount} students likely to default`, color: '#8B6914', bg: '#FFF3CD' },
            { label: 'Predicted At Risk',  value: fmt(summary.predictedAtRiskAmount),  sub: 'May not pay on time',                                color: '#6B2F7A', bg: '#EEE6F5' },
          ].map(c => (
            <div key={c.label} className="bg-surface border border-border rounded-xl p-4">
              <div className="text-xl font-bold" style={{ color: c.color }}>{c.value}</div>
              <div className="text-sm font-medium text-text-primary mt-0.5">{c.label}</div>
              <div className="text-xs text-text-muted mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Reminder chain explainer */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Auto Reminder Chain</p>
        <div className="flex items-center gap-2 flex-wrap text-xs text-text-primary">
          {REMINDER_CHAIN_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg text-xs" style={{ background: step.color }}>
                <span className="font-medium">{step.label}</span>
                <span className="text-text-secondary ml-1">→ {step.action}</span>
                <span className="ml-1 opacity-60">({step.risk})</span>
              </div>
              {i < REMINDER_CHAIN_STEPS.length - 1 && <span className="text-text-muted">·</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          className="text-sm px-3 py-2 bg-surface border border-border rounded-lg text-text-primary outline-none"
        >
          <option value="">All Risk Levels</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="text-sm px-3 py-2 bg-surface border border-border rounded-lg text-text-primary outline-none"
        >
          {DEPTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={e => setOverdueOnly(e.target.checked)}
            className="rounded"
          />
          Overdue only
        </label>
        <button
          onClick={applyFilters}
          className="px-4 py-2 text-sm bg-[#1C1810] text-[#F2EFE9] rounded-lg hover:bg-[#2a2418] transition-colors"
        >
          Apply Filters
        </button>
        <span className="ml-auto text-sm text-text-secondary">{fees.length} records</span>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-text-muted">Loading fee risk data...</div>
        ) : fees.length === 0 ? (
          <div className="p-10 text-center text-sm text-text-muted">No outstanding fees match the current filters.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-200 border-b border-border">
                {['Student', 'Dept', 'Fee Type', 'Balance', 'Due Date', 'Risk', 'Action', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fees.map(fee => (
                <Fragment key={fee.feePaymentId}>
                  <tr
                    className="border-b border-border hover:bg-cream-100 transition-colors"
                  >
                    <td className="px-4 py-3 cursor-pointer" onClick={() => void handleExpand(fee.feePaymentId)}>
                      <div className="font-medium text-text-primary">{fee.studentName}</div>
                      <div className="text-xs text-text-muted">{fee.studentUsn}</div>
                    </td>
                    <td className="px-4 py-3 text-text-primary text-xs">{fee.department} · S{fee.semester}</td>
                    <td className="px-4 py-3 text-text-primary text-xs">{fee.feeType}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{fmt(fee.balance)}</td>
                    <td className="px-4 py-3">
                      <div className={`text-xs font-medium ${fee.daysToDue < 0 ? 'text-[#8B2F2F]' : fee.daysToDue <= 3 ? 'text-[#8B6914]' : 'text-text-primary'}`}>
                        {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-xs text-text-muted">
                        {fee.daysToDue < 0
                          ? `${Math.abs(fee.daysToDue)}d overdue`
                          : `${fee.daysToDue}d left`}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={fee.riskLevel} score={fee.riskScore} />
                    </td>
                    <td className="px-4 py-3">
                      {callResult[fee.feePaymentId] ? (
                        <span className="text-xs text-[#3D6B4F]">✓ Called</span>
                      ) : (
                        <button
                          onClick={() => void handleCallNow(fee)}
                          disabled={callingId === fee.feePaymentId}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            callingId === fee.feePaymentId
                              ? 'bg-cream-200 text-text-muted cursor-not-allowed'
                              : 'bg-[#1C1810] text-[#F2EFE9] hover:bg-[#2a2418]'
                          }`}
                        >
                          {callingId === fee.feePaymentId ? 'Calling…' : '📞 Call Now'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void handleExpand(fee.feePaymentId)}
                        className="text-xs text-text-secondary hover:text-text-primary"
                      >
                        {expandedId === fee.feePaymentId ? '▲' : '▼'}
                      </button>
                    </td>
                  </tr>

                  {expandedId === fee.feePaymentId && (
                    <tr key={`${fee.feePaymentId}-detail`} className="bg-cream-100 border-b border-border">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Risk Breakdown</p>
                            <div className="space-y-1.5 text-xs text-text-primary">
                              <div className="flex justify-between">
                                <span className="text-text-secondary">Late payments (history)</span>
                                <span>{fee.historicalLateCount}/{fee.historicalTotalFees}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-secondary">Attendance</span>
                                <span className={fee.attendancePct < 75 ? 'text-[#8B2F2F] font-medium' : ''}>
                                  {fee.attendancePct.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-secondary">Language</span>
                                <span className="uppercase">{fee.language}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-secondary">Parent phone</span>
                                <span>{fee.parentPhone}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Reminder History</p>
                            {callResult[fee.feePaymentId] && (
                              <p className="text-xs text-[#3D6B4F] mb-2">{callResult[fee.feePaymentId]}</p>
                            )}
                            {(history[fee.feePaymentId] ?? []).length === 0 ? (
                              <p className="text-xs text-text-muted">No reminders sent yet</p>
                            ) : (
                              <div className="space-y-1.5">
                                {(history[fee.feePaymentId] ?? []).map(r => (
                                  <div key={r.id} className="flex items-center gap-2 text-xs">
                                    <StatusDot status={r.status} />
                                    <span className="text-text-primary">{REMINDER_LABELS[r.reminderType] ?? r.reminderType}</span>
                                    <span className="text-text-muted">
                                      {new Date(r.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className={`ml-auto ${r.status === 'ANSWERED' ? 'text-[#3D6B4F]' : r.status === 'FAILED' ? 'text-[#8B2F2F]' : 'text-text-secondary'}`}>
                                      {r.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
