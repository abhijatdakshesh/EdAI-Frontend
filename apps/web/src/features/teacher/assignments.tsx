"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/api/client";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AssignmentStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

interface Assignment {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  classId: string;
  className: string;
  dueDate: string;
  maxMarks: number;
  status: AssignmentStatus;
  submissionCount: number;
  totalStudents: number;
  createdAt: string;
}

interface Submission {
  id: string;
  studentUsn: string;
  studentName: string;
  submittedAt: string;
  fileUrl?: string;
  marks?: number;
  feedback?: string;
  late: boolean;
}

const statusStyle: Record<AssignmentStatus, string> = {
  DRAFT: "bg-[#F0EEEB] text-[#6B6358]",
  PUBLISHED: "bg-[#EBF3EE] text-[#3D6B4F]",
  CLOSED: "bg-[#F5E6E6] text-[#8B2F2F]",
};

export function TeacherAssignments() {
  const qc = useQueryClient();
  const [view, setView] = useState<"list" | "submissions">("list");
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", courseCode: "", classId: "", dueDate: "", maxMarks: 25 });
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ marks: "", feedback: "" });

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ["teacher-assignments"],
    queryFn: () => apiGet<Assignment[]>("/api/teacher/assignments"),
  });

  const { data: submissions = [], isLoading: loadingSubs } = useQuery<Submission[]>({
    queryKey: ["teacher-assignment-submissions", selected?.id],
    queryFn: () => apiGet<Submission[]>(`/api/teacher/assignments/${selected!.id}/submissions`),
    enabled: !!selected && view === "submissions",
  });

  const createAssignment = useMutation({
    mutationFn: (payload: typeof form) =>
      apiPost<Assignment>("/api/teacher/assignments", { ...payload, status: "DRAFT" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-assignments"] });
      setShowCreate(false);
      setForm({ title: "", courseCode: "", classId: "", dueDate: "", maxMarks: 25 });
    },
  });

  const publishAssignment = useMutation({
    mutationFn: (id: string) =>
      apiPatch(`/api/teacher/assignments/${id}`, { status: "PUBLISHED" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-assignments"] }),
  });

  const gradeSubmission = useMutation({
    mutationFn: ({ subId, marks, feedback }: { subId: string; marks: number; feedback: string }) =>
      apiPatch(`/api/teacher/assignments/${selected!.id}/submissions/${subId}/grade`, {
        marks,
        feedback,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-assignment-submissions", selected?.id] });
      setGradingId(null);
    },
  });

  return (
    <AppShell title="Assignments">
      <div className="grid gap-5">
        {/* Header actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={view === "list" ? "default" : "outline"}
              onClick={() => { setView("list"); setSelected(null); }}
            >
              All Assignments
            </Button>
            {selected && (
              <Button
                size="sm"
                variant={view === "submissions" ? "default" : "outline"}
                onClick={() => setView("submissions")}
              >
                Submissions — {selected.title}
              </Button>
            )}
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>+ New Assignment</Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded border border-[#1C1810] bg-surface p-5 grid gap-3">
            <p className="font-medium">Create Assignment</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="col-span-2 rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
              />
              <input
                placeholder="Course Code (e.g. 21CS61)"
                value={form.courseCode}
                onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
              />
              <input
                placeholder="Class ID"
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
              />
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
              />
              <input
                type="number"
                placeholder="Max Marks"
                value={form.maxMarks}
                onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createAssignment.mutate(form)} disabled={createAssignment.isPending}>
                {createAssignment.isPending ? "Saving…" : "Create"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {view === "list" && (
          isLoading ? (
            <p className="text-sm text-text-muted">Loading assignments…</p>
          ) : (
            <div className="grid gap-3">
              {assignments.map((a) => (
                <div key={a.id} className="rounded border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{a.title}</p>
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusStyle[a.status])}>
                          {a.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {a.courseCode} · {a.className} · Due {a.dueDate}
                      </p>
                      <p className="text-xs text-text-muted">
                        {a.submissionCount} / {a.totalStudents} submitted · Max {a.maxMarks} marks
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelected(a);
                          setView("submissions");
                        }}
                      >
                        Submissions
                      </Button>
                      {a.status === "DRAFT" && (
                        <Button
                          size="sm"
                          onClick={() => publishAssignment.mutate(a.id)}
                          disabled={publishAssignment.isPending}
                        >
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
                  No assignments yet. Create one above.
                </p>
              )}
            </div>
          )
        )}

        {view === "submissions" && selected && (
          loadingSubs ? (
            <p className="text-sm text-text-muted">Loading submissions…</p>
          ) : (
            <div className="grid gap-3">
              <div className="flex items-center gap-4 text-sm text-text-muted">
                <span>{submissions.filter((s) => s.marks !== undefined).length} graded</span>
                <span>{submissions.filter((s) => s.marks === undefined).length} pending</span>
                <span>{submissions.filter((s) => s.late).length} late</span>
              </div>
              {submissions.map((sub) => (
                <div key={sub.id} className="rounded border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{sub.studentName}</p>
                      <p className="text-xs text-text-muted font-mono">{sub.studentUsn}</p>
                      <p className="text-xs text-text-muted">
                        Submitted {sub.submittedAt}
                        {sub.late && <span className="ml-2 text-[#8B2F2F]">(Late)</span>}
                      </p>
                      {sub.fileUrl && (
                        <a href={sub.fileUrl} target="_blank" rel="noreferrer"
                          className="text-xs text-[#2F567A] hover:underline">
                          View Submission
                        </a>
                      )}
                    </div>
                    <div className="text-right">
                      {sub.marks !== undefined ? (
                        <p className="font-medium">{sub.marks}/{selected.maxMarks}</p>
                      ) : (
                        <Button size="sm" onClick={() => {
                          setGradingId(sub.id);
                          setGradeForm({ marks: "", feedback: "" });
                        }}>
                          Grade
                        </Button>
                      )}
                    </div>
                  </div>
                  {gradingId === sub.id && (
                    <div className="mt-3 grid gap-2 border-t border-border pt-3">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder={`Marks / ${selected.maxMarks}`}
                          value={gradeForm.marks}
                          max={selected.maxMarks}
                          min={0}
                          onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
                          className="w-28 rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
                        />
                        <input
                          placeholder="Feedback (optional)"
                          value={gradeForm.feedback}
                          onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                          className="flex-1 rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={gradeSubmission.isPending || !gradeForm.marks}
                          onClick={() =>
                            gradeSubmission.mutate({
                              subId: sub.id,
                              marks: Number(gradeForm.marks),
                              feedback: gradeForm.feedback,
                            })
                          }
                        >
                          {gradeSubmission.isPending ? "Saving…" : "Save Grade"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setGradingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {submissions.length === 0 && (
                <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
                  No submissions yet.
                </p>
              )}
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}
