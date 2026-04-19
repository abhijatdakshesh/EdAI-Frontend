"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api/client";
import { useClasses } from "@/lib/api/academics";

interface AuditRecord {
  id: string;
  studentUsn: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  date: string;
  period: number;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  markedBy: string;
  markedByName: string;
  corrected: boolean;
  correctionNote?: string;
}

const statusStyle: Record<string, string> = {
  PRESENT: "bg-[#EBF3EE] text-[#3D6B4F]",
  ABSENT: "bg-[#F5E6E6] text-[#8B2F2F]",
  LATE: "bg-[#F5EDDB] text-[#8B6914]",
  EXCUSED: "bg-[#E6EEF5] text-[#2F567A]",
};

export function AttendanceAudit() {
  const qc = useQueryClient();
  const { data: classes = [] } = useClasses();
  const [classId, setClassId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("PRESENT");
  const [editNote, setEditNote] = useState("");

  const { data: records = [], isLoading } = useQuery<AuditRecord[]>({
    queryKey: ["attendance-audit", classId, from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (classId) params.set("classId", classId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      return apiGet<AuditRecord[]>(`/api/admin/attendance/audit?${params.toString()}`);
    },
    enabled: !!classId,
  });

  const correctRecord = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note: string }) =>
      apiPatch(`/api/admin/attendance/audit/${id}`, { status, correctionNote: note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-audit"] });
      setEditId(null);
    },
  });

  const corrected = records.filter((r) => r.corrected).length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;

  return (
    <AppShell title="Attendance Audit">
      <div className="grid gap-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Records", value: records.length },
            { label: "Absent", value: absentCount },
            { label: "Corrected", value: corrected },
            { label: "Correction Rate", value: records.length > 0 ? `${((corrected / records.length) * 100).toFixed(1)}%` : "—" },
          ].map((s) => (
            <div key={s.label} className="rounded border border-border bg-surface p-4">
              <p className="label-track">{s.label}</p>
              <p className="mt-1 text-3xl font-light">{isLoading ? "—" : s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 rounded border border-border bg-surface p-4">
          <div className="grid gap-1">
            <span className="text-xs label-track">Class</span>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
            >
              <option value="">Select class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid gap-1">
            <span className="text-xs label-track">From Date</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none" />
          </div>
          <div className="grid gap-1">
            <span className="text-xs label-track">To Date</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none" />
          </div>
        </div>

        {!classId && (
          <div className="rounded border border-dashed border-border p-12 text-center text-sm text-text-muted">
            Select a class to view attendance records for audit.
          </div>
        )}

        {classId && (
          isLoading ? (
            <p className="text-sm text-text-muted">Loading records…</p>
          ) : (
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm">
                <thead className="bg-cream-200">
                  <tr>
                    {["USN", "Student", "Course", "Date", "Period", "Status", "Marked By", "Action"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-t border-border even:bg-cream-50">
                      <td className="px-4 py-2 font-mono text-xs">{r.studentUsn}</td>
                      <td className="px-4 py-2">{r.studentName}</td>
                      <td className="px-4 py-2 text-text-muted">{r.courseCode}</td>
                      <td className="px-4 py-2">{r.date}</td>
                      <td className="px-4 py-2 text-center">{r.period}</td>
                      <td className="px-4 py-2">
                        {editId === r.id ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="rounded border border-border bg-white px-2 py-1 text-xs focus:outline-none"
                          >
                            {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusStyle[r.status])}>
                            {r.status}
                            {r.corrected && " ✏"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-text-muted text-xs">{r.markedByName}</td>
                      <td className="px-4 py-2">
                        {editId === r.id ? (
                          <div className="flex gap-1">
                            <input
                              placeholder="Reason"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              className="rounded border border-border bg-white px-2 py-1 text-xs w-24 focus:outline-none"
                            />
                            <button
                              className="text-xs text-[#3D6B4F] hover:underline"
                              onClick={() => correctRecord.mutate({ id: r.id, status: editStatus, note: editNote })}
                            >
                              Save
                            </button>
                            <button className="text-xs text-text-muted hover:underline" onClick={() => setEditId(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-xs text-[#2F567A] hover:underline"
                            onClick={() => {
                              setEditId(r.id);
                              setEditStatus(r.status);
                              setEditNote(r.correctionNote ?? "");
                            }}
                          >
                            Correct
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {records.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-text-muted">
                  No records found for the selected filters.
                </p>
              )}
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}
