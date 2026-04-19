"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";

const COUNSELORS = [
  { id: "c1", name: "Ms. Meena Subramanian", specialisation: "Academic Stress, Career Counselling", available: ["Mon 10–12","Wed 2–4","Fri 10–12"], mode: ["In-person","Video"] },
  { id: "c2", name: "Dr. Ravi Shankar", specialisation: "Anxiety, Depression, Personal Issues", available: ["Tue 11–1","Thu 3–5"], mode: ["In-person"] },
];

const PAST_SESSIONS = [
  { date: "Dec 20, 2024", counselor: "Ms. Meena Subramanian", topic: "Exam anxiety", status: "completed" },
  { date: "Nov 15, 2024", counselor: "Dr. Ravi Shankar", topic: "Career direction", status: "completed" },
];

export function BookCounselor() {
  const [selected, setSelected] = useState<string | null>(null);
  const [slot, setSlot] = useState("");
  const [mode, setMode] = useState("");
  const [topic, setTopic] = useState("");
  const [booked, setBooked] = useState(false);

  const counselor = COUNSELORS.find(c=>c.id===selected);

  return (
    <AppShell title="Book Counselor">
      <div className="grid gap-6 max-w-3xl">
        {/* Select counselor */}
        <div>
          <p className="label-track mb-3">Available Counselors</p>
          <div className="grid gap-3">
            {COUNSELORS.map(c=>(
              <button key={c.id} onClick={()=>{setSelected(c.id);setSlot("");setMode("");}}
                className={`rounded border p-4 text-left transition-colors ${selected===c.id ? "border-[#1C1810] bg-cream-100" : "border-border bg-surface hover:border-[#1C1810]"}`}>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{c.specialisation}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.available.map(s=><span key={s} className="rounded bg-cream-100 px-2 py-0.5 text-xs">{s}</span>)}
                </div>
                <p className="text-xs text-text-muted mt-1">Mode: {c.mode.join(", ")}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Booking form */}
        {counselor && !booked && (
          <div className="rounded border border-border bg-surface p-5">
            <p className="label-track mb-4">Book Session with {counselor.name}</p>
            <div className="grid gap-4">
              <div>
                <label className="text-sm text-text-muted block mb-1">Select Time Slot</label>
                <div className="flex flex-wrap gap-2">
                  {counselor.available.map(s=>(
                    <button key={s} onClick={()=>setSlot(s)}
                      className={`rounded border px-3 py-1.5 text-sm ${slot===s?"border-[#1C1810] bg-[#1C1810] text-[#F2EFE9]":"border-border hover:border-[#1C1810]"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted block mb-1">Mode</label>
                <div className="flex gap-2">
                  {counselor.mode.map(m=>(
                    <button key={m} onClick={()=>setMode(m)}
                      className={`rounded border px-3 py-1.5 text-sm ${mode===m?"border-[#1C1810] bg-[#1C1810] text-[#F2EFE9]":"border-border hover:border-[#1C1810]"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted block mb-1">Brief Description of Concern</label>
                <textarea value={topic} onChange={e=>setTopic(e.target.value)} rows={3} placeholder="What would you like to discuss?"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
              </div>
              <Button onClick={()=>{if(slot&&mode&&topic)setBooked(true);}}>Confirm Booking</Button>
            </div>
          </div>
        )}

        {booked && (
          <div className="rounded border border-[#3D6B4F] bg-[#F8FCF9] p-5">
            <p className="font-medium text-[#3D6B4F]">✓ Session Booked Successfully</p>
            <p className="text-sm mt-1">You will receive a confirmation email and a reminder 30 minutes before your session.</p>
          </div>
        )}

        {/* Past sessions */}
        <div>
          <p className="label-track mb-2">Past Sessions</p>
          <div className="grid gap-2">
            {PAST_SESSIONS.map((s,i)=>(
              <div key={i} className="rounded border border-border bg-surface p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{s.topic}</p>
                  <p className="text-xs text-text-muted">{s.counselor} · {s.date}</p>
                </div>
                <span className="rounded px-2 py-0.5 text-xs bg-[#EBF3EE] text-[#3D6B4F]">{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
