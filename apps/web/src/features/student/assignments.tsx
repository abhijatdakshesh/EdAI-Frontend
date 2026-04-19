"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded" | "late";
  marks?: number;
  maxMarks?: number;
  description: string;
}

const ASSIGNMENTS: Assignment[] = [
  { id: "a1", title: "ML Model Comparison Report", course: "Machine Learning", dueDate: "2025-01-15", status: "pending", maxMarks: 20, description: "Compare SVM, Random Forest, and Neural Network on MNIST dataset. Report accuracy, precision, recall, F1." },
  { id: "a2", title: "Hadoop MapReduce Implementation", course: "Big Data Analytics", dueDate: "2025-01-18", status: "pending", maxMarks: 25, description: "Implement word count and log analysis using Hadoop MapReduce. Submit code + 2-page report." },
  { id: "a3", title: "RSA Algorithm Implementation", course: "Cryptography", dueDate: "2025-01-10", status: "submitted", maxMarks: 20, description: "Implement RSA encryption/decryption with key generation in Python." },
  { id: "a4", title: "Distributed Hash Table", course: "Distributed Systems", dueDate: "2025-01-05", status: "graded", marks: 19, maxMarks: 20, description: "Chord DHT implementation with node join/leave operations." },
  { id: "a5", title: "ER Diagram — Library System", course: "Big Data Analytics", dueDate: "2024-12-20", status: "late", maxMarks: 15, description: "Design ER diagram for a library management system with all entities and relationships." },
];

const statusStyle: Record<string, string> = {
  pending: "bg-[#F5EDDB] text-[#8B6914]",
  submitted: "bg-[#E6EEF5] text-[#2F567A]",
  graded: "bg-[#EBF3EE] text-[#3D6B4F]",
  late: "bg-[#F5E6E6] text-[#8B2F2F]",
};

export function MyAssignments() {
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [filter, setFilter] = useState<"all"|"pending"|"submitted"|"graded">("all");

  const filtered = ASSIGNMENTS.filter(a => filter==="all" || a.status===filter);

  return (
    <AppShell title="My Assignments">
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-4">
          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-border">
            {(["all","pending","submitted","graded"] as const).map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                className={cn("px-4 py-2 text-sm capitalize transition-colors",
                  filter===f ? "border-b-2 border-[#1C1810] font-medium" : "text-text-muted hover:text-text-primary")}>
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          {filtered.map(a=>(
            <button key={a.id} onClick={()=>setSelected(a)}
              className={cn("rounded border p-4 text-left transition-colors",
                selected?.id===a.id ? "border-[#1C1810] bg-cream-100" : "border-border bg-surface hover:border-[#1C1810]")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{a.course}</p>
                </div>
                <span className={cn("rounded px-2 py-0.5 text-xs font-medium shrink-0", statusStyle[a.status])}>{a.status}</span>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-text-muted">
                <span>📅 Due: {a.dueDate}</span>
                {a.marks !== undefined && <span>✓ {a.marks}/{a.maxMarks}</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        {selected ? (
          <div className="rounded border border-border bg-surface p-5 self-start sticky top-4">
            <p className="label-track">Assignment Details</p>
            <h3 className="mt-2 text-lg font-medium leading-snug">{selected.title}</h3>
            <p className="text-xs text-text-muted">{selected.course}</p>
            <span className="ray-rule ml-0" />
            <p className="text-sm text-text-secondary mb-4">{selected.description}</p>
            <dl className="grid gap-2 text-sm mb-4">
              <div className="flex justify-between border-b border-border pb-1">
                <dt className="text-text-muted">Due Date</dt><dd>{selected.dueDate}</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-1">
                <dt className="text-text-muted">Max Marks</dt><dd>{selected.maxMarks}</dd>
              </div>
              {selected.marks !== undefined && (
                <div className="flex justify-between border-b border-border pb-1">
                  <dt className="text-text-muted">Marks Obtained</dt>
                  <dd className="font-medium text-[#3D6B4F]">{selected.marks}/{selected.maxMarks}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-text-muted">Status</dt>
                <dd><span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusStyle[selected.status])}>{selected.status}</span></dd>
              </div>
            </dl>
            {selected.status === "pending" && (
              <button className="w-full rounded bg-[#1C1810] py-2 text-sm text-[#F2EFE9] transition-colors hover:bg-[#2C2418]">
                Submit Assignment
              </button>
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
