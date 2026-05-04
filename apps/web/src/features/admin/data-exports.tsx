"use client";

/**
 * Data Exports — Admin portal
 *
 * Solves: "Data in different formats"
 * Principal can download student data, attendance, marks, VTU eligibility
 * in CSV, Excel, PDF, or VTU-portal format.
 */

import { useState } from "react";
import { getSession } from "next-auth/react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExportFormat = "CSV" | "XLSX" | "PDF" | "VTU";
type ReportType =
  | "STUDENT_MASTER"
  | "ATTENDANCE"
  | "MARKS"
  | "VTU_ELIGIBILITY"
  | "FEE_COLLECTION"
  | "CLASS_STRENGTH";

interface ExportConfig {
  type: ReportType;
  label: string;
  description: string;
  icon: string;
  availableFormats: ExportFormat[];
  vtuNote?: string;
}

const EXPORTS: ExportConfig[] = [
  {
    type: "STUDENT_MASTER",
    label: "Student Master List",
    description: "Complete student roster with USN, name, department, semester, contact details, and fee status.",
    icon: "👥",
    availableFormats: ["CSV", "XLSX", "PDF", "VTU"],
    vtuNote: "VTU format: pipe-delimited, required for portal upload",
  },
  {
    type: "ATTENDANCE",
    label: "Attendance Report",
    description: "Subject-wise attendance percentage for all students. Highlights students below 75% threshold.",
    icon: "📋",
    availableFormats: ["CSV", "XLSX", "PDF", "VTU"],
    vtuNote: "VTU format: USN|NAME|DEPT|SEM|ATT_PCT|ELIGIBLE",
  },
  {
    type: "MARKS",
    label: "Marks Report (IA + Final)",
    description: "IA1, IA2, best-of-2 calculation, final exam marks, total, and grade for every student.",
    icon: "📊",
    availableFormats: ["CSV", "XLSX", "PDF", "VTU"],
    vtuNote: "VTU format: USN|NAME|IA_BEST|SEE — ready for VTU marks upload",
  },
  {
    type: "VTU_ELIGIBILITY",
    label: "VTU Exam Eligibility",
    description: "Combined eligibility check: attendance ≥ 75%, IA ≥ 8/20, fees paid. Generates eligible/detained list for VTU.",
    icon: "🎓",
    availableFormats: ["CSV", "XLSX", "PDF", "VTU"],
    vtuNote: "VTU format: directly submittable to VTU portal as eligibility file",
  },
  {
    type: "FEE_COLLECTION",
    label: "Fee Collection Report",
    description: "Student-wise fee payment status, outstanding amounts, receipt numbers, and payment dates.",
    icon: "💰",
    availableFormats: ["CSV", "XLSX", "PDF"],
  },
  {
    type: "CLASS_STRENGTH",
    label: "Class Strength Report",
    description: "Day-wise enrollment vs. present count per class, with department-wise summary.",
    icon: "🏫",
    availableFormats: ["CSV", "XLSX", "PDF"],
  },
];

const formatLabels: Record<ExportFormat, { label: string; color: string }> = {
  CSV: { label: "CSV", color: "bg-[#EBF3EE] text-[#3D6B4F]" },
  XLSX: { label: "Excel", color: "bg-[#E6EEF5] text-[#2F567A]" },
  PDF: { label: "PDF", color: "bg-[#F5E6E6] text-[#8B2F2F]" },
  VTU: { label: "VTU Format", color: "bg-[#F5EDDB] text-[#8B6914]" },
};

interface DownloadingState {
  type: ReportType;
  format: ExportFormat;
}

export function DataExports() {
  const [filters, setFilters] = useState({
    departmentCode: "",
    semester: "",
    academicYear: "2024-25",
  });
  const [downloading, setDownloading] = useState<DownloadingState | null>(null);
  const [lastExported, setLastExported] = useState<Record<string, string>>({});

  async function handleDownload(type: ReportType, format: ExportFormat) {
    setDownloading({ type, format });

    try {
      const body = {
        reportType: type,
        format,
        filters: {
          ...(filters.departmentCode && { departmentCode: filters.departmentCode }),
          ...(filters.semester && { semester: parseInt(filters.semester) }),
          academicYear: filters.academicYear,
        },
        requestedBy: "admin",
      };

      const session = await getSession();
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
      const response = await fetch(`${baseUrl}/api/exports/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...((session as unknown as Record<string, unknown>)?.accessToken ? { Authorization: `Bearer ${(session as unknown as Record<string, unknown>).accessToken as string}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const ext = format === "XLSX" ? "xlsx" : format === "PDF" ? "pdf" : format === "VTU" ? "txt" : "csv";
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);

      setLastExported((prev) => ({
        ...prev,
        [`${type}-${format}`]: new Date().toLocaleTimeString("en-IN"),
      }));
    } catch (err) {
      alert(`Export failed: ${(err as Error).message}`);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <AppShell title="Data Exports">
      <div className="grid gap-5">
        {/* Global filters */}
        <div className="rounded border border-border bg-surface p-4">
          <p className="label-track mb-3">Export Filters (applied to all reports)</p>
          <div className="flex flex-wrap gap-3">
            <div className="grid gap-1">
              <span className="text-xs text-text-muted">Department</span>
              <select
                value={filters.departmentCode}
                onChange={(e) => setFilters({ ...filters, departmentCode: e.target.value })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
              >
                <option value="">All Departments</option>
                {["CSE", "ECE", "ME", "CIVIL", "EEE", "ISE"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-text-muted">Semester</span>
              <select
                value={filters.semester}
                onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-text-muted">Academic Year</span>
              <select
                value={filters.academicYear}
                onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
              >
                {["2024-25", "2023-24", "2022-23"].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          {(filters.departmentCode || filters.semester) && (
            <p className="text-xs text-[#3D6B4F] mt-2">
              ✓ Filters active: {[
                filters.departmentCode && `Dept: ${filters.departmentCode}`,
                filters.semester && `Sem: ${filters.semester}`,
                `Year: ${filters.academicYear}`,
              ].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {/* Report cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPORTS.map((exp) => (
            <div
              key={exp.type}
              className="rounded border border-border bg-surface p-5 flex flex-col gap-4"
            >
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xl">{exp.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{exp.label}</p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                </div>
                {exp.vtuNote && (
                  <div className="rounded bg-[#F5EDDB] px-2 py-1 text-xs text-[#8B6914] mt-2">
                    📌 {exp.vtuNote}
                  </div>
                )}
              </div>

              {/* Format buttons */}
              <div className="flex flex-wrap gap-2 mt-auto">
                {exp.availableFormats.map((fmt) => {
                  const isDownloading =
                    downloading?.type === exp.type && downloading?.format === fmt;
                  const lastTime = lastExported[`${exp.type}-${fmt}`];

                  return (
                    <button
                      key={fmt}
                      disabled={isDownloading}
                      onClick={() => handleDownload(exp.type, fmt)}
                      className={cn(
                        "rounded px-3 py-1.5 text-xs font-medium transition-all",
                        formatLabels[fmt].color,
                        "hover:opacity-80 disabled:opacity-50",
                        isDownloading && "animate-pulse",
                      )}
                    >
                      {isDownloading ? "Downloading…" : `↓ ${formatLabels[fmt].label}`}
                    </button>
                  );
                })}
              </div>

              {/* Last exported time */}
              {Object.entries(lastExported).some(([k]) => k.startsWith(exp.type)) && (
                <p className="text-xs text-[#3D6B4F]">
                  ✓ Last exported:{" "}
                  {Object.entries(lastExported)
                    .filter(([k]) => k.startsWith(exp.type))
                    .map(([k, v]) => `${k.split("-")[1]} at ${v}`)
                    .join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* VTU tip */}
        <div className="rounded border border-[#F5EDDB] bg-[#FDF8F0] p-4 text-sm">
          <p className="font-medium text-[#8B6914]">📋 VTU Submission Guide</p>
          <p className="text-text-secondary mt-1">
            For VTU portal submission: download <strong>VTU Exam Eligibility</strong> and{" "}
            <strong>Marks Report</strong> in "VTU Format". The files are pipe-delimited (.txt)
            and match the VTU portal upload template. Upload these files directly to the VTU
            examination portal under the relevant semester.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
