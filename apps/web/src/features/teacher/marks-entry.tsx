"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClasses } from "@/lib/api/academics";
import {
  useTeacherIAMarks,
  useSaveIAMarks,
  useSubmitIAMarks,
  type IAMarksRow,
} from "@/lib/api/vtu";

export function TeacherMarksEntry() {
  const { data: classes = [] } = useClasses();
  const [subjectId, setSubjectId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [localMarks, setLocalMarks] = useState<Record<string, { ia1: string; ia2: string }>>({});
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: serverRows = [], isLoading } = useTeacherIAMarks(subjectId);
  const saveMarks = useSaveIAMarks();
  const submitMarks = useSubmitIAMarks();

  useEffect(() => {
    if (serverRows.length > 0) {
      const map: Record<string, { ia1: string; ia2: string }> = {};
      serverRows.forEach((r) => {
        map[r.studentUsn] = {
          ia1: r.ia1 !== undefined ? String(r.ia1) : "",
          ia2: r.ia2 !== undefined ? String(r.ia2) : "",
        };
      });
      setLocalMarks(map);
    }
  }, [serverRows]);

  function setMark(usn: string, field: "ia1" | "ia2", value: string) {
    setLocalMarks((prev) => ({
      ...prev,
      [usn]: { ...prev[usn], [field]: value },
    }));
    setSaved(false);
  }

  function handleSave() {
    const entries: IAMarksRow[] = serverRows.map((r) => ({
      studentUsn: r.studentUsn,
      studentName: r.studentName,
      ia1: localMarks[r.studentUsn]?.ia1 !== "" ? Number(localMarks[r.studentUsn]?.ia1) : undefined,
      ia2: localMarks[r.studentUsn]?.ia2 !== "" ? Number(localMarks[r.studentUsn]?.ia2) : undefined,
    }));

    saveMarks.mutate(
      { subjectId, entries },
      { onSuccess: () => setSaved(true) },
    );
  }

  function handleSubmit() {
    if (!confirm("Submit marks for admin review? You can still edit until admin confirms.")) return;
    submitMarks.mutate(subjectId, {
      onSuccess: () => setSubmitted(true),
    });
  }

  const allEntered = serverRows.every((r) => {
    const m = localMarks[r.studentUsn];
    return m?.ia1 !== "" && m?.ia2 !== "";
  });

  if (submitted) {
    return (
      <AppShell title="IA Marks Entry">
        <div className="max-w-lg py-12 text-center grid gap-4">
          <p className="text-4xl">✓</p>
          <p className="text-xl font-medium">Marks Submitted</p>
          <p className="text-sm text-text-muted">
            IA marks for <strong>{subjectName || subjectId}</strong> have been sent for admin review.
          </p>
          <Button size="sm" onClick={() => { setSubjectId(""); setSubmitted(false); setSaved(false); }}>
            Enter Marks for Another Subject
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="IA Marks Entry">
      <div className="grid gap-5">
        {/* Subject selector */}
        <div className="rounded border border-border bg-surface p-4 flex flex-wrap gap-4">
          <div className="grid gap-1">
            <span className="text-xs label-track">Subject Code</span>
            <input
              type="text"
              placeholder="e.g. 21CS61"
              value={subjectId}
              onChange={(e) => { setSubjectId(e.target.value); setSaved(false); setSubmitted(false); }}
              className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none w-36"
            />
          </div>
          <div className="grid gap-1">
            <span className="text-xs label-track">Subject Name</span>
            <input
              type="text"
              placeholder="e.g. Machine Learning"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none w-52"
            />
          </div>
          <div className="grid gap-1">
            <span className="text-xs label-track">Class</span>
            <select
              className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
            >
              <option value="">Select class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {!subjectId && (
          <div className="rounded border border-dashed border-border p-12 text-center text-sm text-text-muted">
            Enter a subject code above to load the student list.
          </div>
        )}

        {subjectId && (
          isLoading ? (
            <p className="text-sm text-text-muted">Loading student list…</p>
          ) : (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-text-muted">
                  {serverRows.length} students · IA marks out of 25
                </div>
                <div className="flex gap-2">
                  {saved && <span className="text-xs text-[#3D6B4F]">✓ Draft saved</span>}
                  <Button size="sm" variant="outline" onClick={handleSave} disabled={saveMarks.isPending}>
                    {saveMarks.isPending ? "Saving…" : "Save Draft"}
                  </Button>
                  <Button
                    size="sm"
                    disabled={!allEntered || submitMarks.isPending}
                    onClick={handleSubmit}
                  >
                    {submitMarks.isPending ? "Submitting…" : "Submit for Review"}
                  </Button>
                </div>
              </div>

              {!allEntered && (
                <p className="text-xs text-[#8B6914]">
                  Enter all IA1 and IA2 marks before submitting.
                </p>
              )}

              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-cream-200">
                    <tr>
                      {["#", "USN", "Student Name", "IA 1 (/ 25)", "IA 2 (/ 25)", "Average"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {serverRows.map((row, i) => {
                      const m = localMarks[row.studentUsn] ?? { ia1: "", ia2: "" };
                      const avg = m.ia1 !== "" && m.ia2 !== ""
                        ? ((Number(m.ia1) + Number(m.ia2)) / 2).toFixed(1)
                        : "—";
                      return (
                        <tr key={row.studentUsn} className="border-t border-border even:bg-cream-50">
                          <td className="px-4 py-2 text-text-muted">{i + 1}</td>
                          <td className="px-4 py-2 font-mono text-xs">{row.studentUsn}</td>
                          <td className="px-4 py-2">{row.studentName}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={0}
                              max={25}
                              value={m.ia1}
                              onChange={(e) => setMark(row.studentUsn, "ia1", e.target.value)}
                              className={cn(
                                "w-20 rounded border px-2 py-1 text-sm focus:outline-none",
                                m.ia1 === "" ? "border-[#8B6914] bg-[#FFFBF0]" : "border-border bg-white",
                              )}
                              placeholder="0–25"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={0}
                              max={25}
                              value={m.ia2}
                              onChange={(e) => setMark(row.studentUsn, "ia2", e.target.value)}
                              className={cn(
                                "w-20 rounded border px-2 py-1 text-sm focus:outline-none",
                                m.ia2 === "" ? "border-[#8B6914] bg-[#FFFBF0]" : "border-border bg-white",
                              )}
                              placeholder="0–25"
                            />
                          </td>
                          <td className={cn("px-4 py-2 font-medium",
                            avg !== "—" ? (Number(avg) >= 12 ? "text-[#3D6B4F]" : "text-[#8B2F2F]") : "text-text-muted")}>
                            {avg}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {serverRows.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-text-muted">
                    No students found for this subject code. Check and try again.
                  </p>
                )}
              </div>
            </>
          )
        )}
      </div>
    </AppShell>
  );
}
