"use client";

import { useRef, useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api/client";

type ImportType = "students" | "faculty" | "courses" | "attendance";

interface ImportJob {
  id: string;
  type: ImportType;
  filename: string;
  rows: number;
  status: "completed" | "failed" | "processing";
  errors: number;
  createdAt: string;
}

const RECENT_JOBS: ImportJob[] = [
  { id: "j1", type: "students", filename: "students_2024_batch.xlsx", rows: 480, status: "completed", errors: 2, createdAt: "2025-01-10 09:30" },
  { id: "j2", type: "faculty", filename: "faculty_jan2025.csv", rows: 45, status: "completed", errors: 0, createdAt: "2025-01-08 14:15" },
  { id: "j3", type: "courses", filename: "courses_even_sem.xlsx", rows: 120, status: "failed", errors: 15, createdAt: "2025-01-05 11:00" },
  { id: "j4", type: "attendance", filename: "attendance_dec.csv", rows: 3200, status: "processing", errors: 0, createdAt: "2025-01-12 08:45" },
];

const statusColors = {
  completed: "bg-[#EBF3EE] text-[#3D6B4F]",
  failed: "bg-[#F5E6E6] text-[#8B2F2F]",
  processing: "bg-[#F5EDDB] text-[#8B6914]",
};

export function BulkImport() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<ImportType>("students");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      await apiPost<void>(`/api/admin/import/${selectedType}`, form);
      void qc.invalidateQueries({ queryKey: ["import-jobs"] });
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void uploadFile(file);
  };

  const handleBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
    e.target.value = "";
  };

  const TEMPLATES: Record<ImportType, string[]> = {
    students: ["USN","Name","Email","Department","Semester","Section","DOB","Phone","Parent Email"],
    faculty: ["Employee ID","Name","Email","Department","Designation","Joining Date","Phone"],
    courses: ["Course Code","Title","Department","Semester","Credits","Type","Faculty Email"],
    attendance: ["Date","USN","Course Code","Status (P/A/L)"],
  };

  return (
    <AppShell title="Bulk Import">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          {/* Type selector */}
          <div>
            <p className="label-track mb-2">Import Type</p>
            <div className="flex flex-wrap gap-2">
              {(["students","faculty","courses","attendance"] as ImportType[]).map(t=>(
                <button key={t} onClick={()=>setSelectedType(t)}
                  className={cn("rounded border px-4 py-2 text-sm capitalize transition-colors",
                    selectedType===t ? "border-[#1C1810] bg-[#1C1810] text-[#F2EFE9]" : "border-border hover:border-[#1C1810]")}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Template */}
          <div className="rounded border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="label-track">Required Columns — {selectedType}</p>
              <Button size="sm" variant="outline">Download Template</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {TEMPLATES[selectedType].map(col=>(
                <span key={col} className="rounded bg-cream-100 px-2 py-0.5 text-xs font-mono">{col}</span>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop}
            className={cn("rounded border-2 border-dashed p-10 text-center transition-colors",
              dragOver ? "border-[#1C1810] bg-cream-100" : "border-border")}>
            {uploading ? (
              <p className="text-sm text-text-secondary animate-pulse">Processing file…</p>
            ) : (
              <>
                <p className="text-3xl mb-2">📂</p>
                <p className="text-sm font-medium">Drop your CSV or Excel file here</p>
                <p className="text-xs text-text-muted mt-1">or</p>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBrowse} />
                <Button size="sm" variant="outline" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </Button>
              </>
            )}
          </div>
          {uploadError && <p className="text-sm text-[#8B2F2F]">Upload failed: {uploadError}</p>}
        </div>

        {/* Recent jobs */}
        <div>
          <p className="label-track mb-3">Recent Imports</p>
          <div className="grid gap-2">
            {RECENT_JOBS.map(job=>(
              <div key={job.id} className="rounded border border-border bg-surface p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase text-text-muted">{job.type}</p>
                    <p className="text-sm font-medium">{job.filename}</p>
                    <p className="text-xs text-text-muted mt-0.5">{job.rows} rows · {job.createdAt}</p>
                  </div>
                  <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusColors[job.status])}>
                    {job.status}
                  </span>
                </div>
                {job.errors > 0 && (
                  <p className="mt-1 text-xs text-[#8B2F2F]">{job.errors} row errors — <button className="underline">View</button></p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
