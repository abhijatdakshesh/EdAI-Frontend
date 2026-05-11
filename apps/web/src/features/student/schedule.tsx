"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/use-auth";
import { apiGet } from "@/lib/api/client";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type ClassEntry = {
  day: string;
  start: string;
  end: string;
  subject: string;
  room: string;
  faculty: string;
  type: "theory" | "lab" | "elective";
};

const typeColors: Record<string, string> = {
  theory: "bg-[#E6EEF5] border-[#2F567A]",
  lab: "bg-[#EBF3EE] border-[#3D6B4F]",
  elective: "bg-[#F5EDDB] border-[#8B6914]",
};

function getTodayName(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

export function StudentSchedule() {
  const { session } = useAuth();
  // The /api/timetable/student/[usn] BFF route is IDOR-guarded against the
  // session's sapId (USN) when present, falling back to the user UUID. Always
  // send sapId first so the path matches what the guard checks.
  const usn = session?.user?.sapId ?? session?.user?.id ?? "";
  const TODAY = getTodayName();
  const [selectedDay, setSelectedDay] = useState(TODAY);

  const { data: timetable = [], isLoading } = useQuery<ClassEntry[]>({
    queryKey: ["timetable", "student", usn],
    queryFn: () => apiGet<ClassEntry[]>(`/api/timetable/student/${usn}`),
    enabled: !!usn,
  });

  const dayClasses = timetable
    .filter((c) => c.day === selectedDay)
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <AppShell title="Schedule">
      <div className="grid gap-5">
        {/* Day selector */}
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button key={day} onClick={() => setSelectedDay(day)}
              className={cn("rounded border px-4 py-2 text-sm transition-colors",
                selectedDay === day ? "border-[#1C1810] bg-[#1C1810] text-[#F2EFE9]"
                  : day === TODAY ? "border-[#2F567A] text-[#2F567A]" : "border-border hover:border-[#1C1810]")}>
              {day.slice(0, 3)}
              {day === TODAY && <span className="ml-1 text-xs opacity-70">(today)</span>}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded border border-border bg-surface animate-pulse" />)}
          </div>
        ) : dayClasses.length === 0 ? (
          <div className="rounded border border-dashed border-border p-10 text-center text-sm text-text-muted">
            No classes scheduled for {selectedDay}
          </div>
        ) : (
          <div className="grid gap-3">
            {dayClasses.map((c, i) => (
              <div key={i} className={cn("rounded border-l-4 p-4", typeColors[c.type] ?? "bg-cream-100 border-border")}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{c.subject}</p>
                    <p className="text-xs text-text-muted mt-0.5">{c.faculty}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{c.start} – {c.end}</p>
                    <p className="text-xs text-text-muted">
                      <span aria-label="Location">{c.room}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full week summary */}
        {!isLoading && timetable.length > 0 && (
          <div>
            <p className="label-track mb-3">Weekly Overview</p>
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-xs">
                <thead className="bg-cream-200">
                  <tr>
                    <th className="px-3 py-2 text-left label-track">Time</th>
                    {DAYS.map((d) => (
                      <th key={d} className={cn("px-3 py-2 text-left label-track", d === TODAY && "bg-cream-100")}>
                        {d.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["9:00", "10:00", "11:00", "2:00", "3:00"].map((slot) => (
                    <tr key={slot} className="border-t border-border">
                      <td className="px-3 py-2 text-text-muted">{slot}</td>
                      {DAYS.map((d) => {
                        const cls = timetable.find((c) => c.day === d && c.start === slot);
                        return (
                          <td key={d} className={cn("px-3 py-2", d === TODAY && "bg-cream-50")}>
                            {cls
                              ? <span className="text-xs font-medium">{cls.subject.split(" ").slice(0, 2).join(" ")}</span>
                              : <span className="text-text-muted">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
