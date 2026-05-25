"use client";

import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost, apiDownloadPost } from "@/lib/api/client";
import { useClasses } from "@/lib/api/academics";
import { useClassAttendanceSummary, useAtRiskStudents } from "@/lib/api/attendance";
import { useTeacherIAMarks, type IAMarksRow } from "@/lib/api/vtu";

function exportVTUFormat(subjectId: string, rows: IAMarksRow[]) {
  const header = "USN,Student Name,IA 1 (/25),IA 2 (/25),IA 3 (/25),Total (/75)";
  const lines = rows.map((r) => {
    const ia1 = r.ia1 ?? 0;
    const ia2 = r.ia2 ?? 0;
    const total = ia1 + ia2;
    return `${r.studentUsn},"${r.studentName}",${ia1},${ia2},0,${total}`;
  });
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `VTU_IA_${subjectId || "marks"}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
import { useAnnouncements, usePostAnnouncement } from "@/lib/api/comms";
import { useTriggerCall } from "@/lib/api/comms";
import { useAuth } from "@/lib/auth/use-auth";

// ─── Assignment Intelligence ──────────────────────────────────────────────────

interface TeacherAssignment {
  id: string;
  title: string;
  className: string;
  submissionCount: number;
  totalStudents: number;
  avgScore?: number;
  lateSubmissions: number;
  plagiarismFlags: number;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
}

export function AssignmentIntelligence() {
  const { data: assignments = [], isLoading } = useQuery<TeacherAssignment[]>({
    queryKey: ["teacher-assignments"],
    queryFn: () => apiGet<TeacherAssignment[]>("/api/teacher/assignments"),
  });

  return (
    <AppShell title="Assignment Intelligence">
      <div className="grid gap-5">
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={i} className="h-32 rounded border border-border bg-surface animate-pulse" />
          ))
        ) : assignments.length === 0 ? (
          <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            No assignments yet.
          </p>
        ) : (
          assignments.map((a) => (
            <div key={a.id} className="rounded border border-border bg-surface p-5">
              <h3 className="font-medium">{a.title}</h3>
              <p className="text-xs text-text-muted mt-0.5">{a.className}</p>
              <div className="grid grid-cols-2 gap-3 mt-3 sm:grid-cols-4">
                {[
                  { label: "Submitted", value: `${a.submissionCount}/${a.totalStudents}` },
                  {
                    label: "Avg Score",
                    value: a.avgScore != null ? `${a.avgScore}/25` : "Not graded",
                  },
                  { label: "Late Submissions", value: a.lateSubmissions },
                  {
                    label: "Plagiarism Flags",
                    value: a.plagiarismFlags,
                    warn: a.plagiarismFlags > 0,
                  },
                ].map((s) => (
                  <div key={s.label} className={cn("rounded p-3", s.warn ? "bg-[#F5E6E6]" : "bg-cream-100")}>
                    <p className="text-xs text-text-muted">{s.label}</p>
                    <p className={cn("font-medium mt-1", s.warn ? "text-[#8B2F2F]" : "")}>{s.value}</p>
                  </div>
                ))}
              </div>
              {a.totalStudents > 0 && (
                <>
                  <div className="mt-3 h-2 rounded-full bg-cream-200">
                    <div
                      className="h-2 rounded-full bg-[#2F567A]"
                      style={{ width: `${Math.round((a.submissionCount / a.totalStudents) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {Math.round((a.submissionCount / a.totalStudents) * 100)}% submission rate
                  </p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

// ─── Attendance Summary ───────────────────────────────────────────────────────

export function AttendanceSummary() {
  const { data: classes = [], isLoading: loadingClasses } = useClasses();
  const [classId, setClassId] = useState("");

  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(classes[0]!.id);
  }, [classes, classId]);

  const { data: summary, isLoading: loadingSummary } = useClassAttendanceSummary(classId);

  return (
    <AppShell title="Attendance Summary">
      <div className="grid gap-5">
        <div className="flex items-center gap-3">
          <span className="text-xs label-track">Class</span>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
          >
            {loadingClasses ? (
              <option>Loading…</option>
            ) : (
              classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            )}
          </select>
        </div>

        {loadingSummary ? (
          <div className="h-40 rounded border border-border bg-surface animate-pulse" />
        ) : !summary ? (
          <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            No attendance data for this class.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Students", value: summary.totalStudents },
              {
                label: "Present Today",
                value: summary.present,
                color: "text-[#3D6B4F]",
                bg: "bg-[#EBF3EE]",
              },
              {
                label: "Absent Today",
                value: summary.absent,
                color: summary.absent > 0 ? "text-[#8B2F2F]" : undefined,
                bg: summary.absent > 0 ? "bg-[#F5E6E6]" : "bg-cream-100",
              },
              {
                label: "Attendance %",
                value: `${summary.pct}%`,
                color:
                  summary.pct >= 85
                    ? "text-[#3D6B4F]"
                    : summary.pct >= 75
                      ? "text-[#8B6914]"
                      : "text-[#8B2F2F]",
                bg:
                  summary.pct >= 85
                    ? "bg-[#EBF3EE]"
                    : summary.pct >= 75
                      ? "bg-[#F5EDDB]"
                      : "bg-[#F5E6E6]",
              },
            ].map((s) => (
              <div key={s.label} className={cn("rounded p-4 border border-border", s.bg ?? "bg-cream-100")}>
                <p className="text-xs text-text-muted">{s.label}</p>
                <p className={cn("text-2xl font-light mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── Upload Results ───────────────────────────────────────────────────────────

export function UploadResults() {
  const { data: classes = [] } = useClasses();
  const [classId, setClassId] = useState("");
  const [ia, setIa] = useState<"IA-1" | "IA-2">("IA-1");
  const [file, setFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(classes[0]!.id);
  }, [classes, classId]);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file || !classId) throw new Error("Missing file or class");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("classId", classId);
      fd.append("ia", ia);
      const res = await fetch("/api/teacher/marks/upload", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; message?: string; rowsAccepted?: number };
      if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
      return json;
    },
    onSuccess: (json) => {
      setUploadMsg({ type: "success", text: json?.message ?? `Marks uploaded (${json?.rowsAccepted ?? 0} rows).` });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (e: Error) => setUploadMsg({ type: "error", text: e.message }),
  });

  return (
    <AppShell title="Upload Results">
      <div className="grid gap-5 max-w-2xl">
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">Upload IA Marks Sheet</p>
          <div className="grid gap-4">
            <div>
              <label className="text-sm text-text-muted block mb-1">Class</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm w-full focus:outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-text-muted block mb-1">IA Number</label>
              <div className="flex gap-2">
                {(["IA-1", "IA-2"] as const).map((label) => (
                  <button
                    key={label}
                    onClick={() => setIa(label)}
                    className={cn(
                      "rounded border px-4 py-1.5 text-sm transition-colors",
                      ia === label
                        ? "border-[#1C1810] bg-cream-100"
                        : "border-border hover:border-[#1C1810]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-text-muted block mb-1">Upload CSV/Excel</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setUploadMsg(null);
                }}
              />
              <div className="rounded border-2 border-dashed border-border p-8 text-center">
                {file ? (
                  <p className="text-sm text-[#3D6B4F]">✓ {file.name} selected</p>
                ) : (
                  <>
                    <p className="text-sm">Drop file here or</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => fileRef.current?.click()}
                    >
                      Browse
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1">
                Format: USN, Name, Marks (out of 25). Max 25 marks.
              </p>
            </div>
            {uploadMsg && (
              <p
                className={`text-xs ${uploadMsg.type === "success" ? "text-[#3D6B4F]" : "text-[#8B2F2F]"}`}
              >
                {uploadMsg.text}
              </p>
            )}
            <Button
              disabled={!file || upload.isPending}
              onClick={() => upload.mutate()}
            >
              {upload.isPending ? "Uploading…" : "Upload & Submit"}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── IA / VTU Marks ───────────────────────────────────────────────────────────

export function IAVTUMarks() {
  const { data: classes = [] } = useClasses();
  const [subjectId, setSubjectId] = useState("");

  const { data: rows = [], isLoading } = useTeacherIAMarks(subjectId);

  return (
    <AppShell title="IA / VTU Marks">
      <div className="grid gap-5">
        <div className="flex flex-wrap gap-3">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            disabled={rows.length === 0}
            onClick={() => exportVTUFormat(subjectId, rows)}
          >
            Export to VTU Format
          </Button>
        </div>

        {!subjectId ? (
          <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            Select a class to view marks.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-text-muted">Loading marks…</p>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-cream-200">
                <tr>
                  {["USN", "Student", "IA-1 (/25)", "IA-2 (/25)", "Avg", "Best of 2", "VTU Marks"].map(
                    (h) => (
                      <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const ia1 = s.ia1 ?? 0;
                  const ia2 = s.ia2 ?? 0;
                  const avg = ((ia1 + ia2) / 2).toFixed(1);
                  const best = Math.max(ia1, ia2);
                  const vtu = Math.round(best * 0.5);
                  return (
                    <tr key={s.studentUsn} className="border-t border-border even:bg-cream-50">
                      <td className="px-4 py-2 font-mono text-xs">{s.studentUsn}</td>
                      <td className="px-4 py-2 font-medium">{s.studentName}</td>
                      <td className="px-4 py-2">{s.ia1 ?? "—"}</td>
                      <td className="px-4 py-2">{s.ia2 ?? "—"}</td>
                      <td className="px-4 py-2">{avg}</td>
                      <td className="px-4 py-2 font-medium">{best}</td>
                      <td className="px-4 py-2">{vtu}/12.5 (scaled)</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-text-muted">No marks entered.</p>
            )}
          </div>
        )}
        <p className="text-xs text-text-muted">
          VTU formula: Best of 2 IAs, scaled to 25 (or as per VTU regulation).
        </p>
      </div>
    </AppShell>
  );
}

// ─── Teacher Announcements ────────────────────────────────────────────────────

export function TeacherAnnouncements() {
  const { session } = useAuth();
  const { data: classes = [] } = useClasses();
  const { data: recent = [] } = useAnnouncements("FACULTY");
  const postAnnouncement = usePostAnnouncement();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [postMsg, setPostMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handlePost() {
    if (!title.trim() || !body.trim()) return;
    setPostMsg(null);
    try {
      await postAnnouncement.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        category: category as "GENERAL" | "EXAM" | "ACADEMIC" | "PLACEMENT" | "EVENT" | "URGENT",
        postedBy: session?.user?.id ?? "",
        important: false,
        targetRoles: ["STUDENT"],
      });
      setPostMsg({ type: "success", text: "Announcement posted." });
      setTitle("");
      setBody("");
    } catch {
      setPostMsg({ type: "error", text: "Failed to post. Please try again." });
    }
  }

  return (
    <AppShell title="Announcements">
      <div className="grid gap-5 max-w-3xl">
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">New Announcement</p>
          <div className="grid gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="rounded border border-border bg-background px-3 py-1.5 text-sm w-full focus:outline-none"
            />
            <div className="flex gap-2">
              <select className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none">
                <option value="">All My Classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none"
              >
                {["GENERAL", "ACADEMIC", "EXAM", "URGENT"].map((c) => (
                  <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Announcement content…"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none"
            />
            {postMsg && (
              <p className={`text-xs ${postMsg.type === "success" ? "text-[#3D6B4F]" : "text-[#8B2F2F]"}`}>
                {postMsg.text}
              </p>
            )}
            <Button
              disabled={!title.trim() || !body.trim() || postAnnouncement.isPending}
              onClick={() => void handlePost()}
            >
              {postAnnouncement.isPending ? "Posting…" : "Post Announcement"}
            </Button>
          </div>
        </div>

        <div>
          <p className="label-track mb-2">Recent Announcements</p>
          {recent.length === 0 ? (
            <p className="text-sm text-text-muted rounded border border-dashed border-border p-4 text-center">
              No announcements yet.
            </p>
          ) : (
            <div className="grid gap-2">
              {recent.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="rounded border border-border bg-surface p-3 flex justify-between items-start"
                >
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-text-muted">
                      {a.category} · {a.postedAt ? new Date(a.postedAt).toLocaleDateString("en-IN") : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ─── Teacher Schedule ─────────────────────────────────────────────────────────

interface TimetableSlot {
  day: string;
  time: string;
  className: string;
  course: string;
  room: string;
}

export function TeacherSchedule() {
  const { session } = useAuth();
  const empId = session?.user?.id ?? "";

  const { data: schedule = [], isLoading } = useQuery<TimetableSlot[]>({
    queryKey: ["timetable", "teacher", empId],
    queryFn: () => apiGet<TimetableSlot[]>(`/api/timetable/teacher/${empId}`),
    enabled: !!empId,
  });

  return (
    <AppShell title="Schedule">
      <div className="grid gap-5">
        {isLoading ? (
          <div className="h-40 rounded border border-border bg-surface animate-pulse" />
        ) : schedule.length === 0 ? (
          <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            No timetable found.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-cream-200">
                  <tr>
                    {["Day", "Time", "Class", "Course", "Room"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((s, i) => (
                    <tr key={i} className="border-t border-border even:bg-cream-50">
                      <td className="px-4 py-2 font-medium">{s.day}</td>
                      <td className="px-4 py-2">{s.time}</td>
                      <td className="px-4 py-2">{s.className}</td>
                      <td className="px-4 py-2">{s.course}</td>
                      <td className="px-4 py-2">{s.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text-muted">
              {schedule.length} sessions/week across{" "}
              {new Set(schedule.map((s) => s.className)).size} classes
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}

// ─── Teacher Profile ──────────────────────────────────────────────────────────

interface TeacherProfileData {
  phone: string;
  dept: string;
  designation: string;
  qualification: string;
  experience: string;
  specialisation: string;
}

export function TeacherProfile() {
  const { session } = useAuth();
  const empId = session?.user?.id ?? "";

  const { data: profileData } = useQuery<TeacherProfileData>({
    queryKey: ["teacher-profile", empId],
    queryFn: () => apiGet<TeacherProfileData>(`/api/users/${empId}/profile`),
    enabled: !!empId,
  });
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState<Partial<TeacherProfileData>>({});
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const profile = {
    phone: edits.phone ?? profileData?.phone ?? "",
    dept: profileData?.dept ?? "",
    designation: profileData?.designation ?? "",
    qualification: edits.qualification ?? profileData?.qualification ?? "",
    experience: edits.experience ?? profileData?.experience ?? "",
    specialisation: edits.specialisation ?? profileData?.specialisation ?? "",
  };

  const save = useMutation({
    mutationFn: () => apiPatch(`/api/users/${empId}/profile`, edits),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-profile", empId] });
      setEditing(false);
      setEdits({});
      setSaveMsg("Profile saved.");
    },
    onError: () => setSaveMsg("Save failed. Please try again."),
  });

  const editableFields: { label: string; key: keyof TeacherProfileData; span?: boolean }[] = [
    { label: "Phone", key: "phone" },
    { label: "Qualification", key: "qualification", span: true },
    { label: "Experience", key: "experience" },
    { label: "Specialisation", key: "specialisation", span: true },
  ];

  return (
    <AppShell title="Profile">
      <div className="grid gap-5 max-w-2xl">
        <div className="rounded border border-border bg-surface p-5 flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-[#1C1810] flex items-center justify-center text-xl text-[#F2EFE9] shrink-0">
            {(session?.user?.name ?? "T").charAt(0)}
          </div>
          <div className="flex-1">
            <p className="font-medium text-lg">{session?.user?.name ?? "—"}</p>
            <p className="text-sm text-text-muted">
              {profile.designation || "Faculty"} · {profile.dept || "—"}
            </p>
            <p className="text-xs text-text-muted">{empId}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (editing) save.mutate();
              else setEditing(true);
            }}
            disabled={save.isPending}
          >
            {save.isPending ? "Saving…" : editing ? "Save" : "Edit"}
          </Button>
        </div>

        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">Professional Details</p>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-text-muted mb-1">Email</p>
                <p className="text-sm font-medium">{session?.user?.email ?? "—"}</p>
              </div>
              {editableFields.map((f) => (
                <div key={f.key} className={f.span ? "col-span-2" : ""}>
                  <p className="text-xs text-text-muted mb-1">{f.label}</p>
                  {editing ? (
                    <input
                      value={(edits[f.key] ?? profile[f.key]) as string}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none"
                    />
                  ) : (
                    <p className="text-sm font-medium">{profile[f.key] || "—"}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          {saveMsg && (
            <p
              className={`text-xs mt-3 ${saveMsg.includes("saved") ? "text-[#3D6B4F]" : "text-[#8B2F2F]"}`}
            >
              {saveMsg}
            </p>
          )}
        </div>

        <div className="rounded border border-border bg-surface p-4">
          <p className="label-track mb-3">Account</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline">
              Change Password
            </Button>
            <Button size="sm" variant="outline">
              Download ID Card
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Generate Reports ─────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { title: "Attendance Report", desc: "Class-wise / student-wise attendance for selected period", icon: "📊" },
  { title: "IA Marks Report", desc: "Internal assessment marks with statistics and analytics", icon: "📝" },
  { title: "At-Risk Students", desc: "Students below attendance/marks threshold", icon: "⚠️" },
  { title: "Assignment Completion", desc: "Submission rates and grading statistics", icon: "📋" },
  { title: "Syllabus Coverage", desc: "Topics covered vs pending for each course", icon: "📚" },
  { title: "Performance Comparison", desc: "Batch comparison across semesters", icon: "📈" },
] as const;

export function GenerateReports() {
  // KAN-74 — previously the PDF/Excel buttons had no onClick handler so
  // nothing happened on click. Wire each button to POST the report type +
  // requested format to the BFF and trigger a browser download.
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (reportType: string, format: "pdf" | "excel") => {
    const key = `${reportType}:${format}`;
    setBusyKey(key);
    setError(null);
    try {
      const ext = format === "excel" ? "csv" : "pdf";
      const slug = reportType.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const filename = `${slug}-${new Date().toISOString().slice(0, 10)}.${ext}`;
      await apiDownloadPost("/api/teacher/reports/generate", { reportType, format }, filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <AppShell title="Generate Reports">
      <div className="grid gap-5 max-w-3xl">
        {error && (
          <div className="rounded bg-[#F5E6E6] px-4 py-3 text-sm text-[#8B2F2F]">
            {error}
          </div>
        )}

        {/* KAN-74 follow-up: full Excel → per-student PDF + ZIP flow */}
        <a
          href="/teacher/reports/attendance-generator"
          className="rounded border border-border bg-surface p-4 flex gap-3 hover:bg-cream-50 transition-colors"
        >
          <span className="text-2xl shrink-0">📈</span>
          <div className="flex-1">
            <p className="font-medium text-sm">Attendance Report Generator</p>
            <p className="text-xs text-text-muted mt-0.5">
              Upload the marks sheet, generate one signed-format PDF per
              student, and download as a ZIP — ready to mail to parents.
            </p>
            <p className="text-xs text-[#3D6B4F] mt-2">Open generator →</p>
          </div>
        </a>

        <div className="grid gap-3 sm:grid-cols-2">
          {REPORT_TYPES.map((r) => (
            <div key={r.title} className="rounded border border-border bg-surface p-4 flex gap-3">
              <span className="text-2xl shrink-0">{r.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{r.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{r.desc}</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => void handleDownload(r.title, "pdf")}
                    disabled={busyKey === `${r.title}:pdf`}
                  >
                    {busyKey === `${r.title}:pdf` ? "…" : "PDF"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => void handleDownload(r.title, "excel")}
                    disabled={busyKey === `${r.title}:excel`}
                  >
                    {busyKey === `${r.title}:excel` ? "…" : "Excel"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ─── Teacher VTU ─────────────────────────────────────────────────────────────

interface VTUEligibilityRow {
  usn: string;
  name: string;
  eligible: boolean;
  reasons: string[];
  attendancePct: number;
}

export function TeacherVTU() {
  const { data: classes = [] } = useClasses();
  const [classId, setClassId] = useState("");
  const [submitMsg, setSubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(classes[0]!.id);
  }, [classes, classId]);

  const { data: eligibility = [], isLoading } = useQuery<VTUEligibilityRow[]>({
    queryKey: ["vtu-eligibility", classId],
    queryFn: () => apiGet<VTUEligibilityRow[]>(`/api/vtu/teacher/eligibility?classId=${classId}`),
    enabled: !!classId,
  });

  const qc = useQueryClient();
  const submit = useMutation({
    mutationFn: () => apiPost(`/api/vtu/teacher/submit`, { classId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vtu-eligibility", classId] });
      setSubmitMsg({ type: "success", text: "Eligibility submitted to admin." });
    },
    onError: () => setSubmitMsg({ type: "error", text: "Submission failed. Please try again." }),
  });

  const eligible = eligibility.filter((r) => r.eligible).length;
  const detained = eligibility.filter((r) => !r.eligible).length;

  return (
    <AppShell title="VTU Registration">
      <div className="grid gap-5">
        <div className="flex items-center gap-3">
          <span className="text-xs label-track">Class</span>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
          >
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="h-32 rounded border border-border bg-surface animate-pulse" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { label: "Total Students", value: eligibility.length },
                { label: "Eligible", value: eligible },
                { label: "Detained", value: detained },
              ].map((s) => (
                <div key={s.label} className="rounded border border-border bg-surface p-4">
                  <p className="label-track">{s.label}</p>
                  <p className="text-2xl font-light mt-1">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-cream-200">
                  <tr>
                    {["USN", "Student", "Attendance", "Eligible", "Reason"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eligibility.map((r) => (
                    <tr key={r.usn} className="border-t border-border even:bg-cream-50">
                      <td className="px-4 py-2 font-mono text-xs">{r.usn}</td>
                      <td className="px-4 py-2 font-medium">{r.name}</td>
                      <td
                        className={cn(
                          "px-4 py-2 font-medium",
                          r.attendancePct < 75 ? "text-[#8B2F2F]" : "text-[#3D6B4F]",
                        )}
                      >
                        {r.attendancePct}%
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            r.eligible
                              ? "bg-[#EBF3EE] text-[#3D6B4F]"
                              : "bg-[#F5E6E6] text-[#8B2F2F]",
                          )}
                        >
                          {r.eligible ? "Eligible" : "Detained"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-[#8B2F2F]">
                        {r.reasons.join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {eligibility.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-text-muted">
                  No data for this class.
                </p>
              )}
            </div>
            {submitMsg && (
              <p
                className={`text-xs ${submitMsg.type === "success" ? "text-[#3D6B4F]" : "text-[#8B2F2F]"}`}
              >
                {submitMsg.text}
              </p>
            )}
            <Button
              size="sm"
              className="self-start"
              onClick={() => submit.mutate()}
              disabled={submit.isPending || eligibility.length === 0}
            >
              {submit.isPending ? "Submitting…" : "Submit Eligibility to Admin"}
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}

// ─── Performance Drop Alert ───────────────────────────────────────────────────

export function PerformanceDrop() {
  const { data: classes = [] } = useClasses();
  const [classId, setClassId] = useState("");
  const [triggering, setTriggering] = useState<string | null>(null);
  const [notifyMsg, setNotifyMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(classes[0]!.id);
  }, [classes, classId]);

  const { data: atRisk = [], isLoading } = useAtRiskStudents(classId);
  const triggerCall = useTriggerCall();
  const qc = useQueryClient();

  function handleCall(s: { usn: string; parentPhone: string }) {
    setTriggering(s.usn);
    triggerCall.mutate(
      {
        studentUsn: s.usn,
        parentPhone: s.parentPhone,
        reason: "PERFORMANCE_DROP",
        language: "kn",
      },
      {
        onSettled: () => setTriggering(null),
        onSuccess: () => {
          setNotifyMsg((m) => ({ ...m, [`call_${s.usn}`]: "Call triggered." }));
          qc.invalidateQueries({ queryKey: ["comms"] });
        },
      },
    );
  }

  async function handleNotifyCounsellor(usn: string) {
    try {
      await apiPost("/api/comms/counsellor-referral", { studentUsn: usn });
      setNotifyMsg((m) => ({ ...m, [`counsellor_${usn}`]: "Counsellor notified." }));
    } catch {
      setNotifyMsg((m) => ({ ...m, [`counsellor_${usn}`]: "Failed to notify." }));
    }
  }

  return (
    <AppShell title="Performance Drop Alert">
      <div className="grid gap-5">
        <div className="flex items-center gap-3">
          <span className="text-xs label-track">Class</span>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
          >
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded border border-border bg-surface animate-pulse" />
            ))}
          </div>
        ) : atRisk.length === 0 ? (
          <div className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            No at-risk students in this class.
          </div>
        ) : (
          <>
            <div className="rounded border-l-4 border-l-[#8B6914] bg-[#FDF9F0] p-4">
              <p className="font-medium text-[#8B6914]">
                ⚠️ {atRisk.length} students below 75% attendance
              </p>
            </div>
            <div className="grid gap-3">
              {atRisk.map((s) => (
                <div key={s.usn} className="rounded border border-border bg-surface p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-text-muted">{s.usn}</p>
                      <div className="flex gap-4 mt-1 text-xs text-text-muted">
                        <span>
                          Attendance:{" "}
                          <strong className="text-[#8B2F2F]">{s.pct}%</strong>
                        </span>
                        {(s.consecutiveAbsences ?? 0) > 0 && (
                          <span className="text-[#8B2F2F]">
                            ⚠️ {s.consecutiveAbsences} consecutive absences
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-1 text-xs">
                        {notifyMsg[`call_${s.usn}`] && (
                          <span className="text-[#3D6B4F]">{notifyMsg[`call_${s.usn}`]}</span>
                        )}
                        {notifyMsg[`counsellor_${s.usn}`] && (
                          <span className="text-[#3D6B4F]">{notifyMsg[`counsellor_${s.usn}`]}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => void handleNotifyCounsellor(s.usn)}
                        >
                          Notify Counsellor
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          disabled={triggering === s.usn || triggerCall.isPending}
                          onClick={() => handleCall({ usn: s.usn, parentPhone: s.parentPhone })}
                        >
                          {triggering === s.usn ? "Calling…" : "Call Parent"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
