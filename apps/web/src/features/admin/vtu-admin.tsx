"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useVTUWindows,
  useCreateVTUWindow,
  useVTUPendingStudents,
  useVTUDeptOverview,
  useSendVTUReminders,
  useRunEligibilityCheck,
  type VTUWindow,
} from "@/lib/api/vtu";

// ── Demo eligibility dataset (247 students, 47 flagged) ───────────────────────

const STUDENT_NAMES = [
  "Arjun Kumar","Priya Sharma","Rahul Nair","Divya Menon","Kiran Patil",
  "Sneha Rao","Rohan Verma","Ananya Singh","Vikram Bhat","Leela Reddy",
  "Aditya Joshi","Pooja Iyer","Suresh Naidu","Meena Kulkarni","Ravi Hegde",
  "Shalini Desai","Manish Gupta","Rekha Pillai","Sanjay Nair","Deepa Shetty",
  "Tejas Patil","Kavitha Rao","Mohan Reddy","Sunita Jain","Harish Bhat",
];

type EligibilityFlag = "attendance" | "ia_marks" | "fees" | "backlog";
interface DemoStudent {
  usn: string; name: string; dept: string; sem: number;
  attendance: number; iaAvg: number; feeDue: number; backlogs: number;
  flags: EligibilityFlag[]; parentPhone: string;
}

const DEMO_STUDENTS: DemoStudent[] = Array.from({ length: 247 }, (_, i) => {
  const flagged = i < 47;
  const attendance = flagged ? 58 + (i % 16) : 76 + (i % 20);
  const iaAvg = flagged ? 35 + (i % 14) : 52 + (i % 28);
  const feeDue = flagged && i % 3 === 0 ? 12000 + (i % 3) * 5000 : 0;
  const backlogs = flagged && i % 7 === 0 ? 1 + (i % 3) : 0;
  const flags: EligibilityFlag[] = [];
  if (attendance < 75) flags.push("attendance");
  if (iaAvg < 50) flags.push("ia_marks");
  if (feeDue > 0) flags.push("fees");
  if (backlogs > 0) flags.push("backlog");
  return {
    usn: `1RVITM21${String(i + 1).padStart(3, "0")}`,
    name: STUDENT_NAMES[i % STUDENT_NAMES.length] ?? "Student",
    dept: (["CSE","ISE","ECE","EEE","ME","CV"] as const)[i % 6] ?? "CSE",
    sem: 4 + (i % 4),
    attendance, iaAvg, feeDue, backlogs, flags,
    parentPhone: `+91 98${String(40000000 + i * 31).slice(0, 8)}`,
  };
});

const CONDONATION_TEMPLATE = (s: DemoStudent) =>
`The Principal,
RV Institute of Technology and Management, Bengaluru.

Subject: Application for Attendance Condonation — ${s.name} (${s.usn})

Respected Sir/Madam,

I, ${s.name}, student of ${s.dept} Sem ${s.sem} (USN: ${s.usn}), respectfully request
condonation of shortage in attendance. My current attendance is ${s.attendance}%, below
the required 75%.

Reason: Medical grounds / Personal emergency (supporting documents attached).
IA Average: ${s.iaAvg}% | Outstanding Fees: ₹${s.feeDue.toLocaleString("en-IN")}

I assure you that such a situation will not recur. Kindly consider this application
and grant condonation for the above-mentioned semester examinations.

Yours faithfully,
${s.name}
Date: ${new Date().toLocaleDateString("en-IN")}`;

function CondonationModal({ student, onClose }: { student: DemoStudent; onClose: () => void }) {
  const [text, setText] = useState(CONDONATION_TEMPLATE(student));
  function download() {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Condonation_${student.usn}.txt`;
    a.click();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface rounded-xl border border-border shadow-2xl w-full max-w-2xl grid gap-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Condonation Application</p>
            <p className="text-xs text-text-muted">{student.name} · {student.usn} · Attendance: {student.attendance}%</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl">✕</button>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          {[
            { label: "Attendance", value: `${student.attendance}%`, warn: student.attendance < 75 },
            { label: "IA Average", value: `${student.iaAvg}%`, warn: student.iaAvg < 50 },
            { label: "Fee Due", value: student.feeDue > 0 ? `₹${student.feeDue.toLocaleString("en-IN")}` : "Cleared", warn: student.feeDue > 0 },
          ].map((d) => (
            <div key={d.label} className={cn("rounded p-2 text-center", d.warn ? "bg-[#F5E6E6]" : "bg-[#EBF3EE]")}>
              <p className="label-track text-[10px]">{d.label}</p>
              <p className={cn("font-medium mt-0.5", d.warn ? "text-[#8B2F2F]" : "text-[#3D6B4F]")}>{d.value}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="label-track text-xs mb-1">Application Text (editable)</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            className="w-full rounded border border-border bg-white px-3 py-2 text-xs font-mono focus:outline-none resize-none"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={download}>Download Application</Button>
        </div>
      </div>
    </div>
  );
}

export function VTUAdmin() {
  const { data: windows = [], isLoading } = useVTUWindows();
  const createWindow = useCreateVTUWindow();
  const sendReminders = useSendVTUReminders();
  const runCheck = useRunEligibilityCheck();

  const [selectedWindow, setSelectedWindow] = useState<VTUWindow | null>(null);
  const [view, setView] = useState<"eligibility" | "windows" | "pending" | "dept">("eligibility");
  const [showCreate, setShowCreate] = useState(false);
  const [condonationStudent, setCondonationStudent] = useState<DemoStudent | null>(null);
  const [eligFilter, setEligFilter] = useState<"all" | "flagged" | "clear">("all");
  const [form, setForm] = useState({
    title: "",
    examMonth: "",
    openDate: "",
    closeDate: "",
    eligibilityRules: { minAttendancePct: 75, maxBacklogs: 0, feeClearance: true },
  });

  const { data: pending = [], isLoading: loadingPending } = useVTUPendingStudents(
    selectedWindow?.id ?? "",
  );
  const { data: deptOverview = [] } = useVTUDeptOverview(selectedWindow?.id ?? "");

  const statusStyle: Record<string, string> = {
    UPCOMING: "bg-[#E6EEF5] text-[#2F567A]",
    OPEN: "bg-[#EBF3EE] text-[#3D6B4F]",
    CLOSED: "bg-[#F0EEEB] text-[#6B6358]",
    PROCESSED: "bg-[#F5EDDB] text-[#8B6914]",
  };

  const regStatusStyle: Record<string, string> = {
    NOT_STARTED: "bg-[#F0EEEB] text-[#6B6358]",
    ELIGIBLE: "bg-[#EBF3EE] text-[#3D6B4F]",
    INELIGIBLE: "bg-[#F5E6E6] text-[#8B2F2F]",
    REGISTERED: "bg-[#E6EEF5] text-[#2F567A]",
    SUBMITTED: "bg-[#EBF3EE] text-[#3D6B4F]",
    CONFIRMED: "bg-[#EBF3EE] text-[#3D6B4F]",
  };

  const eligStudents = DEMO_STUDENTS.filter((s) =>
    eligFilter === "all" ? true : eligFilter === "flagged" ? s.flags.length > 0 : s.flags.length === 0
  );

  return (
    <AppShell title="VTU Registration">
      {condonationStudent && (
        <CondonationModal student={condonationStudent} onClose={() => setCondonationStudent(null)} />
      )}
      <div className="grid gap-5">
        {/* Nav */}
        <div className="flex gap-2 flex-wrap">
          {(["eligibility", "windows", "pending", "dept"] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={view === v ? "default" : "outline"}
              onClick={() => setView(v)}
            >
              {v === "eligibility" ? "Exam Eligibility" : v === "windows" ? "Registration Windows" : v === "pending" ? "Pending Students" : "Dept Overview"}
            </Button>
          ))}
          <Button size="sm" className="ml-auto" onClick={() => setShowCreate(true)}>
            + New Window
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded border border-[#1C1810] bg-surface p-5 grid gap-3">
            <p className="font-medium">Configure Registration Window</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <input placeholder="Title (e.g. Nov 2025 Exam)" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="col-span-2 rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none" />
              <input placeholder="Exam Month (e.g. Nov 2025)" value={form.examMonth}
                onChange={(e) => setForm({ ...form, examMonth: e.target.value })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none" />
              <input type="date" value={form.openDate}
                onChange={(e) => setForm({ ...form, openDate: e.target.value })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none" />
              <input type="date" value={form.closeDate}
                onChange={(e) => setForm({ ...form, closeDate: e.target.value })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none" />
              <input type="number" placeholder="Min Attendance %" value={form.eligibilityRules.minAttendancePct}
                onChange={(e) => setForm({ ...form, eligibilityRules: { ...form.eligibilityRules, minAttendancePct: Number(e.target.value) } })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none" />
              <input type="number" placeholder="Max Backlogs" value={form.eligibilityRules.maxBacklogs}
                onChange={(e) => setForm({ ...form, eligibilityRules: { ...form.eligibilityRules, maxBacklogs: Number(e.target.value) } })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createWindow.mutate(form, { onSuccess: () => setShowCreate(false) })}
                disabled={createWindow.isPending}>
                {createWindow.isPending ? "Creating…" : "Create Window"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {view === "eligibility" && (
          <div className="grid gap-4">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Students", value: 247, color: "#3D6B4F" },
                { label: "Fully Eligible", value: 200, color: "#3D6B4F" },
                { label: "Flagged (Action Needed)", value: 47, color: "#8B2F2F" },
              ].map((k) => (
                <div key={k.label} className="rounded border-l-4 bg-surface p-4" style={{ borderColor: k.color }}>
                  <p className="label-track text-xs">{k.label}</p>
                  <p className="text-3xl font-light mt-1" style={{ color: k.color }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2 items-center flex-wrap">
              <p className="text-xs text-text-muted">Filter:</p>
              {(["all", "flagged", "clear"] as const).map((f) => (
                <button key={f} onClick={() => setEligFilter(f)}
                  className={cn("rounded px-3 py-1 text-xs font-medium transition-colors",
                    eligFilter === f ? "bg-[#1C1810] text-[#F2EFE9]" : "border border-border bg-surface hover:bg-cream-200")}>
                  {f === "all" ? `All (${DEMO_STUDENTS.length})` : f === "flagged" ? "Flagged (47)" : "Eligible (200)"}
                </button>
              ))}
            </div>

            {/* Student table */}
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm">
                <thead className="bg-cream-200">
                  <tr>
                    {["USN","Student","Dept","Sem","Attendance","IA Avg","Fees Due","Status","Action"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left label-track text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eligStudents.slice(0, 80).map((s) => {
                    const flagged = s.flags.length > 0;
                    return (
                      <tr key={s.usn} className={cn("border-t border-border", flagged ? "bg-[#FFF8F8]" : "even:bg-cream-50")}>
                        <td className="px-3 py-1.5 font-mono text-xs">{s.usn}</td>
                        <td className="px-3 py-1.5 font-medium text-xs">{s.name}</td>
                        <td className="px-3 py-1.5 text-xs">{s.dept}</td>
                        <td className="px-3 py-1.5 text-xs">Sem {s.sem}</td>
                        <td className={cn("px-3 py-1.5 text-xs font-medium", s.attendance < 75 ? "text-[#8B2F2F]" : "text-[#3D6B4F]")}>
                          {s.attendance}%
                        </td>
                        <td className={cn("px-3 py-1.5 text-xs font-medium", s.iaAvg < 50 ? "text-[#8B2F2F]" : "text-[#3D6B4F]")}>
                          {s.iaAvg}%
                        </td>
                        <td className={cn("px-3 py-1.5 text-xs", s.feeDue > 0 ? "text-[#8B2F2F] font-medium" : "text-text-muted")}>
                          {s.feeDue > 0 ? `₹${s.feeDue.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="px-3 py-1.5">
                          <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium",
                            flagged ? "bg-[#F5E6E6] text-[#8B2F2F]" : "bg-[#EBF3EE] text-[#3D6B4F]")}>
                            {flagged ? `Blocked (${s.flags.join(", ")})` : "Eligible"}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          {flagged && (
                            <button
                              onClick={() => setCondonationStudent(s)}
                              className="text-xs text-[#2F567A] hover:underline"
                            >
                              Generate Condonation
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {eligStudents.length > 80 && (
                <p className="px-4 py-2 text-xs text-text-muted text-center">
                  Showing 80 of {eligStudents.length} — use filter to narrow down
                </p>
              )}
            </div>
          </div>
        )}

        {view === "windows" && (
          isLoading ? <p className="text-sm text-text-muted">Loading…</p> : (
            <div className="grid gap-3">
              {windows.map((w) => (
                <div key={w.id} className={cn("rounded border p-4 cursor-pointer transition-colors",
                  selectedWindow?.id === w.id ? "border-[#1C1810] bg-cream-100" : "border-border bg-surface hover:border-[#1C1810]")}
                  onClick={() => setSelectedWindow(w)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{w.title}</p>
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusStyle[w.status])}>
                          {w.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {w.examMonth} · {w.openDate} → {w.closeDate}
                      </p>
                      {w.eligibilityRules && (
                        <p className="text-xs text-text-muted">
                          Min attendance: {w.eligibilityRules.minAttendancePct}% ·
                          Max backlogs: {w.eligibilityRules.maxBacklogs} ·
                          Fee: {w.eligibilityRules.feeClearance ? "Required" : "Not required"}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {w.status === "OPEN" && (
                        <Button size="sm" variant="outline"
                          onClick={(e) => { e.stopPropagation(); runCheck.mutate(w.id); }}
                          disabled={runCheck.isPending}>
                          Run Eligibility Check
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {windows.length === 0 && (
                <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
                  No windows yet. Create one above.
                </p>
              )}
            </div>
          )
        )}

        {view === "pending" && (
          <div className="grid gap-3">
            {!selectedWindow && (
              <p className="text-sm text-text-muted">Select a window from the Windows tab first.</p>
            )}
            {selectedWindow && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm">{pending.length} students pending for <strong>{selectedWindow.title}</strong></p>
                  <Button size="sm" variant="outline"
                    disabled={sendReminders.isPending || pending.length === 0}
                    onClick={() => sendReminders.mutate({
                      windowId: selectedWindow.id,
                      studentUsns: pending.map((s) => s.usn),
                    })}>
                    {sendReminders.isPending ? "Sending…" : "Send Reminders to All"}
                  </Button>
                </div>
                <div className="overflow-x-auto rounded border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-200">
                      <tr>
                        {["USN", "Name", "Dept", "Sem", "Eligible", "Ineligible", "Status", "Last Reminded"].map((h) => (
                          <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingPending
                        ? Array.from({ length: 3 }).map((_, i) => (
                            <tr key={i} className="border-t border-border animate-pulse">
                              {[1,2,3,4,5,6,7,8].map((j) => (
                                <td key={j} className="px-4 py-3"><div className="h-3 w-16 rounded bg-cream-200" /></td>
                              ))}
                            </tr>
                          ))
                        : pending.map((s) => (
                            <tr key={s.usn} className="border-t border-border even:bg-cream-50">
                              <td className="px-4 py-2 font-mono text-xs">{s.usn}</td>
                              <td className="px-4 py-2 font-medium">{s.name}</td>
                              <td className="px-4 py-2">{s.dept}</td>
                              <td className="px-4 py-2">Sem {s.semester}</td>
                              <td className="px-4 py-2 text-[#3D6B4F]">{s.eligibleCount}</td>
                              <td className="px-4 py-2 text-[#8B2F2F]">{s.ineligibleCount}</td>
                              <td className="px-4 py-2">
                                <span className={cn("rounded px-2 py-0.5 text-xs font-medium", regStatusStyle[s.status])}>
                                  {s.status.replace("_", " ")}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-text-muted text-xs">{s.lastRemindedAt ?? "—"}</td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {view === "dept" && (
          <div className="grid gap-3">
            {!selectedWindow && (
              <p className="text-sm text-text-muted">Select a window from the Windows tab first.</p>
            )}
            {selectedWindow && deptOverview.length > 0 && (
              <>
                <p className="text-sm text-text-muted">Department breakdown for <strong>{selectedWindow.title}</strong></p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {deptOverview.map((d) => (
                    <div key={d.dept} className="rounded border border-border bg-surface p-4">
                      <p className="font-medium">{d.dept}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-text-muted">Total</p>
                          <p className="text-xl font-light">{d.total}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#3D6B4F]">Registered</p>
                          <p className="text-xl font-light text-[#3D6B4F]">{d.registered}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#8B6914]">Pending</p>
                          <p className="text-xl font-light text-[#8B6914]">{d.pending}</p>
                        </div>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-cream-200">
                        <div className="h-2 rounded-full bg-[#3D6B4F]"
                          style={{ width: `${d.total > 0 ? (d.registered / d.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
