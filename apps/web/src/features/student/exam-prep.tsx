"use client";

import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";

const WELLNESS_TIPS = [
  { icon: "😴", title: "Sleep 7–8 Hours", desc: "Adequate sleep consolidates memory and improves recall during exams." },
  { icon: "🏃", title: "Exercise Daily", desc: "Even 20 minutes of walking reduces stress hormones and improves focus." },
  { icon: "🍎", title: "Balanced Diet", desc: "Avoid skipping meals. Brain glucose levels directly affect concentration." },
  { icon: "🧘", title: "Practice Mindfulness", desc: "5-minute breathing exercises before studying improve focus by 30%." },
  { icon: "📵", title: "Digital Detox", desc: "Use app blockers during study sessions to prevent distraction." },
  { icon: "💧", title: "Stay Hydrated", desc: "Dehydration reduces cognitive performance. Aim for 2–3 litres daily." },
];

const EXAM_SCHEDULE = [
  { date: "Jan 14", subject: "Machine Learning (21CS61)", time: "10:00–12:00 PM", room: "CSE-301" },
  { date: "Jan 15", subject: "Big Data Analytics (21CS62)", time: "2:00–4:00 PM", room: "CSE-302" },
  { date: "Jan 16", subject: "Cryptography (21CS63)", time: "10:00–12:00 PM", room: "CSE-201" },
  { date: "Jan 17", subject: "Distributed Systems (21CS64)", time: "2:00–4:00 PM", room: "CSE-204" },
];

const STRESS_LEVEL = 6; // out of 10

export function ExamPrepWellness() {
  return (
    <AppShell title="Exam Prep & Wellness">
      <div className="grid gap-6">
        {/* Stress check-in */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-2">Today&apos;s Wellness Check-in</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Calm</span><span>Stressed</span>
              </div>
              <div className="h-3 rounded-full bg-cream-200">
                <div className="h-3 rounded-full bg-gradient-to-r from-[#3D6B4F] to-[#8B2F2F] transition-all"
                  style={{width:`${STRESS_LEVEL*10}%`}} />
              </div>
              <p className="text-xs text-text-muted mt-1">Current stress level: {STRESS_LEVEL}/10</p>
            </div>
            <Button size="sm" variant="outline">Update</Button>
          </div>
          {STRESS_LEVEL >= 7 && (
            <div className="mt-3 rounded bg-[#FDF5F5] border border-[#F5E6E6] p-3">
              <p className="text-sm text-[#8B2F2F]">Your stress level is high. Consider booking a counsellor session.</p>
              <Button size="sm" className="mt-2">Book Counsellor</Button>
            </div>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Exam schedule */}
          <div>
            <p className="label-track mb-3">IA-2 Exam Schedule</p>
            <div className="grid gap-2">
              {EXAM_SCHEDULE.map((e,i)=>(
                <div key={i} className="rounded border border-border bg-surface p-3 flex items-center gap-3">
                  <div className="text-center min-w-[40px]">
                    <p className="text-xs text-text-muted">Jan</p>
                    <p className="font-bold text-lg">{e.date.split(" ")[1]}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{e.subject}</p>
                    <p className="text-xs text-text-muted">{e.time} · Room {e.room}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wellness tips */}
          <div>
            <p className="label-track mb-3">Wellness Tips</p>
            <div className="grid gap-2">
              {WELLNESS_TIPS.map(t=>(
                <div key={t.title} className="rounded border border-border bg-surface p-3 flex gap-3">
                  <span className="text-xl shrink-0">{t.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-text-muted">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="rounded border border-border bg-surface p-4">
          <p className="label-track mb-3">Mental Health Resources</p>
          <div className="flex flex-wrap gap-2">
            {["Book Counsellor Session","iCall Helpline: 9152987821","Vandrevala Foundation: 1860-2662-345","Download Mindfulness App"].map(r=>(
              <Button key={r} size="sm" variant="outline">{r}</Button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
