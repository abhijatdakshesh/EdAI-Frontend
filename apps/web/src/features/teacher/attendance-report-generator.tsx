"use client";

import { useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";

const BRANCHES = [
  "COMPUTER SCIENCE & ENGINEERING",
  "INFORMATION SCIENCE & ENGINEERING",
  "ELECTRONICS & COMMUNICATION ENGINEERING",
  "MECHANICAL ENGINEERING",
  "MASTER OF COMPUTER APPLICATIONS",
] as const;

const TESTS = ["CIE-1", "CIE-2", "CIE-3"] as const;

const SEMESTERS = [
  " I Semester BE  ",
  " II Semester BE  ",
  " III Semester BE  ",
  " IV Semester BE ",
  "V Semester BE",
  "VI Semester BE",
  "VII Semester BE",
  " VIII Semester BE",
  "I Semester MCA",
  "II Semester MCA",
  "III Semester MCA",
  "IV Semester MCA",
  "V Semester MCA",
  "VI Semester MCA",
] as const;

function formatSubmissionDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const suffix =
    day >= 11 && day <= 13
      ? "th"
      : day % 10 === 1
      ? "st"
      : day % 10 === 2
      ? "nd"
      : day % 10 === 3
      ? "rd"
      : "th";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day}${suffix} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

export function AttendanceReportGenerator() {
  const [branch, setBranch] = useState<string>(BRANCHES[0]);
  const [test, setTest] = useState<string>(TESTS[0]);
  const [semester, setSemester] = useState<string>(SEMESTERS[0]);
  const [submissionDate, setSubmissionDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [subjectCount, setSubjectCount] = useState<number>(1);
  const [note, setNote] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const formattedSubmission = useMemo(
    () => formatSubmissionDate(submissionDate),
    [submissionDate],
  );

  const onFilePicked = (f: File | null) => {
    setFile(f);
    setError(null);
    setSuccess(null);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError("Please choose an .xlsx file before generating.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("branch", branch);
      fd.append("test", test);
      fd.append("semester", semester);
      fd.append("submissionDate", formattedSubmission);
      fd.append("note", note);
      fd.append("subjectCount", String(subjectCount));

      const res = await fetch("/api/teacher/reports/attendance/bulk", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error) msg = String(data.error);
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const cd = res.headers.get("content-disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(cd);
      const filename = match?.[1] ?? `attendance-reports-${test}.zip`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`Generated ${filename}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate reports");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Attendance Report Generator">
      <form
        ref={formRef}
        onSubmit={submit}
        className="grid gap-5 max-w-3xl"
        encType="multipart/form-data"
      >
        <div className="rounded border border-border bg-surface p-5 grid gap-4">
          <p className="text-sm text-text-muted">
            Upload the marks/attendance sheet for the selected test. The
            generator produces one PDF per student (header, attendance + marks
            table, signature block) and bundles them into a ZIP. Layout
            mirrors the RV attendance report format.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1 text-sm">
              <span className="label-track">Branch</span>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="label-track">Test</span>
              <select
                value={test}
                onChange={(e) => setTest(e.target.value)}
                className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
              >
                {TESTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="label-track">Semester</span>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s.trim()}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="label-track">Submission Due</span>
              <input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
              />
              {formattedSubmission && (
                <span className="text-xs text-text-muted">
                  {formattedSubmission}
                </span>
              )}
            </label>

            <label className="grid gap-1 text-sm">
              <span className="label-track">Number of Subjects</span>
              <select
                value={subjectCount}
                onChange={(e) => setSubjectCount(Number(e.target.value))}
                className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
              >
                {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-xs text-text-muted">
                Leave at default if unsure — backend will use this value
                directly.
              </span>
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="label-track">General Note (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Attendance considered up till 17th March 2026"
                rows={2}
                className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none resize-none"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="label-track">Marks Sheet (.xlsx)</span>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            {file && (
              <span className="text-xs text-text-muted">
                {file.name} · {(file.size / 1024).toFixed(1)} KB
              </span>
            )}
          </label>

          {error && (
            <div className="rounded bg-[#F5E6E6] px-4 py-3 text-sm text-[#8B2F2F]">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded bg-[#EBF3EE] px-4 py-3 text-sm text-[#3D6B4F]">
              {success}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={busy || !file}>
              {busy ? "Generating…" : "Generate ZIP of PDFs"}
            </Button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
