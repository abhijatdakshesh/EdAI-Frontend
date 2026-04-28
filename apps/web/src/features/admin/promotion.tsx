"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  usePromotionBatches,
  useGeneratePromotion,
  useOverridePromotion,
  useExecutePromotion,
  useDetentionList,
  type PromotionBatch,
  type PromotionStatus,
} from "@/lib/api/promotion";
import { useClasses } from "@/lib/api/academics";

const statusColors: Record<PromotionStatus, string> = {
  ELIGIBLE: "bg-[#EBF3EE] text-[#3D6B4F]",
  DETAINED: "bg-[#F5E6E6] text-[#8B2F2F]",
  CONDITIONAL: "bg-[#F5EDDB] text-[#8B6914]",
  PROMOTED: "bg-[#E6EEF5] text-[#2F567A]",
};

const failureLabels: Record<string, string> = {
  ATTENDANCE_LOW: "Attendance < 75%",
  IA_BELOW_MIN: "IA marks below minimum",
  FEE_PENDING: "Fees not cleared",
};

export function PromotionManagement() {
  const [activeView, setActiveView] = useState<"batches" | "detention" | "generate">("batches");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [generateForm, setGenerateForm] = useState({
    classId: "",
    className: "",
    fromSemester: 5,
    academicYear: "2024-25",
    minAttendancePct: 75,
    minIaScore: 40,
    feeClearanceRequired: true,
  });
  const [overrideModal, setOverrideModal] = useState<{
    batchId: string;
    studentUsn: string;
    studentName: string;
  } | null>(null);
  const [overrideNote, setOverrideNote] = useState("");

  const { data: batches = [], isLoading: loadingBatches } = usePromotionBatches();
  const { data: classes = [] } = useClasses();
  const { data: detained = [] } = useDetentionList();
  const generateBatch = useGeneratePromotion();
  const overrideStudent = useOverridePromotion();
  const executePromotion = useExecutePromotion();

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  function handleGenerate() {
    const cls = classes.find((c) => c.id === generateForm.classId);
    generateBatch.mutate(
      {
        classId: generateForm.classId,
        className: cls?.name ?? generateForm.className,
        fromSemester: generateForm.fromSemester,
        academicYear: generateForm.academicYear,
        criteria: {
          minAttendancePct: generateForm.minAttendancePct,
          minIaScore: generateForm.minIaScore,
          feeClearanceRequired: generateForm.feeClearanceRequired,
        },
      },
      {
        onSuccess: (batch) => {
          setActiveView("batches");
          setSelectedBatchId(batch.id);
        },
      },
    );
  }

  return (
    <AppShell title="Student Promotion">
      <div className="grid gap-5">

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {([
            { key: "batches", label: "Promotion Batches" },
            { key: "detention", label: `Detention List (${detained.length})` },
            { key: "generate", label: "+ Generate Report" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={cn(
                "px-4 py-2 text-sm transition-colors",
                activeView === tab.key
                  ? "border-b-2 border-[#1C1810] font-medium"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── BATCHES VIEW ─────────────────────────────────────────────── */}
        {activeView === "batches" && (
          <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
            {/* Batch list */}
            <div className="grid gap-3">
              {loadingBatches && (
                <p className="text-sm text-text-muted">Loading batches…</p>
              )}
              {batches.length === 0 && !loadingBatches && (
                <div className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
                  No promotion batches yet.{" "}
                  <button
                    className="text-[#1C1810] underline"
                    onClick={() => setActiveView("generate")}
                  >
                    Generate one
                  </button>
                </div>
              )}
              {batches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBatchId(b.id)}
                  className={cn(
                    "rounded border p-4 text-left transition-colors hover:border-[#1C1810]",
                    selectedBatchId === b.id
                      ? "border-[#1C1810] bg-cream-100"
                      : "border-border bg-surface",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{b.className}</p>
                      <p className="text-xs text-text-muted">
                        Sem {b.fromSemester} → Sem {b.toSemester} · {b.academicYear}
                      </p>
                    </div>
                    {b.promotedAt ? (
                      <span className="rounded bg-[#E6EEF5] px-2 py-0.5 text-xs text-[#2F567A]">
                        Promoted
                      </span>
                    ) : (
                      <span className="rounded bg-[#F5EDDB] px-2 py-0.5 text-xs text-[#8B6914]">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-3 text-xs text-text-muted">
                    <span className="text-[#3D6B4F]">✓ {b.stats.eligible} eligible</span>
                    <span className="text-[#8B2F2F]">✗ {b.stats.detained} detained</span>
                    {b.stats.conditional > 0 && (
                      <span className="text-[#8B6914]">~ {b.stats.conditional} conditional</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Batch detail */}
            {selectedBatch ? (
              <div className="grid gap-4">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Total", value: selectedBatch.stats.total },
                    { label: "Eligible", value: selectedBatch.stats.eligible, color: "text-[#3D6B4F]" },
                    { label: "Detained", value: selectedBatch.stats.detained, color: "text-[#8B2F2F]" },
                    { label: "Conditional", value: selectedBatch.stats.conditional, color: "text-[#8B6914]" },
                  ].map((s) => (
                    <div key={s.label} className="rounded border border-border bg-surface p-3 text-center">
                      <p className="label-track text-xs">{s.label}</p>
                      <p className={cn("text-2xl font-light mt-1", s.color)}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Criteria */}
                <div className="rounded border border-border bg-surface p-3 text-xs text-text-muted flex gap-4">
                  <span>Min attendance: {selectedBatch.criteria.minAttendancePct}%</span>
                  <span>Min IA score: {selectedBatch.criteria.minIaScore}</span>
                  <span>Fee clearance: {selectedBatch.criteria.feeClearanceRequired ? "Required" : "Not required"}</span>
                </div>

                {/* Student table */}
                <div className="overflow-x-auto rounded border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-200">
                      <tr>
                        {["USN", "Name", "Attendance", "IA Score", "Fee", "Status", "Issues", "Action"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left label-track text-xs">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedBatch?.students ?? []).map((s) => (
                        <tr key={s.studentUsn} className="border-t border-border even:bg-cream-50">
                          <td className="px-3 py-2 font-mono text-xs">{s.studentUsn}</td>
                          <td className="px-3 py-2 font-medium">{s.studentName}</td>
                          <td className={cn("px-3 py-2 font-medium",
                            s.attendancePct >= 75 ? "text-[#3D6B4F]" : "text-[#8B2F2F]")}>
                            {s.attendancePct}%
                          </td>
                          <td className={cn("px-3 py-2",
                            s.iaScore >= 40 ? "text-[#3D6B4F]" : "text-[#8B2F2F]")}>
                            {s.iaScore}
                          </td>
                          <td className="px-3 py-2">
                            {s.feeCleared
                              ? <span className="text-[#3D6B4F]">✓</span>
                              : <span className="text-[#8B2F2F]">✗</span>}
                          </td>
                          <td className="px-3 py-2">
                            <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                              statusColors[s.status])}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-text-muted">
                            {(s.failedCriteria ?? []).map((fc) => failureLabels[fc] ?? fc).join(", ") || "—"}
                            {s.overrideNote && (
                              <span className="ml-1 text-[#8B6914]">({s.overrideNote})</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {!selectedBatch.promotedAt && s.status !== "PROMOTED" && (
                              <button
                                className="text-xs text-[#2F567A] hover:underline"
                                onClick={() =>
                                  setOverrideModal({
                                    batchId: selectedBatch.id,
                                    studentUsn: s.studentUsn,
                                    studentName: s.studentName,
                                  })
                                }
                              >
                                Override
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Promote button */}
                {!selectedBatch.promotedAt && (
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      disabled={executePromotion.isPending}
                      onClick={() => {
                        if (
                          confirm(
                            `Promote ${selectedBatch.stats.eligible + selectedBatch.stats.conditional} eligible students from ${selectedBatch.className} Sem ${selectedBatch.fromSemester} to Sem ${selectedBatch.toSemester}?\n\n${selectedBatch.stats.detained} students will be detained.`,
                          )
                        ) {
                          executePromotion.mutate({
                            batchId: selectedBatch.id,
                            promotedBy: "current-user",
                          });
                        }
                      }}
                    >
                      {executePromotion.isPending
                        ? "Processing…"
                        : `Promote ${selectedBatch.stats.eligible + selectedBatch.stats.conditional} Students`}
                    </Button>
                    <Button size="sm" variant="outline">
                      Export Report
                    </Button>
                  </div>
                )}
                {selectedBatch.promotedAt && (
                  <p className="text-sm text-[#3D6B4F]">
                    ✓ Promoted on {new Date(selectedBatch.promotedAt).toLocaleDateString("en-IN")} by{" "}
                    {selectedBatch.promotedBy}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded border border-dashed border-border p-10 text-center text-sm text-text-muted self-start">
                Select a batch to view eligibility details
              </div>
            )}
          </div>
        )}

        {/* ─── DETENTION LIST ───────────────────────────────────────────── */}
        {activeView === "detention" && (
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">
                {detained.length} students are currently detained and cannot be promoted.
              </p>
              <Button size="sm" variant="outline">Export List</Button>
            </div>
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm">
                <thead className="bg-cream-200">
                  <tr>
                    {["USN", "Name", "Semester", "Attendance", "IA Score", "Fee Cleared", "Reasons"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detained.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-text-muted">
                        No detained students. Generate a promotion report first.
                      </td>
                    </tr>
                  )}
                  {detained.map((s) => (
                    <tr key={s.studentUsn} className="border-t border-border even:bg-cream-50">
                      <td className="px-4 py-2 font-mono text-xs">{s.studentUsn}</td>
                      <td className="px-4 py-2 font-medium">{s.studentName}</td>
                      <td className="px-4 py-2">Sem {s.currentSemester}</td>
                      <td className={cn("px-4 py-2 font-medium",
                        s.attendancePct >= 75 ? "text-[#3D6B4F]" : "text-[#8B2F2F]")}>
                        {s.attendancePct}%
                      </td>
                      <td className="px-4 py-2">{s.iaScore}</td>
                      <td className="px-4 py-2">
                        {s.feeCleared ? "✓" : <span className="text-[#8B2F2F]">Pending</span>}
                      </td>
                      <td className="px-4 py-2 text-xs text-[#8B2F2F]">
                        {(s.failedCriteria ?? []).map((fc) => failureLabels[fc] ?? fc).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── GENERATE REPORT ─────────────────────────────────────────── */}
        {activeView === "generate" && (
          <div className="rounded border border-border bg-surface p-6 max-w-lg grid gap-4">
            <div>
              <p className="font-medium">Generate Promotion Eligibility Report</p>
              <p className="text-xs text-text-muted mt-1">
                This will evaluate all students in the selected class against the promotion criteria.
              </p>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs label-track">Class</span>
                <select
                  value={generateForm.classId}
                  onChange={(e) => {
                    const cls = classes.find((c) => c.id === e.target.value);
                    setGenerateForm({
                      ...generateForm,
                      classId: e.target.value,
                      className: cls?.name ?? "",
                      fromSemester: cls?.semester ?? 5,
                    });
                  }}
                  className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
                >
                  <option value="">Select a class…</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Sem {c.semester})
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs label-track">Academic Year</span>
                <input
                  type="text"
                  value={generateForm.academicYear}
                  onChange={(e) => setGenerateForm({ ...generateForm, academicYear: e.target.value })}
                  className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
                  placeholder="e.g. 2024-25"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-xs label-track">Min Attendance %</span>
                  <input
                    type="number"
                    min={0} max={100}
                    value={generateForm.minAttendancePct}
                    onChange={(e) => setGenerateForm({ ...generateForm, minAttendancePct: parseInt(e.target.value) })}
                    className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs label-track">Min IA Score</span>
                  <input
                    type="number"
                    min={0}
                    value={generateForm.minIaScore}
                    onChange={(e) => setGenerateForm({ ...generateForm, minIaScore: parseInt(e.target.value) })}
                    className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={generateForm.feeClearanceRequired}
                  onChange={(e) => setGenerateForm({ ...generateForm, feeClearanceRequired: e.target.checked })}
                  className="rounded"
                />
                Require fee clearance for promotion
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!generateForm.classId || generateBatch.isPending}
                onClick={handleGenerate}
              >
                {generateBatch.isPending ? "Generating…" : "Generate Report"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setActiveView("batches")}>
                Cancel
              </Button>
            </div>
            {generateBatch.isError && (
              <p className="text-xs text-[#8B2F2F]">
                {(generateBatch.error as Error).message}
              </p>
            )}
          </div>
        )}

        {/* ─── OVERRIDE MODAL ───────────────────────────────────────────── */}
        {overrideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded border border-border bg-surface p-6 shadow-lg">
              <p className="font-medium">Override — {overrideModal.studentName}</p>
              <p className="text-xs text-text-muted mt-1">{overrideModal.studentUsn}</p>
              <textarea
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="Reason for override (e.g. Medical certificate approved)"
                rows={3}
                className="mt-4 w-full rounded border border-border bg-white px-3 py-2 text-sm focus:outline-none"
              />
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  disabled={!overrideNote || overrideStudent.isPending}
                  onClick={() => {
                    overrideStudent.mutate(
                      {
                        batchId: overrideModal.batchId,
                        studentUsn: overrideModal.studentUsn,
                        status: "CONDITIONAL",
                        note: overrideNote,
                        overriddenBy: "current-user",
                      },
                      {
                        onSuccess: () => {
                          setOverrideModal(null);
                          setOverrideNote("");
                        },
                      },
                    );
                  }}
                >
                  Mark Conditional
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setOverrideModal(null);
                    setOverrideNote("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
