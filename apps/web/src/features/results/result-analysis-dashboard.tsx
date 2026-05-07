"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Mock data (RVITM Nov 2025 semester results) ────────────────────────────────

const EXAM_LABEL = "Nov 2025 — VTU";
const PUBLISHED_AT = "28 Nov 2025, 03:41 AM";

const BRANCHES = [
  { branch: "CSE", total: 85, passed: 70, passPercent: 82, prev: 78 },
  { branch: "ISE", total: 68, passed: 54, passPercent: 79, prev: 75 },
  { branch: "ECE", total: 72, passed: 55, passPercent: 76, prev: 71 },
  { branch: "EEE", total: 38, passed: 27, passPercent: 71, prev: 68 },
  { branch: "ME",  total: 60, passed: 40, passPercent: 67, prev: 65 },
  { branch: "CV",  total: 48, passed: 36, passPercent: 75, prev: 72 },
];

const TOTAL_STUDENTS = BRANCHES.reduce((s, b) => s + b.total, 0);
const TOTAL_PASSED   = BRANCHES.reduce((s, b) => s + b.passed, 0);
const OVERALL_PCT    = Math.round((TOTAL_PASSED / TOTAL_STUDENTS) * 100);

const SUBJECTS = [
  { code: "21MAT41", name: "Engg. Mathematics IV",    faculty: "Dr. Ramesh Kumar",   dept: "Math", sem: 4, total: 247, passed: 128, pct: 52 },
  { code: "21CS42",  name: "Data Structures",          faculty: "Prof. Sita Devi",    dept: "CSE",  sem: 4, total: 85,  passed: 47,  pct: 55 },
  { code: "21EC41",  name: "Analog Electronics",       faculty: "Prof. Kavita Menon", dept: "ECE",  sem: 4, total: 72,  passed: 58,  pct: 81 },
  { code: "21CS43",  name: "Database Management",      faculty: "Dr. Arjun Rao",      dept: "CSE",  sem: 4, total: 85,  passed: 70,  pct: 82 },
  { code: "21ME41",  name: "Engineering Thermodynamics", faculty: "Prof. Suresh B",   dept: "ME",   sem: 4, total: 60,  passed: 42,  pct: 70 },
  { code: "21CS44",  name: "Operating Systems",         faculty: "Dr. Vikram S",      dept: "CSE",  sem: 4, total: 85,  passed: 68,  pct: 80 },
  { code: "21EE41",  name: "Electrical Machines I",    faculty: "Prof. Lakshmi R",    dept: "EEE",  sem: 4, total: 38,  passed: 28,  pct: 74 },
  { code: "21CS31",  name: "Computer Organization",    faculty: "Dr. Priya Nair",     dept: "CSE",  sem: 3, total: 68,  passed: 60,  pct: 88 },
  { code: "21IS41",  name: "Information Security",     faculty: "Dr. Anand M",        dept: "ISE",  sem: 4, total: 68,  passed: 58,  pct: 85 },
];

const FACULTY_TABLE = [
  { name: "Dr. Arjun Rao",      dept: "CSE",  subjects: 2, avgPass: 82, trend: "up" },
  { name: "Dr. Priya Nair",     dept: "CSE",  subjects: 1, avgPass: 88, trend: "up" },
  { name: "Prof. Kavita Menon", dept: "ECE",  subjects: 2, avgPass: 81, trend: "up" },
  { name: "Dr. Vikram S",       dept: "CSE",  subjects: 1, avgPass: 80, trend: "stable" },
  { name: "Prof. Suresh B",     dept: "ME",   subjects: 1, avgPass: 70, trend: "stable" },
  { name: "Prof. Sita Devi",    dept: "CSE",  subjects: 1, avgPass: 55, trend: "down" },
  { name: "Dr. Ramesh Kumar",   dept: "Math", subjects: 3, avgPass: 52, trend: "down" },
];

const NAMES = [
  "Arjun Kumar","Priya Sharma","Rahul Nair","Divya Menon","Kiran Patil",
  "Sneha Rao","Rohan Verma","Ananya Singh","Vikram Bhat","Leela Reddy",
  "Aditya Joshi","Pooja Iyer","Suresh Naidu","Meena Kulkarni","Ravi Hegde",
  "Shalini Desai","Manish Gupta","Rekha Pillai","Sanjay Nair","Deepa Shetty",
];

const FAILED_STUDENTS = Array.from({ length: 47 }, (_, i) => ({
  usn:      `1RVITM21${String(i + 1).padStart(3, "0")}`,
  name:      NAMES[i % NAMES.length],
  branch:   ["CSE","ISE","ECE","EEE","ME","CV"][i % 6],
  attendance: 55 + (i % 20),
  iaAvg:     7 + (i % 13),
  counselor: i % 5 === 0,
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function pctColor(pct: number) {
  if (pct >= 75) return { bg: "#EBF3EE", text: "#3D6B4F", bar: "#3D6B4F" };
  if (pct >= 60) return { bg: "#F5EDDB", text: "#8B6914", bar: "#8B6914" };
  return { bg: "#F5E6E6", text: "#8B2F2F", bar: "#8B2F2F" };
}

function downloadCSV(rows: typeof FAILED_STUDENTS, subject: (typeof SUBJECTS)[0]) {
  const header = "USN,Student Name,Branch,IA Avg (/25),Attendance %,Counselor Flag";
  const lines = rows.map(r =>
    `${r.usn},"${r.name}",${r.branch},${r.iaAvg},${r.attendance}%,${r.counselor ? "Yes" : "No"}`
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `failed_students_${subject.code}.csv`;
  a.click();
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className={cn("rounded border-l-4 bg-surface p-4", warn ? "border-l-[#8B2F2F]" : "border-l-[#3D6B4F]")}>
      <p className="label-track text-xs">{label}</p>
      <p className="text-3xl font-light mt-1">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function SubjectHeatCard({
  subject,
  selected,
  onClick,
}: {
  subject: (typeof SUBJECTS)[0];
  selected: boolean;
  onClick: () => void;
}) {
  const c = pctColor(subject.pct);
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded border p-3 text-left transition-all",
        selected ? "ring-2 ring-[#1C1810]" : "hover:border-[#1C1810]"
      )}
      style={{ background: c.bg, borderColor: selected ? "#1C1810" : c.bar + "40" }}
    >
      <p className="font-mono text-[10px] text-text-muted">{subject.code}</p>
      <p className="text-xs font-medium mt-0.5 leading-tight" style={{ color: c.text }}>{subject.name}</p>
      <p className="text-2xl font-light mt-2" style={{ color: c.text }}>{subject.pct}%</p>
      <p className="text-[10px] text-text-muted mt-0.5">{subject.total - subject.passed} failed · {subject.faculty}</p>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ResultAnalysisDashboard() {
  const [selectedSubject, setSelectedSubject] = useState<(typeof SUBJECTS)[0] | null>(null);
  const [campaignSent, setCampaignSent] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [showFaculty, setShowFaculty] = useState(false);

  function handleCampaign() {
    setCampaignSent(true);
    setTimeout(() => setCampaignSent(false), 4000);
  }

  async function handleGenerateReport() {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1800));
    setGenerating(false);
    setReportReady(true);
  }

  function downloadReport() {
    const lines = [
      "RVITM MANAGEMENT RESULT ANALYSIS REPORT",
      `Exam: ${EXAM_LABEL}  |  Published: ${PUBLISHED_AT}`,
      "",
      "EXECUTIVE SUMMARY",
      `Overall Pass Percentage: ${OVERALL_PCT}%  (${TOTAL_PASSED}/${TOTAL_STUDENTS} students)`,
      "",
      "BRANCH-WISE PERFORMANCE",
      ...BRANCHES.map(b => `  ${b.branch}: ${b.passPercent}%  (prev year: ${b.prev}%)`),
      "",
      "SUBJECTS REQUIRING INTERVENTION (< 60% pass)",
      ...SUBJECTS.filter(s => s.pct < 60).map(s =>
        `  ${s.code} — ${s.name}: ${s.pct}%  Faculty: ${s.faculty}`
      ),
      "",
      "FACULTY PERFORMANCE",
      ...FACULTY_TABLE.map(f => `  ${f.name} (${f.dept}): ${f.avgPass}% avg pass rate`),
      "",
      "RECOMMENDED ACTIONS",
      "1. Immediately enroll 47 failed students (Engg Mathematics IV) in re-exam coaching.",
      "2. Schedule faculty counselling session for Dr. Ramesh Kumar and Prof. Sita Devi.",
      "3. Trigger parent voice calls (Kannada/Hindi) for all 119 failed students.",
      "4. Pre-compute Criterion 2.6 (Student Learning Outcomes) for NAAC SSR.",
      "",
      "This report was generated automatically by Ed8AI on behalf of RVITM IQAC.",
      "Ed8AI — AI ERP for Indian Higher Education | ed8ai.in",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `RVITM_Result_Analysis_${EXAM_LABEL.replace(/\s/g, "_")}.txt`;
    a.click();
  }

  const failedSubjects = SUBJECTS.filter((s) => s.pct < 60);

  return (
    <AppShell title="Result Analysis">
      <div className="grid gap-5">

        {/* Published banner */}
        <div className="rounded border border-[#2F567A] bg-[#E6EEF5] px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-medium text-[#2F567A] text-sm">VTU Results Published — {EXAM_LABEL}</p>
            <p className="text-xs text-[#2F567A]/70">{PUBLISHED_AT} · Analysis computed automatically by Ed8AI</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFaculty((v) => !v)}
            >
              {showFaculty ? "Hide" : "Show"} Faculty View
            </Button>
            {reportReady ? (
              <Button size="sm" onClick={downloadReport}>
                Download Report PDF
              </Button>
            ) : (
              <Button size="sm" onClick={() => void handleGenerateReport()} disabled={generating}>
                {generating ? "Generating 14-page Report…" : "Generate Management Report"}
              </Button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard label="Overall Pass %" value={`${OVERALL_PCT}%`} sub={`${TOTAL_PASSED}/${TOTAL_STUDENTS} students`} />
          <KPICard label="Students Appeared" value={String(TOTAL_STUDENTS)} sub={EXAM_LABEL} />
          <KPICard label="Failed Students" value={String(TOTAL_STUDENTS - TOTAL_PASSED)} warn sub="Need re-exam / coaching" />
          <KPICard label="Subjects Below 60%" value={String(failedSubjects.length)} warn sub="Require immediate action" />
        </div>

        {/* Branch breakdown */}
        <div>
          <p className="label-track mb-2">Branch-Wise Performance — Year-on-Year</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {BRANCHES.map((b) => {
              const c = pctColor(b.passPercent);
              const delta = b.passPercent - b.prev;
              return (
                <div key={b.branch} className="rounded border bg-surface p-3 text-center">
                  <p className="label-track text-xs">{b.branch}</p>
                  <p className="text-3xl font-light mt-1" style={{ color: c.text }}>{b.passPercent}%</p>
                  <p className={cn("text-xs mt-1", delta >= 0 ? "text-[#3D6B4F]" : "text-[#8B2F2F]")}>
                    {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs last year
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">{b.passed}/{b.total}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subject heatmap */}
        <div>
          <p className="label-track mb-2">Subject Heatmap — Click a subject to drill down</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {SUBJECTS.map((s) => (
              <SubjectHeatCard
                key={s.code}
                subject={s}
                selected={selectedSubject?.code === s.code}
                onClick={() => setSelectedSubject(selectedSubject?.code === s.code ? null : s)}
              />
            ))}
          </div>
          {failedSubjects.length > 0 && (
            <p className="text-xs text-[#8B2F2F] mt-2">
              ⚠ {failedSubjects.length} subject(s) below 60%: {failedSubjects.map((s) => s.name).join(", ")}
            </p>
          )}
        </div>

        {/* Drill-down: failed students in selected subject */}
        {selectedSubject && (
          <div className="rounded border border-[#8B2F2F]/30 bg-[#FFF8F8] p-4 grid gap-3">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium text-[#8B2F2F]">
                  {selectedSubject.name} — {selectedSubject.pct}% pass rate
                </p>
                <p className="text-xs text-text-muted">
                  {selectedSubject.total - selectedSubject.passed} students failed ·
                  Faculty: {selectedSubject.faculty} · Dept: {selectedSubject.dept}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadCSV(FAILED_STUDENTS.slice(0, selectedSubject.total - selectedSubject.passed), selectedSubject)}
                >
                  Export Student List
                </Button>
                <Button
                  size="sm"
                  onClick={handleCampaign}
                  className={campaignSent ? "bg-[#3D6B4F]" : ""}
                >
                  {campaignSent
                    ? "✓ Campaign Triggered — Calls + WhatsApp Queued"
                    : "Trigger Re-exam Coaching Campaign"}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm">
                <thead className="bg-cream-200">
                  <tr>
                    {["#", "USN", "Name", "Branch", "Attendance %", "IA Avg /25", "Risk"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left label-track text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FAILED_STUDENTS.slice(0, selectedSubject.total - selectedSubject.passed).map((s, i) => (
                    <tr key={s.usn} className="border-t border-border even:bg-cream-50">
                      <td className="px-3 py-1.5 text-text-muted text-xs">{i + 1}</td>
                      <td className="px-3 py-1.5 font-mono text-xs">{s.usn}</td>
                      <td className="px-3 py-1.5 font-medium text-xs">{s.name}</td>
                      <td className="px-3 py-1.5 text-xs">{s.branch}</td>
                      <td className={cn("px-3 py-1.5 text-xs font-medium", s.attendance < 65 ? "text-[#8B2F2F]" : "text-text-primary")}>
                        {s.attendance}%
                      </td>
                      <td className={cn("px-3 py-1.5 text-xs font-medium", s.iaAvg < 10 ? "text-[#8B2F2F]" : "text-text-primary")}>
                        {s.iaAvg}
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium",
                          s.counselor ? "bg-[#F5E6E6] text-[#8B2F2F]" : "bg-[#F5EDDB] text-[#8B6914]")}>
                          {s.counselor ? "High" : "Medium"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {campaignSent && (
              <div className="rounded bg-[#EBF3EE] border border-[#3D6B4F]/30 px-4 py-3">
                <p className="text-sm font-medium text-[#3D6B4F]">
                  ✓ Re-exam coaching campaign launched for {selectedSubject.total - selectedSubject.passed} students
                </p>
                <p className="text-xs text-[#3D6B4F]/70 mt-0.5">
                  Voice calls queued in Kannada/Hindi · WhatsApp messages sent · Parents notified · Coaching dates booked
                </p>
              </div>
            )}
          </div>
        )}

        {/* Faculty performance */}
        {showFaculty && (
          <div>
            <p className="label-track mb-2">Faculty Pass Rate — HOD Performance View</p>
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm">
                <thead className="bg-cream-200">
                  <tr>
                    {["Faculty", "Dept", "Subjects", "Avg Pass %", "Trend"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left label-track text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FACULTY_TABLE.sort((a, b) => b.avgPass - a.avgPass).map((f) => {
                    const c = pctColor(f.avgPass);
                    return (
                      <tr key={f.name} className="border-t border-border even:bg-cream-50">
                        <td className="px-4 py-2 font-medium">{f.name}</td>
                        <td className="px-4 py-2 text-text-muted">{f.dept}</td>
                        <td className="px-4 py-2 text-center">{f.subjects}</td>
                        <td className="px-4 py-2 font-bold" style={{ color: c.text }}>{f.avgPass}%</td>
                        <td className="px-4 py-2">
                          <span className={cn("text-xs font-medium",
                            f.trend === "up" ? "text-[#3D6B4F]" : f.trend === "down" ? "text-[#8B2F2F]" : "text-text-muted")}>
                            {f.trend === "up" ? "↑ Improving" : f.trend === "down" ? "↓ Declining" : "→ Stable"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report ready banner */}
        {reportReady && (
          <div className="rounded border border-[#3D6B4F] bg-[#EBF3EE] px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium text-[#3D6B4F] text-sm">Management Report Ready (14 pages)</p>
              <p className="text-xs text-[#3D6B4F]/70">
                Includes: executive summary, branch analytics, subject heatmap, faculty performance, re-exam plan, NAAC Criterion 2.6 pre-computation
              </p>
            </div>
            <Button size="sm" onClick={downloadReport}>
              Download Report
            </Button>
          </div>
        )}

      </div>
    </AppShell>
  );
}
