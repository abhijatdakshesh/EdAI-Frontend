"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/use-auth";
import { useStudentAssignments, useSubmitAssignment, type AssignmentStatus, type Assignment } from "@/lib/api/assignments";

// r16 — only allow common assignment formats. Validated client-side
// before we hand the file off for upload.
const ALLOWED_EXTS = [".pdf", ".doc", ".docx", ".zip"] as const;
const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
]);

function isAllowedFileLike(input: { name?: string; type?: string }): boolean {
  const name = (input.name ?? "").toLowerCase();
  const type = (input.type ?? "").toLowerCase();
  if (type && ALLOWED_MIMES.has(type)) return true;
  return ALLOWED_EXTS.some((ext) => name.endsWith(ext));
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

function relDate(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'a1', title: 'Operating Systems Lab Report', courseId: 'cs601', courseName: 'Operating Systems', courseCode: 'CS601', dueDate: relDate(5), maxMarks: 50, description: 'Write a lab report on process scheduling algorithms.', status: 'PENDING' },
  { id: 'a2', title: 'DBMS Mini Project', courseId: 'cs602', courseName: 'Database Management Systems', courseCode: 'CS602', dueDate: relDate(-2), maxMarks: 100, description: 'Design and implement a college ERP mini-project.', status: 'SUBMITTED', submittedAt: relDate(-3) },
  { id: 'a3', title: 'Distributed Hash Table', courseId: 'cs603', courseName: 'Distributed Systems', courseCode: 'CS603', dueDate: relDate(-10), maxMarks: 80, description: 'Implement DHT using Chord protocol.', status: 'GRADED', grade: 72, feedback: 'Good implementation, improve documentation.' },
  { id: 'a4', title: 'Network Packet Analyzer', courseId: 'cs604', courseName: 'Computer Networks', courseCode: 'CS604', dueDate: relDate(15), maxMarks: 40, description: 'Analyze network traffic using Wireshark.', status: 'PENDING' },
  { id: 'a5', title: 'CNN Image Classifier', courseId: 'cs605', courseName: 'Machine Learning', courseCode: 'CS605', dueDate: relDate(20), maxMarks: 60, description: 'Build a CNN to classify CIFAR-10 images.', status: 'SUBMITTED', submittedAt: relDate(-1) },
];

const statusStyle: Record<string, string> = {
  PENDING: "bg-[#F5EDDB] text-[#8B6914]",
  SUBMITTED: "bg-[#E6EEF5] text-[#2F567A]",
  GRADED: "bg-[#EBF3EE] text-[#3D6B4F]",
  LATE: "bg-[#F5E6E6] text-[#8B2F2F]",
};

type FilterOption = "all" | AssignmentStatus;

export function MyAssignments() {
  const { session } = useAuth();
  // Prefer sapId (USN) when present — backend submissions are keyed by USN, not user.id
  const usn = session?.user?.sapId ?? session?.user?.id ?? "";
  const [filter, setFilter] = useState<FilterOption>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const query = useStudentAssignments(
    USE_MOCK ? "" : usn,
    filter !== "all" ? filter : undefined,
  );
  const mockFiltered = USE_MOCK
    ? (filter === "all" ? MOCK_ASSIGNMENTS : MOCK_ASSIGNMENTS.filter((a) => a.status === filter))
    : [];
  // r15 — defensive client-side filter so the All/Pending/Submitted/Graded
  // tabs work even if the upstream `?status=` query param is dropped.
  const serverList = query.data ?? [];
  const filteredServerList = filter === "all" ? serverList : serverList.filter((a) => a.status === filter);
  const assignments = USE_MOCK ? mockFiltered : filteredServerList;
  const isLoading = USE_MOCK ? false : query.isLoading;
  const submitMutation = useSubmitAssignment();

  const selected = assignments.find((a) => a.id === selectedId) ?? null;

  // r17 — reset transient submit state every time the user switches assignments
  // so a "Submitted" badge from one card never leaks onto the next pending card.
  const lastSelectedId = useRef<string | null>(null);
  useEffect(() => {
    if (selected?.id !== lastSelectedId.current) {
      setSubmitUrl("");
      setSubmitMsg(null);
      lastSelectedId.current = selected?.id ?? null;
    }
  }, [selected?.id]);

  async function handleSubmit() {
    if (!selected || !usn || !submitUrl.trim()) return;
    setSubmitMsg(null);
    // r16 — validate file type. The submit field accepts either a URL
    // (drive/dropbox/etc) or a filename — both are checked by extension.
    const trimmed = submitUrl.trim();
    if (!isAllowedFileLike({ name: trimmed })) {
      setSubmitMsg("Wrong file type — please upload PDF/DOCX/ZIP");
      return;
    }
    try {
      await submitMutation.mutateAsync({ assignmentId: selected.id, fileUrl: trimmed, studentUsn: usn });
      setSubmitMsg("Submitted successfully!");
      setSubmitUrl("");
    } catch {
      setSubmitMsg("Submission failed. Please try again.");
    }
  }

  return (
    <AppShell title="Assignments">
      <div className="grid gap-5 md:grid-cols-[1fr_380px]">
        <div className="grid gap-4">
          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-border">
            {(["all", "PENDING", "SUBMITTED", "GRADED"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-4 py-2 text-sm capitalize transition-colors",
                  filter === f ? "border-b-2 border-[#1C1810] font-medium" : "text-text-muted hover:text-text-primary")}>
                {f.toLowerCase()}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded border border-border bg-surface p-4 h-20 animate-pulse" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="rounded border border-dashed border-border p-10 text-center text-sm text-text-muted">
              No {filter !== "all" ? filter.toLowerCase() : ""} assignments found.
            </div>
          ) : (
            assignments.map((a) => (
              <button key={a.id} onClick={() => setSelectedId(a.id)}
                className={cn("rounded border p-4 text-left transition-colors",
                  selectedId === a.id ? "border-[#1C1810] bg-cream-100" : "border-border bg-surface hover:border-[#1C1810]")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{a.courseName}</p>
                  </div>
                  <span className={cn("rounded px-2 py-0.5 text-xs font-medium shrink-0", statusStyle[a.status ?? "PENDING"])}>
                    {(a.status ?? "pending").toLowerCase()}
                  </span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-text-muted">
                  <span>📅 Due: {a.dueDate}</span>
                  {a.grade !== undefined && <span>✓ {a.grade}/{a.maxMarks}</span>}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        {selected ? (
          <div className="rounded border border-border bg-surface p-5 self-start sticky top-4">
            <p className="label-track">Assignment Details</p>
            <h3 className="mt-2 text-lg font-medium leading-snug">{selected.title}</h3>
            <p className="text-xs text-text-muted">{selected.courseName} · {selected.courseCode}</p>
            <span className="ray-rule ml-0" />
            <p className="text-sm text-text-secondary mb-4">{selected.description}</p>
            <dl className="grid gap-2 text-sm mb-4">
              <div className="flex justify-between border-b border-border pb-1">
                <dt className="text-text-muted">Due Date</dt><dd>{selected.dueDate}</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-1">
                <dt className="text-text-muted">Max Marks</dt><dd>{selected.maxMarks}</dd>
              </div>
              {selected.grade !== undefined && (
                <div className="flex justify-between border-b border-border pb-1">
                  <dt className="text-text-muted">Marks Obtained</dt>
                  <dd className="font-medium text-[#3D6B4F]">{selected.grade}/{selected.maxMarks}</dd>
                </div>
              )}
              {selected.feedback && (
                <div className="flex justify-between border-b border-border pb-1">
                  <dt className="text-text-muted">Feedback</dt>
                  <dd className="text-xs">{selected.feedback}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-text-muted">Status</dt>
                <dd><span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusStyle[selected.status ?? "PENDING"])}>{(selected.status ?? "pending").toLowerCase()}</span></dd>
              </div>
            </dl>
            {selected.status === "PENDING" && (
              <div className="grid gap-2">
                <input
                  value={submitUrl}
                  onChange={(e) => setSubmitUrl(e.target.value)}
                  placeholder="Paste submission URL or file link"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                />
                <button
                  onClick={() => void handleSubmit()}
                  disabled={!submitUrl.trim() || submitMutation.isPending}
                  className="w-full rounded bg-[#1C1810] py-2 text-sm text-[#F2EFE9] transition-colors hover:bg-[#2C2418] disabled:opacity-50"
                >
                  {submitMutation.isPending ? "Submitting…" : "Submit Assignment"}
                </button>
                {submitMsg && (
                  <p className={cn("text-xs text-center", submitMsg.includes("success") ? "text-[#3D6B4F]" : "text-[#8B2F2F]")}>
                    {submitMsg}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            Select an assignment to view details
          </div>
        )}
      </div>
    </AppShell>
  );
}
