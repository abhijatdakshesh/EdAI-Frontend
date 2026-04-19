"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";

const ANNOUNCEMENTS = [
  { id: "an1", title: "IA-2 Examination Schedule — Semester 6", category: "Exam", date: "2025-01-10", important: true, body: "IA-2 exams are scheduled from January 14–17, 2025. Theory subjects will be held in respective classrooms. Lab exams will follow the regular lab schedule. Students are advised to carry their ID cards." },
  { id: "an2", title: "Infosys Campus Drive — Jan 18", category: "Placement", date: "2025-01-09", important: true, body: "Infosys will conduct a campus placement drive on January 18, 2025. Eligible: CSE, ISE, ECE students with CGPA ≥ 7.0 and no active backlogs. Register by Jan 16 via the Placement Portal." },
  { id: "an3", title: "Annual Sports Day — Jan 25", category: "Event", date: "2025-01-08", important: false, body: "The Annual Sports Day will be held on January 25, 2025 at RV Ground. Register for events at the Sports Department office by January 20." },
  { id: "an4", title: "Library Book Return Deadline", category: "General", date: "2025-01-07", important: false, body: "All students who have borrowed books from the central library must return them by January 20, 2025. Fine of ₹5/day will be charged for overdue books after the deadline." },
  { id: "an5", title: "Project Work Submissions — Final Year", category: "Academic", date: "2025-01-05", important: false, body: "Final year project reports (Phase 2) must be submitted in soft copy (PDF) via the portal and hard copy to the department office by February 1, 2025." },
];

const catColors: Record<string, string> = {
  Exam: "bg-[#F5E6E6] text-[#8B2F2F]",
  Placement: "bg-[#EBF3EE] text-[#3D6B4F]",
  Event: "bg-[#E6EEF5] text-[#2F567A]",
  General: "bg-[#F0EEEB] text-[#6B6358]",
  Academic: "bg-[#F5EDDB] text-[#8B6914]",
};

export function StudentAnnouncements() {
  const [selected, setSelected] = useState(ANNOUNCEMENTS[0]);

  return (
    <AppShell title="Announcements">
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-2">
          {ANNOUNCEMENTS.map(a=>(
            <button key={a.id} onClick={()=>setSelected(a)}
              className={cn("rounded border p-4 text-left transition-colors",
                selected.id===a.id ? "border-[#1C1810] bg-cream-100" : "border-border bg-surface hover:border-[#1C1810]")}>
              <div className="flex items-start gap-2 justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {a.important && <span className="text-[#8B2F2F] text-xs font-bold">●</span>}
                    <p className="font-medium text-sm leading-snug">{a.title}</p>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{a.date}</p>
                </div>
                <span className={cn("rounded px-2 py-0.5 text-xs font-medium shrink-0", catColors[a.category])}>{a.category}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="rounded border border-border bg-surface p-5 self-start sticky top-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", catColors[selected.category])}>{selected.category}</span>
            {selected.important && <span className="text-xs text-[#8B2F2F] font-medium">Important</span>}
          </div>
          <h3 className="text-lg font-medium leading-snug mt-1">{selected.title}</h3>
          <p className="text-xs text-text-muted mb-4">{selected.date}</p>
          <p className="text-sm text-text-secondary leading-relaxed">{selected.body}</p>
        </div>
      </div>
    </AppShell>
  );
}
