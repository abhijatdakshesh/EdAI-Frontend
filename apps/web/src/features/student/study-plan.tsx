"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLAN = [
  { subject: "Machine Learning", dailyHours: 1.5, weeklyTarget: 10, weeklyDone: 8, topics: ["Neural Networks", "Backpropagation", "CNN basics"], priority: "high" },
  { subject: "Big Data Analytics", dailyHours: 1.0, weeklyTarget: 7, weeklyDone: 7, topics: ["Spark RDD", "Hive Queries"], priority: "medium" },
  { subject: "Cryptography", dailyHours: 1.0, weeklyTarget: 7, weeklyDone: 4, topics: ["PKI", "Digital Signatures", "SSL/TLS"], priority: "high" },
  { subject: "Distributed Systems", dailyHours: 0.5, weeklyTarget: 4, weeklyDone: 3, topics: ["CAP Theorem review"], priority: "low" },
];

const TODAY_TASKS = [
  { time: "7:00–8:30 AM", task: "Machine Learning — Neural Networks revision", done: true },
  { time: "10:00–11:00 AM", task: "Cryptography — Digital Signatures notes", done: false },
  { time: "3:00–4:00 PM", task: "Big Data — Practice Spark queries", done: false },
  { time: "8:00–9:00 PM", task: "ML Lab — Prepare lab record", done: false },
];

export function StudyPlan() {
  const [tasks, setTasks] = useState(TODAY_TASKS);

  return (
    <AppShell title="My Study Plan">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Weekly plan */}
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <p className="label-track">Weekly Study Targets</p>
            <Button size="sm" variant="outline">Adjust Plan</Button>
          </div>
          {PLAN.map(s=>{
            const pct = Math.min(100, Math.round(s.weeklyDone/s.weeklyTarget*100));
            return (
              <div key={s.subject} className="rounded border border-border bg-surface p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{s.subject}</p>
                    <div className="flex gap-2 mt-0.5">
                      {s.topics.map(t=><span key={t} className="text-xs rounded bg-cream-100 px-1.5 py-0.5">{t}</span>)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                      s.priority==="high"?"bg-[#F5E6E6] text-[#8B2F2F]":s.priority==="medium"?"bg-[#F5EDDB] text-[#8B6914]":"bg-[#EBF3EE] text-[#3D6B4F]")}>
                      {s.priority}
                    </span>
                    <p className="text-xs text-text-muted mt-1">{s.dailyHours}h/day</p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-cream-200">
                  <div className={cn("h-2 rounded-full transition-all", pct>=100?"bg-[#3D6B4F]":pct>=60?"bg-[#8B6914]":"bg-[#8B2F2F]")}
                    style={{width:`${pct}%`}} />
                </div>
                <p className="text-xs text-text-muted mt-1">{s.weeklyDone}h / {s.weeklyTarget}h this week</p>
              </div>
            );
          })}
        </div>

        {/* Today's schedule */}
        <div>
          <p className="label-track mb-3">Today&apos;s Tasks</p>
          <div className="grid gap-2">
            {tasks.map((t,i)=>(
              <button key={i} onClick={()=>setTasks(prev=>prev.map((p,pi)=>pi===i?{...p,done:!p.done}:p))}
                className={cn("rounded border p-3 text-left flex items-start gap-3 transition-colors",
                  t.done ? "border-[#3D6B4F] bg-[#F8FCF9]" : "border-border bg-surface hover:border-[#1C1810]")}>
                <span className={cn("mt-0.5 text-sm shrink-0", t.done ? "text-[#3D6B4F]" : "text-text-muted")}>
                  {t.done ? "✓" : "○"}
                </span>
                <div>
                  <p className={cn("text-sm", t.done && "line-through text-text-muted")}>{t.task}</p>
                  <p className="text-xs text-text-muted mt-0.5">{t.time}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-2">
            {tasks.filter(t=>t.done).length} / {tasks.length} tasks done today
          </p>
        </div>
      </div>
    </AppShell>
  );
}
