"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";

const CLASSES = [
  { id: "cls1", name: "CSE 6A", course: "Machine Learning (21CS61)", strength: 60, present: 52, absent: 8, avgAtt: 87 },
  { id: "cls2", name: "CSE 6B", course: "Machine Learning (21CS61)", strength: 58, present: 49, absent: 9, avgAtt: 83 },
  { id: "cls3", name: "CSE 5A", course: "ML Lab (21CSL57)", strength: 30, present: 29, absent: 1, avgAtt: 95 },
];

const STUDENTS: Record<string, { usn: string; name: string; att: number }[]> = {
  cls1: [
    { usn: "1RVCE22CS001", name: "Aakash Singh", att: 63 },
    { usn: "1RVCE22CS002", name: "Bhavana Rao", att: 90 },
    { usn: "1RVCE22CS003", name: "Chetan Kumar", att: 78 },
    { usn: "1RVCE22CS004", name: "Deepa Nair", att: 95 },
    { usn: "1RVCE22CS005", name: "Eshan Mehta", att: 72 },
  ],
};

export function MyClasses() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <AppShell title="My Classes">
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-3">
          {CLASSES.map(c=>(
            <button key={c.id} onClick={()=>setSelected(selected===c.id?null:c.id)}
              className={cn("rounded border p-4 text-left transition-colors",
                selected===c.id?"border-[#1C1810] bg-cream-100":"border-border bg-surface hover:border-[#1C1810]")}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-text-muted">{c.course}</p>
                </div>
                <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                  c.avgAtt>=85?"bg-[#EBF3EE] text-[#3D6B4F]":c.avgAtt>=75?"bg-[#F5EDDB] text-[#8B6914]":"bg-[#F5E6E6] text-[#8B2F2F]")}>
                  Avg {c.avgAtt}%
                </span>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-text-muted">
                <span>👥 {c.strength} students</span>
                <span>✓ {c.present} present</span>
                <span>✗ {c.absent} absent today</span>
              </div>
            </button>
          ))}
        </div>

        {selected && STUDENTS[selected] ? (
          <div className="rounded border border-border bg-surface p-4 self-start">
            <p className="label-track mb-3">Students — {CLASSES.find(c=>c.id===selected)?.name}</p>
            <div className="grid gap-2">
              {STUDENTS[selected].map(s=>(
                <div key={s.usn} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-text-muted">{s.usn}</p>
                  </div>
                  <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                    s.att>=85?"bg-[#EBF3EE] text-[#3D6B4F]":s.att>=75?"bg-[#F5EDDB] text-[#8B6914]":"bg-[#F5E6E6] text-[#8B2F2F]")}>
                    {s.att}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted self-start">
            Select a class to view students
          </div>
        )}
      </div>
    </AppShell>
  );
}
