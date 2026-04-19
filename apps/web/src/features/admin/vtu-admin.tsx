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

export function VTUAdmin() {
  const { data: windows = [], isLoading } = useVTUWindows();
  const createWindow = useCreateVTUWindow();
  const sendReminders = useSendVTUReminders();
  const runCheck = useRunEligibilityCheck();

  const [selectedWindow, setSelectedWindow] = useState<VTUWindow | null>(null);
  const [view, setView] = useState<"windows" | "pending" | "dept">("windows");
  const [showCreate, setShowCreate] = useState(false);
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

  return (
    <AppShell title="VTU Registration">
      <div className="grid gap-5">
        {/* Nav */}
        <div className="flex gap-2 flex-wrap">
          {(["windows", "pending", "dept"] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={view === v ? "default" : "outline"}
              onClick={() => setView(v)}
            >
              {v === "windows" ? "Registration Windows" : v === "pending" ? "Pending Students" : "Dept Overview"}
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
                      <p className="text-xs text-text-muted">
                        Min attendance: {w.eligibilityRules.minAttendancePct}% ·
                        Max backlogs: {w.eligibilityRules.maxBacklogs} ·
                        Fee: {w.eligibilityRules.feeClearance ? "Required" : "Not required"}
                      </p>
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
