'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/shell';
import { getNaacDashboard, generateSsrParagraph } from './repository';
import type { NaacDashboard, CriterionResult, SsrParagraph } from './types';
import { GRADE_COLORS } from './types';

function GradeBadge({ grade, large }: { grade: string; large?: boolean }) {
  const c = GRADE_COLORS[grade] ?? GRADE_COLORS['C'];
  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded-lg border-2 ${large ? 'text-4xl px-5 py-3' : 'text-sm px-3 py-1'}`}
      style={{ background: c?.bg, color: c?.text, borderColor: c?.border }}
    >
      {grade}
    </span>
  );
}

function ScoreArc({ cgpa }: { cgpa: number }) {
  const pct = (cgpa / 4.0) * 100;
  const color =
    cgpa >= 3.51 ? '#1D4A2F' :
    cgpa >= 3.26 ? '#3D6B4F' :
    cgpa >= 3.01 ? '#2F567A' :
    '#8B6914';
  return (
    <svg width="140" height="80" viewBox="0 0 140 80">
      <path d="M 14 70 A 56 56 0 0 1 126 70" fill="none" stroke="#E5E0D8" strokeWidth="10" strokeLinecap="round" />
      <path
        d="M 14 70 A 56 56 0 0 1 126 70"
        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * 175} 175`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    </svg>
  );
}

function CriterionCard({
  criterion,
  onGenerateSsr,
  generatingId,
}: {
  criterion: CriterionResult;
  onGenerateSsr: (id: string) => void;
  generatingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const color =
    criterion.scorePercent >= 80 ? '#3D6B4F' :
    criterion.scorePercent >= 65 ? '#8B6914' :
    '#8B2F2F';
  const bg =
    criterion.scorePercent >= 80 ? '#EBF3EE' :
    criterion.scorePercent >= 65 ? '#FFF3CD' :
    '#F5E6E6';

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#FAF8F6] transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: bg, color }}
        >
          {criterion.criterionId}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[#1a1a1a] text-sm">{criterion.criterionName}</div>
          <div className="text-xs text-[#6B6358] mt-0.5">Weightage: {criterion.weightage} marks</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold" style={{ color }}>{criterion.scorePercent.toFixed(1)}%</div>
          <div className="text-xs text-[#A89F94]">{criterion.earnedScore}/{criterion.maxScore} pts</div>
        </div>
        <div className="w-24 flex-shrink-0">
          <div className="h-2 bg-[#F0EDE8] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${criterion.scorePercent}%`, backgroundColor: color }}
            />
          </div>
          <div className="text-xs text-[#6B6358] mt-1">CGPA: {criterion.cgpaContribution.toFixed(2)}</div>
        </div>
        <div className="text-[#C5BFB5] text-sm">{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div className="border-t border-[#F0EDE8] px-5 py-4 bg-[#FAFAF8]">
          {criterion.metrics.length > 0 && (
            <div className="space-y-3 mb-4">
              {criterion.metrics.map(m => (
                <div key={m.metricId} className="flex items-start gap-3 text-sm">
                  <span className="text-xs font-mono text-[#6B6358] w-10 flex-shrink-0 pt-0.5">{m.metricId}</span>
                  <div className="flex-1">
                    <div className="text-[#1a1a1a] font-medium">{m.metricName}</div>
                    {m.edaiNote && (
                      <div className="text-xs text-[#2F567A] bg-[#E6EEF5] px-2 py-1 rounded mt-1">
                        ✦ {m.edaiNote}
                      </div>
                    )}
                    {m.status === 'AUTO' && m.data && (
                      <div className="text-xs text-[#6B6358] mt-1 flex flex-wrap gap-3">
                        {Object.entries(m.data).slice(0, 4).map(([k, v]) => (
                          <span key={k}>
                            <span className="text-[#A89F94]">{k.replace(/_/g, ' ')}: </span>
                            <span className="font-medium text-[#3D3530]">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {m.status === 'AUTO' && m.earnedScore !== null ? (
                      <span className="text-xs font-medium text-[#3D6B4F]">{m.earnedScore}/{m.maxScore}</span>
                    ) : m.status === 'MANUAL_REQUIRED' ? (
                      <span className="text-xs text-[#8B6914] bg-[#FFF3CD] px-2 py-0.5 rounded-full">Manual</span>
                    ) : m.status === 'AUTO' ? (
                      <span className="text-xs text-[#6B6358]">Auto</span>
                    ) : (
                      <span className="text-xs text-[#8B2F2F]">Error</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onGenerateSsr(criterion.criterionId); }}
            disabled={generatingId === criterion.criterionId}
            className="text-sm px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingId === criterion.criterionId ? '✦ Writing SSR paragraph...' : '✦ Generate SSR Paragraph with AI'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function NaacDashboardPage() {
  const [dashboard, setDashboard] = useState<NaacDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [ssrParagraphs, setSsrParagraphs] = useState<Record<string, SsrParagraph>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    getNaacDashboard().then(d => { setDashboard(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleGenerateSsr = async (criterionId: string) => {
    setGeneratingId(criterionId);
    try {
      const para = await generateSsrParagraph(criterionId);
      setSsrParagraphs(prev => ({ ...prev, [criterionId]: para }));
    } finally {
      setGeneratingId(null);
    }
  };

  const copyParagraph = (criterionId: string) => {
    const para = ssrParagraphs[criterionId]?.paragraph;
    if (para) {
      void navigator.clipboard.writeText(para);
      setCopied(criterionId);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const gradeColor = dashboard
    ? (GRADE_COLORS[dashboard.predictedGrade] ?? GRADE_COLORS['C'])
    : GRADE_COLORS['C'];

  return (
    <AppShell title="NAAC Intelligence">
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#6B6358]">Computing NAAC metrics from live data...</p>
          </div>
        </div>
      )}

      {!loading && dashboard && (
        <div className="grid gap-5">
          {/* Hero score card */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Arc + CGPA */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <ScoreArc cgpa={dashboard.predictedCgpa} />
                  <div className="absolute inset-0 flex items-end justify-center pb-1">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#1a1a1a]">{dashboard.predictedCgpa.toFixed(2)}</div>
                      <div className="text-xs text-[#6B6358]">out of 4.00</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-[#6B6358] mb-1 text-center">Predicted Grade</div>
                  <GradeBadge grade={dashboard.predictedGrade} large />
                </div>
              </div>

              {/* Stats grid */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-[#F9F7F4] rounded-xl">
                  <div className="text-xl font-bold text-[#8B6914]">+{dashboard.cgpaGapToNextGrade}</div>
                  <div className="text-xs text-[#6B6358] mt-1">CGPA gap to {dashboard.targetGrade}</div>
                </div>
                <div className="text-center p-3 bg-[#F9F7F4] rounded-xl">
                  <div className="text-xl font-bold text-[#3D6B4F]">{dashboard.autoPopulatedMetrics}</div>
                  <div className="text-xs text-[#6B6358] mt-1">Metrics auto-populated</div>
                </div>
                <div className="text-center p-3 bg-[#F9F7F4] rounded-xl">
                  <div className="text-xl font-bold text-[#8B6914]">{dashboard.manualMetricsRequired}</div>
                  <div className="text-xs text-[#6B6358] mt-1">Require manual input</div>
                </div>
                <div className="text-center p-3 bg-[#F9F7F4] rounded-xl">
                  <div className="text-xl font-bold text-[#2F567A]">7</div>
                  <div className="text-xs text-[#6B6358] mt-1">Criteria tracked</div>
                </div>
              </div>

              {/* Gap banner */}
              {dashboard.cgpaGapToNextGrade > 0 && (
                <div
                  className="lg:w-56 p-4 rounded-xl border-2"
                  style={{ background: gradeColor?.bg, borderColor: gradeColor?.border }}
                >
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: gradeColor?.text }}>
                    Path to {dashboard.targetGrade}
                  </div>
                  <div className="text-sm" style={{ color: gradeColor?.text }}>
                    You need <strong>+{dashboard.cgpaGapToNextGrade} CGPA points</strong>. Focus on Criterion 2 — it carries 350 marks, the most of any criterion.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Criteria list */}
          <div className="space-y-3">
            {dashboard.criteria.map(c => (
              <CriterionCard
                key={c.criterionId}
                criterion={c}
                onGenerateSsr={handleGenerateSsr}
                generatingId={generatingId}
              />
            ))}
          </div>

          {/* SSR output panels */}
          {Object.keys(ssrParagraphs).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#1a1a1a]">AI-Generated SSR Paragraphs</h2>
              {Object.entries(ssrParagraphs).map(([id, ssr]) => (
                <div key={id} className="bg-white border border-[#E5E0D8] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-mono text-[#6B6358]">{ssr.criterionId}</span>
                      <span className="text-sm font-semibold text-[#1a1a1a] ml-2">{ssr.criterionName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#A89F94]">{ssr.wordCount} words</span>
                      <button
                        onClick={() => copyParagraph(id)}
                        className="text-xs px-3 py-1.5 bg-[#EBF3EE] text-[#3D6B4F] rounded-full hover:bg-[#D6E8DC] transition-all"
                      >
                        {copied === id ? '✓ Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() => void handleGenerateSsr(id)}
                        disabled={generatingId === id}
                        className="text-xs px-3 py-1.5 bg-[#E6EEF5] text-[#2F567A] rounded-full hover:bg-[#D0DFF0] transition-all disabled:opacity-50"
                      >
                        {generatingId === id ? 'Regenerating...' : 'Regenerate'}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#2a2a2a] leading-relaxed">{ssr.paragraph}</p>
                  {ssr.dataPointsUsed.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ssr.dataPointsUsed.map(d => (
                        <span key={d} className="text-xs px-2 py-0.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-full text-[#6B6358]">
                          ✦ {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading SSR toast */}
      {generatingId && (
        <div className="fixed bottom-6 right-6 bg-[#1a1a1a] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Claude is writing the SSR paragraph for {generatingId}...</span>
        </div>
      )}
    </AppShell>
  );
}
