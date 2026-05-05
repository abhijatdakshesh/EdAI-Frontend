"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  useMyChildren,
  useChildAttendance,
  useChildResults,
  useScholarshipEligibility,
} from "@/lib/api/parent";
import { useParentCallHistory, useParentMessages, useSendParentMessage } from "@/lib/api/parent-comms";
import { useAnnouncements } from "@/lib/api/comms";
import { useAuth } from "@/lib/auth/use-auth";
import { apiPost } from "@/lib/api/client";

// ─── My Children ─────────────────────────────────────────────────────────────

export function MyChildren() {
  const router = useRouter();
  const { data: children = [], isLoading } = useMyChildren();

  return (
    <AppShell title="My Children">
      <div className="max-w-xl grid gap-5">
        {isLoading ? (
          <div className="h-40 rounded border border-border bg-surface animate-pulse" />
        ) : children.length === 0 ? (
          <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            No children linked to your account. Contact the college admin office.
          </p>
        ) : (
          children.map((child) => (
            <div key={child.usn} className="rounded border border-border bg-surface p-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-[#1C1810] flex items-center justify-center text-lg text-[#F2EFE9] shrink-0">
                  {child.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-lg">{child.name}</p>
                  <p className="text-sm text-text-muted">{child.usn} · {child.dept}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-xs rounded bg-cream-100 px-2 py-0.5">Sem {child.semester}</span>
                    <span className="text-xs rounded bg-cream-100 px-2 py-0.5">{child.section}</span>
                    <span className="text-xs rounded bg-cream-100 px-2 py-0.5">CGPA {child.cgpa}</span>
                  </div>
                </div>
              </div>
              <span className="ray-rule ml-0" />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Attendance", value: `${child.attendancePct ?? "—"}%` },
                  { label: "Current Sem", value: String(child.semester) },
                  { label: "Department", value: child.dept },
                  { label: "Fee Status", value: child.feeStatus ?? "—" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-xs text-text-muted">{s.label}</p>
                    <p className="font-medium">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/parent/attendance")}
                >
                  View Attendance
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/parent/results")}
                >
                  View Results
                </Button>
              </div>
            </div>
          ))
        )}
        <p className="text-xs text-text-muted">
          To add another child&apos;s profile, contact the college admin office.
        </p>
      </div>
    </AppShell>
  );
}

// ─── Parent Attendance ────────────────────────────────────────────────────────

export function ParentAttendance() {
  const { data: children = [], isLoading: loadingChildren } = useMyChildren();
  const activeUsn = children[0]?.usn ?? "";
  const childName = children[0]?.name ?? "";

  const { data: rawCourses, isLoading: loadingCourses } = useChildAttendance(activeUsn);
  const courses = Array.isArray(rawCourses) ? rawCourses : [];

  const overall =
    courses.length > 0
      ? Math.round(
          courses.reduce((a, c) => a + c.attended, 0) /
            courses.reduce((a, c) => a + c.totalClasses, 0) *
            100,
        )
      : null;

  return (
    <AppShell title="Attendance">
      <div className="grid gap-5 max-w-2xl">
        {loadingChildren || loadingCourses ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded border border-border bg-surface animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            No attendance data available.
          </p>
        ) : (
          <>
            {overall !== null && (
              <div
                className={cn(
                  "rounded border-l-4 p-4 bg-surface",
                  overall >= 75 ? "border-l-[#3D6B4F]" : "border-l-[#8B2F2F]",
                )}
              >
                <p className="label-track">{childName} — Overall Attendance</p>
                <p className="text-4xl font-light mt-1">{overall}%</p>
                {overall < 75 && (
                  <p className="text-sm text-[#8B2F2F] mt-1">⚠️ Below minimum. Detention risk.</p>
                )}
              </div>
            )}
            {courses.map((c) => (
              <div key={c.courseId} className="rounded border border-border bg-surface p-4">
                <div className="flex justify-between mb-1">
                  <div>
                    <p className="font-medium text-sm">{c.courseName}</p>
                    <p className="text-xs text-text-muted">{c.courseCode}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-medium",
                      c.pct >= 85
                        ? "bg-[#EBF3EE] text-[#3D6B4F]"
                        : c.pct >= 75
                          ? "bg-[#F5EDDB] text-[#8B6914]"
                          : "bg-[#F5E6E6] text-[#8B2F2F]",
                    )}
                  >
                    {c.pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-cream-200">
                  <div
                    className={cn("h-2 rounded-full", c.pct >= 75 ? "bg-[#3D6B4F]" : "bg-[#8B2F2F]")}
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {c.attended}/{c.totalClasses} classes attended
                  {c.mustAttend > 0 && (
                    <span className="text-[#8B2F2F] ml-2">
                      · Must attend {c.mustAttend} more to reach 75%
                    </span>
                  )}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </AppShell>
  );
}

// ─── Parent Results ───────────────────────────────────────────────────────────

const gradeStyle: Record<string, string> = {
  O: "bg-[#EBF3EE] text-[#3D6B4F]",
  "A+": "bg-[#E6EEF5] text-[#2F567A]",
  A: "bg-[#F0EBF5] text-[#6B2F8B]",
};

export function ParentResults() {
  const { data: children = [], isLoading: loadingChildren } = useMyChildren();
  const activeUsn = children[0]?.usn ?? "";
  const { data: results, isLoading } = useChildResults(activeUsn);

  const latestSem = results?.semesters[results.semesters.length - 1];

  return (
    <AppShell title="Results">
      <div className="grid gap-5 max-w-2xl">
        {loadingChildren || isLoading ? (
          <div className="h-32 rounded border border-border bg-surface animate-pulse" />
        ) : !results ? (
          <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            No results available.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border-l-4 border-l-[#3D6B4F] bg-surface p-4 col-span-2 sm:col-span-1">
                <p className="label-track">CGPA</p>
                <p className="text-4xl font-light mt-1">
                  {results.cgpa}
                  <span className="text-base text-text-muted ml-1">/ 10</span>
                </p>
              </div>
              {latestSem && (
                <div className="rounded border border-border bg-surface p-4">
                  <p className="label-track">Sem {latestSem.semester} SGPA</p>
                  <p className="text-2xl font-light mt-1">{latestSem.sgpa}</p>
                </div>
              )}
            </div>
            {latestSem && (
              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-cream-200">
                    <tr>
                      {["Code", "Subject", "IA", "Exam", "Total", "Grade"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {latestSem.subjects.map((s) => (
                      <tr key={s.code} className="border-t border-border even:bg-cream-50">
                        <td className="px-4 py-2 font-mono text-xs">{s.code}</td>
                        <td className="px-4 py-2">{s.name}</td>
                        <td className="px-4 py-2">{s.ia}</td>
                        <td className="px-4 py-2">{s.exam}</td>
                        <td className="px-4 py-2">{s.total}</td>
                        <td className="px-4 py-2">
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-xs font-medium",
                              gradeStyle[s.grade] ?? "bg-cream-100",
                            )}
                          >
                            {s.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

// ─── Parent VTU ───────────────────────────────────────────────────────────────

export function ParentVTU() {
  const { data: children = [], isLoading } = useMyChildren();
  const child = children[0];

  return (
    <AppShell title="VTU Registration">
      <div className="grid gap-5 max-w-2xl">
        {isLoading ? (
          <div className="h-32 rounded border border-border bg-surface animate-pulse" />
        ) : !child ? (
          <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            No child profile found.
          </p>
        ) : (
          <>
            <div className="rounded border border-[#3D6B4F] bg-[#F8FCF9] p-5">
              <p className="font-medium text-[#3D6B4F]">Registration Status: In Progress</p>
              <p className="text-sm mt-1">
                VTU Semester {child.semester} registration has been initiated and is pending final
                submission to the VTU portal.
              </p>
            </div>
            <dl className="rounded border border-border bg-surface p-5 grid gap-3 text-sm">
              {[
                ["Student", child.name],
                ["USN", child.usn],
                ["Semester", `Sem ${child.semester}`],
                ["Department", child.dept],
                ["Section", child.section],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between border-b border-border pb-2 last:border-0"
                >
                  <dt className="text-text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>
    </AppShell>
  );
}

// ─── AI Call History ─────────────────────────────────────────────────────────

export function ParentCalls() {
  const { session } = useAuth();
  const parentId = session?.user?.id ?? "";
  const { data: calls = [], isLoading } = useParentCallHistory(parentId);

  const answered = calls.filter((c) => c.outcome === "ANSWERED").length;
  const missed = calls.filter((c) => c.outcome !== "ANSWERED").length;

  return (
    <AppShell title="AI Call History">
      <div className="grid gap-5 max-w-2xl">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Calls", value: isLoading ? "—" : calls.length },
            { label: "Answered", value: isLoading ? "—" : answered },
            { label: "Missed", value: isLoading ? "—" : missed },
          ].map((s) => (
            <div key={s.label} className="rounded border border-border bg-surface p-4">
              <p className="label-track">{s.label}</p>
              <p className="text-2xl font-light mt-1">{s.value}</p>
            </div>
          ))}
        </div>
        {isLoading ? (
          <div className="grid gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded border border-border bg-surface animate-pulse" />
            ))}
          </div>
        ) : calls.length === 0 ? (
          <p className="rounded border border-dashed border-border p-6 text-center text-sm text-text-muted">
            No AI calls on record.
          </p>
        ) : (
          <div className="grid gap-2">
            {calls.map((c) => (
              <div key={c.id} className="rounded border border-border bg-surface p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.triggeredBy.replace(/_/g, " ")}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(c.calledAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {c.language.toUpperCase()} · {c.duration}s
                    </p>
                    {c.summary && (
                      <p className="text-xs text-text-secondary mt-1 p-2 rounded bg-cream-100">
                        {c.summary}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-medium shrink-0 ml-3",
                      c.outcome === "ANSWERED"
                        ? "bg-[#EBF3EE] text-[#3D6B4F]"
                        : "bg-[#F5E6E6] text-[#8B2F2F]",
                    )}
                  >
                    {c.outcome}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── Parent Announcements ─────────────────────────────────────────────────────

export function ParentAnnouncements() {
  const { data: announcements = [], isLoading } = useAnnouncements("PARENT");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = announcements.find((a) => a.id === selectedId) ?? announcements[0];

  return (
    <AppShell title="Announcements">
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className="grid gap-2">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded border border-border bg-surface animate-pulse" />
            ))
          ) : announcements.length === 0 ? (
            <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
              No announcements at this time.
            </p>
          ) : (
            announcements.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={cn(
                  "rounded border p-4 text-left transition-colors",
                  selected?.id === a.id
                    ? "border-[#1C1810] bg-cream-100"
                    : "border-border bg-surface hover:border-[#1C1810]",
                )}
              >
                <p className="font-medium text-sm">{a.title}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {a.postedAt
                    ? new Date(a.postedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                    : "—"}{" "}
                  · {a.category}
                </p>
              </button>
            ))
          )}
        </div>
        {selected && (
          <div className="rounded border border-border bg-surface p-5 self-start sticky top-4">
            <h3 className="text-lg font-medium leading-snug">{selected.title}</h3>
            <p className="text-xs text-text-muted mb-3">
              {selected.postedAt
                ? new Date(selected.postedAt).toLocaleDateString("en-IN", { dateStyle: "long" })
                : "—"}
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">{selected.body}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── Parent Messages ──────────────────────────────────────────────────────────

export function ParentMessages() {
  const { session } = useAuth();
  const parentId = session?.user?.id ?? "";
  const parentName = session?.user?.name ?? "";
  const { data: children = [] } = useMyChildren();
  const childUsn = children[0]?.usn ?? "";

  const { data: messages = [], isLoading } = useParentMessages(parentId);
  const sendMessage = useSendParentMessage();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sendMsg, setSendMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selected = messages.find((m) => m.id === selectedId) ?? messages[0];

  function handleReply() {
    if (!selected || !reply.trim()) return;
    setSendMsg(null);
    sendMessage.mutate(
      {
        parentId,
        parentName,
        studentUsn: childUsn,
        recipientId: selected.recipientId,
        recipientName: selected.recipientName,
        subject: `Re: ${selected.subject}`,
        body: reply.trim(),
      },
      {
        onSuccess: () => {
          setSendMsg({ type: "success", text: "Reply sent." });
          setReply("");
        },
        onError: () => setSendMsg({ type: "error", text: "Failed to send reply." }),
      },
    );
  }

  return (
    <AppShell title="Messages">
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-2">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded border border-border bg-surface animate-pulse" />
            ))
          ) : messages.length === 0 ? (
            <p className="text-sm text-text-muted py-4">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={cn(
                  "rounded border p-4 text-left transition-colors hover:border-[#1C1810]",
                  selected?.id === m.id
                    ? "border-[#1C1810] bg-cream-100"
                    : "border-border bg-surface",
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {m.status === "SENT" && (
                        <span className="h-2 w-2 rounded-full bg-[#2F567A] shrink-0" />
                      )}
                      <p className="font-medium text-sm">{m.subject}</p>
                    </div>
                    <p className="text-xs text-text-muted">To: {m.recipientName}</p>
                  </div>
                  <p className="text-xs text-text-muted">
                    {new Date(m.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <p className="text-xs text-text-secondary mt-1 line-clamp-1">{m.body}</p>
              </button>
            ))
          )}
        </div>
        {selected && (
          <div className="rounded border border-border bg-surface p-5 self-start sticky top-4">
            <p className="font-medium">{selected.subject}</p>
            <p className="text-xs text-text-muted mb-3">
              To {selected.recipientName} ·{" "}
              {new Date(selected.createdAt).toLocaleDateString("en-IN")}
            </p>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">{selected.body}</p>
            {selected.replies.length > 0 && (
              <div className="mb-4 grid gap-2 border-t border-border pt-4">
                <p className="text-xs label-track">Replies</p>
                {selected.replies.map((r) => (
                  <div key={r.id} className="rounded bg-cream-100 p-3">
                    <p className="text-xs font-medium">{r.fromName}</p>
                    <p className="text-sm mt-1 text-text-secondary">{r.body}</p>
                  </div>
                ))}
              </div>
            )}
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              placeholder="Reply to this message…"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none mb-2"
            />
            {sendMsg && (
              <p className={`text-xs mb-2 ${sendMsg.type === "success" ? "text-[#3D6B4F]" : "text-[#8B2F2F]"}`}>
                {sendMsg.text}
              </p>
            )}
            <Button
              size="sm"
              className="w-full"
              disabled={!reply.trim() || sendMessage.isPending}
              onClick={handleReply}
            >
              {sendMessage.isPending ? "Sending…" : "Send Reply"}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── Scholarship Eligibility ──────────────────────────────────────────────────

export function ScholarshipEligibility() {
  const { data: children = [], isLoading: loadingChildren } = useMyChildren();
  const activeUsn = children[0]?.usn ?? "";
  const { data: eligibility, isLoading } = useScholarshipEligibility(activeUsn);
  const [applyMsg, setApplyMsg] = useState<Record<string, string>>({});

  async function handleApply(schemeName: string) {
    setApplyMsg((m) => ({ ...m, [schemeName]: "Submitting…" }));
    try {
      await apiPost("/api/parent/scholarship/apply", { childUsn: activeUsn, schemeName });
      setApplyMsg((m) => ({ ...m, [schemeName]: "Application submitted." }));
    } catch {
      setApplyMsg((m) => ({ ...m, [schemeName]: "Failed. Please try again." }));
    }
  }

  return (
    <AppShell title="Scholarship Eligibility">
      <div className="grid gap-5 max-w-2xl">
        {loadingChildren || isLoading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded border border-border bg-surface animate-pulse" />
            ))}
          </div>
        ) : !eligibility || eligibility.schemes.length === 0 ? (
          <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            No scholarship data available.
          </p>
        ) : (
          <div className="grid gap-3">
            {eligibility.schemes.map((s) => (
              <div key={s.name} className="rounded border p-4 bg-surface">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{s.criteria}</p>
                    <p className="text-xs font-medium text-[#3D6B4F] mt-1">
                      ₹{s.amount.toLocaleString()}/year
                    </p>
                  </div>
                </div>
                {applyMsg[s.name] && (
                  <p className={`text-xs mt-1 ${applyMsg[s.name]?.includes("submitted") ? "text-[#3D6B4F]" : applyMsg[s.name]?.includes("Submitting") ? "text-text-muted" : "text-[#8B2F2F]"}`}>
                    {applyMsg[s.name]}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled={!!applyMsg[s.name]?.includes("submitted")}
                  onClick={() => void handleApply(s.name)}
                >
                  Apply Now
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-text-muted">
          Eligibility is auto-checked based on student data. Contact admin for document submission.
        </p>
      </div>
    </AppShell>
  );
}
