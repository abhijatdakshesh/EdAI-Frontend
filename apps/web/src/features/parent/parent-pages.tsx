"use client";

/**
 * Parent portal feature pages:
 *  - MyChildren, ParentAttendance, ParentResults, ParentVTU,
 *    ParentCalls, ParentAnnouncements, ParentMessages, ScholarshipEligibility
 */

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CHILD = { name: "Arjun Nair", usn: "1RVCE22CS089", dept: "CSE", sem: 6, section: "CSE 6A", cgpa: 8.42 };

// ─── My Children ─────────────────────────────────────────────────────────────

export function MyChildren() {
  return (
    <AppShell title="My Children">
      <div className="max-w-xl grid gap-5">
        <div className="rounded border border-border bg-surface p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-[#1C1810] flex items-center justify-center text-lg text-[#F2EFE9] shrink-0">
              {CHILD.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-lg">{CHILD.name}</p>
              <p className="text-sm text-text-muted">{CHILD.usn} · {CHILD.dept}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-xs rounded bg-cream-100 px-2 py-0.5">Sem {CHILD.sem}</span>
                <span className="text-xs rounded bg-cream-100 px-2 py-0.5">{CHILD.section}</span>
                <span className="text-xs rounded bg-cream-100 px-2 py-0.5">CGPA {CHILD.cgpa}</span>
              </div>
            </div>
          </div>
          <span className="ray-rule ml-0" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Attendance", value: "84.5%" },
              { label: "Current Sem", value: `${CHILD.sem}` },
              { label: "Department", value: CHILD.dept },
              { label: "Fee Status", value: "Paid" },
            ].map(s=>(
              <div key={s.label}>
                <p className="text-xs text-text-muted">{s.label}</p>
                <p className="font-medium">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" className="flex-1">View Attendance</Button>
            <Button size="sm" variant="outline" className="flex-1">View Results</Button>
          </div>
        </div>
        <p className="text-xs text-text-muted">To add another child&apos;s profile, contact the college admin office.</p>
      </div>
    </AppShell>
  );
}

// ─── Parent Attendance ────────────────────────────────────────────────────────

const ATT_COURSES = [
  { name: "Machine Learning", attended: 37, conducted: 45 },
  { name: "Big Data Analytics", attended: 36, conducted: 40 },
  { name: "ML Lab", attended: 19, conducted: 20 },
  { name: "Cryptography", attended: 28, conducted: 38 },
  { name: "Distributed Systems", attended: 38, conducted: 42 },
];

export function ParentAttendance() {
  const overall = Math.round(ATT_COURSES.reduce((a,c)=>a+c.attended,0)/ATT_COURSES.reduce((a,c)=>a+c.conducted,0)*100);
  return (
    <AppShell title="Attendance">
      <div className="grid gap-5 max-w-2xl">
        <div className={cn("rounded border-l-4 p-4 bg-surface",overall>=75?"border-l-[#3D6B4F]":"border-l-[#8B2F2F]")}>
          <p className="label-track">{CHILD.name} — Overall Attendance</p>
          <p className="text-4xl font-light mt-1">{overall}%</p>
          {overall<75&&<p className="text-sm text-[#8B2F2F] mt-1">⚠️ Below minimum. Detention risk.</p>}
        </div>
        {ATT_COURSES.map(c=>{
          const pct=Math.round(c.attended/c.conducted*100);
          return(
            <div key={c.name} className="rounded border border-border bg-surface p-4">
              <div className="flex justify-between mb-1">
                <p className="font-medium text-sm">{c.name}</p>
                <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                  pct>=85?"bg-[#EBF3EE] text-[#3D6B4F]":pct>=75?"bg-[#F5EDDB] text-[#8B6914]":"bg-[#F5E6E6] text-[#8B2F2F]")}>
                  {pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-cream-200">
                <div className={cn("h-2 rounded-full",pct>=75?"bg-[#3D6B4F]":"bg-[#8B2F2F]")} style={{width:`${pct}%`}}/>
              </div>
              <p className="text-xs text-text-muted mt-1">{c.attended}/{c.conducted} classes attended</p>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

// ─── Parent Results ───────────────────────────────────────────────────────────

const RESULTS = [
  { code:"21CS51", name:"Software Engineering", grade:"A+", marks:"122/150" },
  { code:"21CS52", name:"Computer Networks", grade:"A", marks:"112/150" },
  { code:"21CS53", name:"Database Management", grade:"O", marks:"128/150" },
  { code:"21CS54", name:"Operating Systems", grade:"A", marks:"108/150" },
];

const gradeStyle: Record<string,string>={O:"bg-[#EBF3EE] text-[#3D6B4F]","A+":"bg-[#E6EEF5] text-[#2F567A]",A:"bg-[#F0EBF5] text-[#6B2F8B]"};

export function ParentResults() {
  return (
    <AppShell title="Results">
      <div className="grid gap-5 max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded border-l-4 border-l-[#3D6B4F] bg-surface p-4 col-span-2 sm:col-span-1">
            <p className="label-track">CGPA</p>
            <p className="text-4xl font-light mt-1">{CHILD.cgpa}<span className="text-base text-text-muted ml-1">/ 10</span></p>
          </div>
          <div className="rounded border border-border bg-surface p-4">
            <p className="label-track">Sem 5 SGPA</p>
            <p className="text-2xl font-light mt-1">8.92</p>
          </div>
        </div>
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-cream-200">
              <tr>{["Code","Subject","Marks","Grade"].map(h=><th key={h} className="px-4 py-2 text-left label-track">{h}</th>)}</tr>
            </thead>
            <tbody>
              {RESULTS.map(r=>(
                <tr key={r.code} className="border-t border-border even:bg-cream-50">
                  <td className="px-4 py-2 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2">{r.marks}</td>
                  <td className="px-4 py-2"><span className={cn("rounded px-2 py-0.5 text-xs font-medium",gradeStyle[r.grade]??"")}>{r.grade}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Parent VTU ───────────────────────────────────────────────────────────────

export function ParentVTU() {
  return (
    <AppShell title="VTU Registration">
      <div className="grid gap-5 max-w-2xl">
        <div className="rounded border border-[#3D6B4F] bg-[#F8FCF9] p-5">
          <p className="font-medium text-[#3D6B4F]">Registration Status: In Progress</p>
          <p className="text-sm mt-1">VTU Semester 6 registration has been initiated and is pending final submission to the VTU portal.</p>
        </div>
        <dl className="rounded border border-border bg-surface p-5 grid gap-3 text-sm">
          {[["Student","Arjun Nair"],["USN","1RVCE22CS089"],["Semester","VI (Sem 6)"],["Type","Regular"],["Subjects Registered","5"],["Fee Paid","Yes — ₹1,200"],["Submission Status","Pending VTU Portal"]].map(([k,v])=>(
            <div key={k} className="flex justify-between border-b border-border pb-2 last:border-0">
              <dt className="text-text-muted">{k}</dt><dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </AppShell>
  );
}

// ─── AI Call History ─────────────────────────────────────────────────────────

const AI_CALLS = [
  { date: "Jan 12, 2025", time: "07:05 AM", reason: "Attendance below 75% — Cryptography", lang: "Kannada", duration: "1m 42s", answered: true },
  { date: "Jan 10, 2025", time: "07:03 AM", reason: "Fee reminder — ₹5,000 outstanding", lang: "English", duration: "0m 58s", answered: false },
  { date: "Jan 5, 2025", time: "07:08 AM", reason: "IA-2 exam schedule notification", lang: "Kannada", duration: "1m 15s", answered: true },
  { date: "Dec 20, 2024", time: "07:02 AM", reason: "Monthly attendance report", lang: "Kannada", duration: "2m 03s", answered: true },
];

export function ParentCalls() {
  return (
    <AppShell title="AI Call History">
      <div className="grid gap-5 max-w-2xl">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Calls", value: AI_CALLS.length },
            { label: "Answered", value: AI_CALLS.filter(c=>c.answered).length },
            { label: "Missed", value: AI_CALLS.filter(c=>!c.answered).length },
          ].map(s=>(
            <div key={s.label} className="rounded border border-border bg-surface p-4">
              <p className="label-track">{s.label}</p>
              <p className="text-2xl font-light mt-1">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-2">
          {AI_CALLS.map((c,i)=>(
            <div key={i} className="rounded border border-border bg-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{c.reason}</p>
                  <p className="text-xs text-text-muted mt-0.5">{c.date} at {c.time} · {c.lang} · {c.duration}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                    c.answered?"bg-[#EBF3EE] text-[#3D6B4F]":"bg-[#F5E6E6] text-[#8B2F2F]")}>
                    {c.answered ? "Answered" : "Missed"}
                  </span>
                  <button className="text-xs text-[#2F567A] hover:underline">Listen</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ─── Parent Announcements ─────────────────────────────────────────────────────

const PARENT_ANNOUNCEMENTS = [
  { title: "Parent-Teacher Meeting — Jan 20", date: "Jan 10, 2025", body: "A Parent-Teacher Meeting is scheduled for January 20, 2025 from 10:00 AM – 1:00 PM in the Main Auditorium. Your presence is requested." },
  { title: "IA-2 Exam Schedule Released", date: "Jan 8, 2025", body: "IA-2 examinations will be held from January 14–17, 2025. Please ensure your ward is well prepared and attends all exams." },
  { title: "Annual Day Celebration — Feb 14", date: "Jan 5, 2025", body: "Annual Day will be celebrated on February 14, 2025. Parents are invited for the evening program starting at 5:00 PM." },
];

export function ParentAnnouncements() {
  const [selected, setSelected] = useState(PARENT_ANNOUNCEMENTS[0]);
  return (
    <AppShell title="Announcements">
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className="grid gap-2">
          {PARENT_ANNOUNCEMENTS.map(a=>(
            <button key={a.title} onClick={()=>setSelected(a)}
              className={cn("rounded border p-4 text-left transition-colors",
                selected.title===a.title?"border-[#1C1810] bg-cream-100":"border-border bg-surface hover:border-[#1C1810]")}>
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-xs text-text-muted mt-0.5">{a.date}</p>
            </button>
          ))}
        </div>
        <div className="rounded border border-border bg-surface p-5 self-start sticky top-4">
          <h3 className="text-lg font-medium leading-snug">{selected.title}</h3>
          <p className="text-xs text-text-muted mb-3">{selected.date}</p>
          <p className="text-sm text-text-secondary leading-relaxed">{selected.body}</p>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Parent Messages ──────────────────────────────────────────────────────────

const MESSAGES = [
  { from: "Dr. Priya Sharma", role: "HOD, CSE", date: "Jan 11", preview: "Arjun's ML project submission was excellent. However, attendance in the last 2 weeks has dropped. Please encourage regular attendance.", unread: true },
  { from: "Ms. Meena Subramanian", role: "Counsellor", date: "Jan 9", preview: "We had a brief counselling session with Arjun regarding exam stress. He is doing well. No further action needed at this time.", unread: false },
  { from: "Placement Cell", role: "Admin", date: "Jan 8", preview: "Arjun has registered for the Infosys placement drive. Please ensure he has formal attire ready for January 18.", unread: false },
];

export function ParentMessages() {
  const [selected, setSelected] = useState(MESSAGES[0]);
  const [reply, setReply] = useState("");
  return (
    <AppShell title="Messages">
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-2">
          {MESSAGES.map((m,i)=>(
            <button key={i} onClick={()=>setSelected(m)}
              className={cn("rounded border p-4 text-left transition-colors",
                selected.from===m.from&&selected.date===m.date?"border-[#1C1810] bg-cream-100":"border-border bg-surface hover:border-[#1C1810]")}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {m.unread && <span className="h-2 w-2 rounded-full bg-[#2F567A] shrink-0" />}
                    <p className="font-medium text-sm">{m.from}</p>
                  </div>
                  <p className="text-xs text-text-muted">{m.role}</p>
                </div>
                <p className="text-xs text-text-muted">{m.date}</p>
              </div>
              <p className="text-xs text-text-secondary mt-1 line-clamp-1">{m.preview}</p>
            </button>
          ))}
        </div>
        <div className="rounded border border-border bg-surface p-5 self-start sticky top-4">
          <p className="font-medium">{selected.from}</p>
          <p className="text-xs text-text-muted mb-3">{selected.role} · {selected.date}</p>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">{selected.preview}</p>
          <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3}
            placeholder="Reply to this message…"
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none mb-2" />
          <Button size="sm" className="w-full">Send Reply</Button>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Scholarship Eligibility ──────────────────────────────────────────────────

export function ScholarshipEligibility() {
  return (
    <AppShell title="Scholarship Eligibility">
      <div className="grid gap-5 max-w-2xl">
        <div className="grid gap-3">
          {[
            { name: "Government of Karnataka — Post-Matric Scholarship", eligible: true, amount: "₹25,000/year", criteria: "Family income < ₹2.5L, SC/ST/OBC", status: "Applied" },
            { name: "RV Trust Merit Scholarship", eligible: true, amount: "50% fee waiver", criteria: "CGPA ≥ 8.0, no backlogs", status: "Under Review" },
            { name: "Pragathi Scholarship — Karnataka", eligible: false, amount: "₹15,000/year", criteria: "Girl student only", status: "Not Eligible" },
            { name: "AICTE Pragati Scholarship", eligible: false, amount: "₹50,000/year", criteria: "Family income < ₹8L, one girl child per family", status: "Not Eligible" },
            { name: "National Scholarship Portal — Central Sector", eligible: true, amount: "₹10,000/year", criteria: "Top 20% in board exams, family income < ₹8L", status: "Not Applied" },
          ].map(s=>(
            <div key={s.name} className={cn("rounded border p-4 bg-surface",!s.eligible&&"opacity-70")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{s.criteria}</p>
                  <p className="text-xs font-medium text-[#3D6B4F] mt-1">{s.amount}</p>
                </div>
                <span className={cn("rounded px-2 py-0.5 text-xs font-medium shrink-0",
                  s.status==="Applied"?"bg-[#E6EEF5] text-[#2F567A]"
                  :s.status==="Under Review"?"bg-[#F5EDDB] text-[#8B6914]"
                  :s.status==="Not Applied"?"bg-cream-100 text-text-muted"
                  :"bg-[#F5E6E6] text-[#8B2F2F]")}>
                  {s.status}
                </span>
              </div>
              {s.eligible && s.status==="Not Applied" && (
                <Button size="sm" variant="outline" className="mt-2">Apply Now</Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted">Eligibility is auto-checked based on student data. Contact admin for document submission.</p>
      </div>
    </AppShell>
  );
}
