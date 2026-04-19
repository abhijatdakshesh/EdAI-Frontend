"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TIME_SLOTS = ["8:00","9:00","10:00","11:00","12:00","1:00","2:00","3:00","4:00","5:00"];

type ClassEntry = { day: string; start: string; end: string; subject: string; room: string; faculty: string; type: "theory"|"lab"|"elective" };

const TIMETABLE: ClassEntry[] = [
  { day: "Monday", start: "9:00", end: "10:00", subject: "Machine Learning", room: "CSE-301", faculty: "Dr. Priya Sharma", type: "theory" },
  { day: "Monday", start: "11:00", end: "12:00", subject: "Cryptography", room: "CSE-204", faculty: "Prof. Kavitha Nair", type: "elective" },
  { day: "Tuesday", start: "9:00", end: "10:00", subject: "Distributed Systems", room: "CSE-302", faculty: "Dr. Sanjay Mehta", type: "theory" },
  { day: "Tuesday", start: "2:00", end: "3:30", subject: "Big Data Analytics", room: "CSE-201", faculty: "Prof. Rohan Mehta", type: "theory" },
  { day: "Wednesday", start: "9:00", end: "10:00", subject: "Machine Learning", room: "CSE-301", faculty: "Dr. Priya Sharma", type: "theory" },
  { day: "Wednesday", start: "11:00", end: "12:00", subject: "Cryptography", room: "CSE-204", faculty: "Prof. Kavitha Nair", type: "elective" },
  { day: "Thursday", start: "9:00", end: "10:00", subject: "Big Data Analytics", room: "CSE-201", faculty: "Prof. Rohan Mehta", type: "theory" },
  { day: "Thursday", start: "2:00", end: "5:00", subject: "ML Lab", room: "CSE-Lab-2", faculty: "Dr. Priya Sharma", type: "lab" },
  { day: "Friday", start: "9:00", end: "10:00", subject: "Machine Learning", room: "CSE-301", faculty: "Dr. Priya Sharma", type: "theory" },
  { day: "Friday", start: "10:00", end: "11:00", subject: "Distributed Systems", room: "CSE-302", faculty: "Dr. Sanjay Mehta", type: "theory" },
  { day: "Saturday", start: "9:00", end: "10:00", subject: "Extra-curricular", room: "Seminar Hall", faculty: "—", type: "elective" },
];

const typeColors: Record<string, string> = {
  theory: "bg-[#E6EEF5] border-[#2F567A]",
  lab: "bg-[#EBF3EE] border-[#3D6B4F]",
  elective: "bg-[#F5EDDB] border-[#8B6914]",
};

const TODAY = "Wednesday";

export function StudentSchedule() {
  const [selectedDay, setSelectedDay] = useState(TODAY);
  const dayClasses = TIMETABLE.filter(c => c.day === selectedDay).sort((a,b)=>a.start.localeCompare(b.start));

  return (
    <AppShell title="Schedule">
      <div className="grid gap-5">
        {/* Day selector */}
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day=>(
            <button key={day} onClick={()=>setSelectedDay(day)}
              className={cn("rounded border px-4 py-2 text-sm transition-colors",
                selectedDay===day ? "border-[#1C1810] bg-[#1C1810] text-[#F2EFE9]"
                : day===TODAY ? "border-[#2F567A] text-[#2F567A]" : "border-border hover:border-[#1C1810]")}>
              {day.slice(0,3)}
              {day===TODAY && <span className="ml-1 text-xs opacity-70">(today)</span>}
            </button>
          ))}
        </div>

        {/* Classes for day */}
        {dayClasses.length === 0 ? (
          <div className="rounded border border-dashed border-border p-10 text-center text-sm text-text-muted">
            No classes scheduled for {selectedDay}
          </div>
        ) : (
          <div className="grid gap-3">
            {dayClasses.map((c,i)=>(
              <div key={i} className={cn("rounded border-l-4 p-4", typeColors[c.type])}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{c.subject}</p>
                    <p className="text-xs text-text-muted mt-0.5">{c.faculty}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{c.start} – {c.end}</p>
                    <p className="text-xs text-text-muted">🏛 {c.room}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full week summary */}
        <div>
          <p className="label-track mb-3">Weekly Overview</p>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-xs">
              <thead className="bg-cream-200">
                <tr>
                  <th className="px-3 py-2 text-left label-track">Time</th>
                  {DAYS.map(d=><th key={d} className={cn("px-3 py-2 text-left label-track", d===TODAY && "bg-cream-100")}>{d.slice(0,3)}</th>)}
                </tr>
              </thead>
              <tbody>
                {["9:00","10:00","11:00","2:00","3:00"].map(slot=>(
                  <tr key={slot} className="border-t border-border">
                    <td className="px-3 py-2 text-text-muted">{slot}</td>
                    {DAYS.map(d=>{
                      const cls = TIMETABLE.find(c=>c.day===d && c.start===slot);
                      return (
                        <td key={d} className={cn("px-3 py-2", d===TODAY && "bg-cream-50")}>
                          {cls ? <span className="text-xs font-medium">{cls.subject.split(" ").slice(0,2).join(" ")}</span> : <span className="text-text-muted">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
