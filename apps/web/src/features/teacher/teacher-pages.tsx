"use client";

/**
 * Teacher portal feature pages:
 *  AssignmentIntelligence, AttendanceSummary, UploadResults,
 *  IAVTUMarks, TeacherAnnouncements, TeacherSchedule, TeacherProfile,
 *  GenerateReports, TeacherVTU, PerformanceDrop
 */

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Assignment Intelligence ──────────────────────────────────────────────────

const ASSIGN_STATS = [
  { title: "ML Model Comparison Report", submitted: 48, total: 60, avgScore: 16.2, lateSubmissions: 5, plagiarism: 2 },
  { title: "Hadoop MapReduce Implementation", submitted: 35, total: 60, avgScore: 0, lateSubmissions: 0, plagiarism: 0 },
];

export function AssignmentIntelligence() {
  return (
    <AppShell title="Assignment Intelligence">
      <div className="grid gap-5">
        {ASSIGN_STATS.map(a=>(
          <div key={a.title} className="rounded border border-border bg-surface p-5">
            <h3 className="font-medium">{a.title}</h3>
            <div className="grid grid-cols-2 gap-3 mt-3 sm:grid-cols-4">
              {[
                { label: "Submitted", value: `${a.submitted}/${a.total}` },
                { label: "Avg Score", value: a.avgScore > 0 ? `${a.avgScore}/25` : "Not graded" },
                { label: "Late Submissions", value: a.lateSubmissions },
                { label: "Plagiarism Flags", value: a.plagiarism, warn: a.plagiarism > 0 },
              ].map(s=>(
                <div key={s.label} className={cn("rounded p-3", s.warn ? "bg-[#F5E6E6]" : "bg-cream-100")}>
                  <p className="text-xs text-text-muted">{s.label}</p>
                  <p className={cn("font-medium mt-1", s.warn ? "text-[#8B2F2F]" : "")}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 h-2 rounded-full bg-cream-200">
              <div className="h-2 rounded-full bg-[#2F567A]" style={{width:`${Math.round(a.submitted/a.total*100)}%`}} />
            </div>
            <p className="text-xs text-text-muted mt-1">{Math.round(a.submitted/a.total*100)}% submission rate</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline">Grade Submissions</Button>
              <Button size="sm" variant="outline">View Plagiarism Report</Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

// ─── Attendance Summary ───────────────────────────────────────────────────────

export function AttendanceSummary() {
  const SUMMARY = [
    { class: "CSE 6A — ML", month: "January", conducted: 12, avgAtt: 87, below75: 3 },
    { class: "CSE 6B — ML", month: "January", conducted: 12, avgAtt: 83, below75: 5 },
    { class: "CSE 5A — ML Lab", month: "January", conducted: 4, avgAtt: 95, below75: 0 },
  ];
  return (
    <AppShell title="Attendance Summary">
      <div className="grid gap-5">
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-cream-200">
              <tr>{["Class","Month","Classes Conducted","Avg Attendance","Below 75%","Actions"].map(h=>(
                <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {SUMMARY.map((s,i)=>(
                <tr key={i} className="border-t border-border even:bg-cream-50">
                  <td className="px-4 py-2 font-medium">{s.class}</td>
                  <td className="px-4 py-2">{s.month}</td>
                  <td className="px-4 py-2">{s.conducted}</td>
                  <td className="px-4 py-2">
                    <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                      s.avgAtt>=85?"bg-[#EBF3EE] text-[#3D6B4F]":s.avgAtt>=75?"bg-[#F5EDDB] text-[#8B6914]":"bg-[#F5E6E6] text-[#8B2F2F]")}>
                      {s.avgAtt}%
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={cn(s.below75>0?"text-[#8B2F2F] font-medium":"text-[#3D6B4F]")}>{s.below75} students</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button className="text-xs text-[#2F567A] hover:underline">Full Report</button>
                      <button className="text-xs text-[#2F567A] hover:underline">Export</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Upload Results ───────────────────────────────────────────────────────────

export function UploadResults() {
  const [file, setFile] = useState<string | null>(null);
  return (
    <AppShell title="Upload Results">
      <div className="grid gap-5 max-w-2xl">
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">Upload IA Marks Sheet</p>
          <div className="grid gap-4">
            <div>
              <label className="text-sm text-text-muted block mb-1">Class</label>
              <select className="rounded border border-border bg-background px-3 py-1.5 text-sm w-full focus:outline-none">
                <option>CSE 6A — Machine Learning (21CS61)</option>
                <option>CSE 6B — Machine Learning (21CS61)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-text-muted block mb-1">IA Number</label>
              <div className="flex gap-2">
                {["IA-1","IA-2"].map(ia=>(
                  <button key={ia} className="rounded border border-border px-4 py-1.5 text-sm hover:border-[#1C1810]">{ia}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-text-muted block mb-1">Upload CSV/Excel</label>
              <div className="rounded border-2 border-dashed border-border p-8 text-center">
                {file ? (
                  <p className="text-sm text-[#3D6B4F]">✓ {file} selected</p>
                ) : (
                  <>
                    <p className="text-sm">Drop file here or</p>
                    <Button size="sm" variant="outline" className="mt-2"
                      onClick={()=>setFile("marks_cse6a_ia2.xlsx")}>Browse</Button>
                  </>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1">Format: USN, Name, Marks (out of 25). Max 25 marks.</p>
            </div>
            <Button disabled={!file}>Upload & Submit</Button>
          </div>
        </div>

        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-2">Recent Uploads</p>
          <div className="grid gap-2">
            {[
              { file: "marks_cse6a_ia1.xlsx", class: "CSE 6A", ia: "IA-1", date: "Dec 5, 2024", status: "Published" },
              { file: "marks_cse6b_ia1.xlsx", class: "CSE 6B", ia: "IA-1", date: "Dec 5, 2024", status: "Published" },
            ].map((u,i)=>(
              <div key={i} className="flex justify-between text-sm items-center">
                <div>
                  <p className="font-medium">{u.file}</p>
                  <p className="text-xs text-text-muted">{u.class} · {u.ia} · {u.date}</p>
                </div>
                <span className="rounded px-2 py-0.5 text-xs bg-[#EBF3EE] text-[#3D6B4F]">{u.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── IA / VTU Marks ───────────────────────────────────────────────────────────

const MARKS_DATA = [
  { usn: "1RVCE22CS001", name: "Aakash Singh", ia1: 18, ia2: 20, avg: 19 },
  { usn: "1RVCE22CS002", name: "Bhavana Rao", ia1: 22, ia2: 23, avg: 22.5 },
  { usn: "1RVCE22CS003", name: "Chetan Kumar", ia1: 12, ia2: 14, avg: 13 },
  { usn: "1RVCE22CS004", name: "Deepa Nair", ia1: 24, ia2: 25, avg: 24.5 },
  { usn: "1RVCE22CS005", name: "Eshan Mehta", ia1: 16, ia2: 18, avg: 17 },
];

export function IAVTUMarks() {
  return (
    <AppShell title="IA / VTU Marks">
      <div className="grid gap-5">
        <div className="flex flex-wrap gap-3">
          <select className="rounded border border-border bg-surface px-3 py-1.5 text-sm">
            <option>CSE 6A — Machine Learning (21CS61)</option>
          </select>
          <Button size="sm" variant="outline">Export to VTU Format</Button>
        </div>
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-cream-200">
              <tr>{["USN","Student","IA-1 (/25)","IA-2 (/25)","Avg","Best of 2","VTU Marks"].map(h=>(
                <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {MARKS_DATA.map(s=>{
                const best = Math.max(s.ia1, s.ia2);
                const vtu = Math.round(best * 0.5);
                return(
                  <tr key={s.usn} className="border-t border-border even:bg-cream-50">
                    <td className="px-4 py-2 font-mono text-xs">{s.usn}</td>
                    <td className="px-4 py-2 font-medium">{s.name}</td>
                    <td className="px-4 py-2">{s.ia1}</td>
                    <td className="px-4 py-2">{s.ia2}</td>
                    <td className="px-4 py-2">{s.avg}</td>
                    <td className="px-4 py-2 font-medium">{best}</td>
                    <td className="px-4 py-2">{vtu}/12.5 (scaled)</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted">VTU formula: Best of 2 IAs, scaled to 25 (or as per VTU regulation).</p>
      </div>
    </AppShell>
  );
}

// ─── Teacher Announcements ────────────────────────────────────────────────────

export function TeacherAnnouncements() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <AppShell title="Announcements">
      <div className="grid gap-5 max-w-3xl">
        {/* Compose */}
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">New Announcement</p>
          <div className="grid gap-3">
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Announcement title"
              className="rounded border border-border bg-background px-3 py-1.5 text-sm w-full focus:outline-none" />
            <div className="flex gap-2">
              <select className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none">
                <option>CSE 6A — ML</option><option>CSE 6B — ML</option><option>All My Classes</option>
              </select>
              <select className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none">
                <option>General</option><option>Assignment</option><option>Exam</option><option>Important</option>
              </select>
            </div>
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3} placeholder="Announcement content…"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none" />
            <Button disabled={!title||!body}>Post Announcement</Button>
          </div>
        </div>

        {/* Recent */}
        <div>
          <p className="label-track mb-2">Recent Announcements</p>
          <div className="grid gap-2">
            {[
              { title: "IA-2 syllabus coverage note", class: "CSE 6A, 6B", date: "Jan 10, 2025" },
              { title: "ML Assignment 2 submission deadline extended", class: "CSE 6A", date: "Jan 8, 2025" },
            ].map((a,i)=>(
              <div key={i} className="rounded border border-border bg-surface p-3 flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-text-muted">{a.class} · {a.date}</p>
                </div>
                <button className="text-xs text-[#2F567A] hover:underline">Edit</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Teacher Schedule ─────────────────────────────────────────────────────────

const TEACHER_SCHEDULE = [
  { day: "Mon", time: "9–10 AM", class: "CSE 6A", course: "Machine Learning", room: "CSE-301" },
  { day: "Mon", time: "11–12 PM", class: "CSE 6B", course: "Machine Learning", room: "CSE-302" },
  { day: "Tue", time: "9–10 AM", class: "CSE 6A", course: "Machine Learning", room: "CSE-301" },
  { day: "Wed", time: "9–10 AM", class: "CSE 6A", course: "Machine Learning", room: "CSE-301" },
  { day: "Wed", time: "11–12 PM", class: "CSE 6B", course: "Machine Learning", room: "CSE-302" },
  { day: "Thu", time: "2–5 PM", class: "CSE 5A", course: "ML Lab", room: "CSE-Lab-2" },
  { day: "Fri", time: "9–10 AM", class: "CSE 6A", course: "Machine Learning", room: "CSE-301" },
  { day: "Fri", time: "10–11 AM", class: "CSE 6B", course: "Machine Learning", room: "CSE-302" },
];

export function TeacherSchedule() {
  return (
    <AppShell title="Schedule">
      <div className="grid gap-5">
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-cream-200">
              <tr>{["Day","Time","Class","Course","Room"].map(h=>(
                <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {TEACHER_SCHEDULE.map((s,i)=>(
                <tr key={i} className="border-t border-border even:bg-cream-50">
                  <td className="px-4 py-2 font-medium">{s.day}</td>
                  <td className="px-4 py-2">{s.time}</td>
                  <td className="px-4 py-2">{s.class}</td>
                  <td className="px-4 py-2">{s.course}</td>
                  <td className="px-4 py-2">{s.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted">Total: {TEACHER_SCHEDULE.length} sessions/week across {new Set(TEACHER_SCHEDULE.map(s=>s.class)).size} classes</p>
      </div>
    </AppShell>
  );
}

// ─── Teacher Profile ──────────────────────────────────────────────────────────

export function TeacherProfile() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "Dr. Priya Sharma", empId: "RVCE-FAC-0234", email: "priya.sharma@rvce.edu",
    phone: "+91 98765 43210", dept: "CSE", designation: "Assistant Professor",
    qualification: "Ph.D. (Machine Learning), IISc Bangalore", experience: "8 years",
    specialisation: "Machine Learning, Deep Learning, NLP",
  });

  return (
    <AppShell title="Profile">
      <div className="grid gap-5 max-w-2xl">
        <div className="rounded border border-border bg-surface p-5 flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-[#1C1810] flex items-center justify-center text-xl text-[#F2EFE9] shrink-0">
            {profile.name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="font-medium text-lg">{profile.name}</p>
            <p className="text-sm text-text-muted">{profile.designation} · {profile.dept}</p>
            <p className="text-xs text-text-muted">{profile.empId}</p>
          </div>
          <Button size="sm" variant="outline" onClick={()=>setEditing(!editing)}>
            {editing ? "Save" : "Edit"}
          </Button>
        </div>
        <div className="rounded border border-border bg-surface p-5">
          <p className="label-track mb-4">Professional Details</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Email", key: "email" as const },
              { label: "Phone", key: "phone" as const },
              { label: "Qualification", key: "qualification" as const },
              { label: "Experience", key: "experience" as const },
              { label: "Specialisation", key: "specialisation" as const },
            ].map(f=>(
              <div key={f.key} className={f.key==="specialisation"||f.key==="qualification"?"sm:col-span-2":""}>
                <p className="text-xs text-text-muted mb-1">{f.label}</p>
                {editing ? (
                  <input value={profile[f.key]} onChange={e=>setProfile(p=>({...p,[f.key]:e.target.value}))}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none" />
                ) : (
                  <p className="text-sm font-medium">{profile[f.key]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border border-border bg-surface p-4">
          <p className="label-track mb-3">Account</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline">Change Password</Button>
            <Button size="sm" variant="outline">Download ID Card</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Generate Reports ─────────────────────────────────────────────────────────

export function GenerateReports() {
  return (
    <AppShell title="Generate Reports">
      <div className="grid gap-5 max-w-3xl">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "Attendance Report", desc: "Class-wise / student-wise attendance for selected period", icon: "📊" },
            { title: "IA Marks Report", desc: "Internal assessment marks with statistics and analytics", icon: "📝" },
            { title: "At-Risk Students", desc: "Students below attendance/marks threshold", icon: "⚠️" },
            { title: "Assignment Completion", desc: "Submission rates and grading statistics", icon: "📋" },
            { title: "Syllabus Coverage", desc: "Topics covered vs pending for each course", icon: "📚" },
            { title: "Performance Comparison", desc: "Batch comparison across semesters", icon: "📈" },
          ].map(r=>(
            <div key={r.title} className="rounded border border-border bg-surface p-4 flex gap-3">
              <span className="text-2xl shrink-0">{r.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{r.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{r.desc}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="text-xs">PDF</Button>
                  <Button size="sm" variant="outline" className="text-xs">Excel</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ─── Teacher VTU ─────────────────────────────────────────────────────────────

export function TeacherVTU() {
  const REGS = [
    { usn: "1RVCE22CS001", name: "Aakash Singh", eligible: false, reason: "Attendance 63%" },
    { usn: "1RVCE22CS002", name: "Bhavana Rao", eligible: true, reason: "" },
    { usn: "1RVCE22CS003", name: "Chetan Kumar", eligible: false, reason: "Attendance 68%" },
    { usn: "1RVCE22CS004", name: "Deepa Nair", eligible: true, reason: "" },
    { usn: "1RVCE22CS005", name: "Eshan Mehta", eligible: true, reason: "" },
  ];
  return (
    <AppShell title="VTU Registration">
      <div className="grid gap-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Students", value: REGS.length },
            { label: "Eligible", value: REGS.filter(r=>r.eligible).length },
            { label: "Detained", value: REGS.filter(r=>!r.eligible).length },
          ].map(s=>(
            <div key={s.label} className="rounded border border-border bg-surface p-4">
              <p className="label-track">{s.label}</p>
              <p className="text-2xl font-light mt-1">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-cream-200">
              <tr>{["USN","Student","Eligible","Reason"].map(h=>(
                <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {REGS.map(r=>(
                <tr key={r.usn} className="border-t border-border even:bg-cream-50">
                  <td className="px-4 py-2 font-mono text-xs">{r.usn}</td>
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2">
                    <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                      r.eligible?"bg-[#EBF3EE] text-[#3D6B4F]":"bg-[#F5E6E6] text-[#8B2F2F]")}>
                      {r.eligible ? "Eligible" : "Detained"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-[#8B2F2F]">{r.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button size="sm" className="self-start">Submit Eligibility to Admin</Button>
      </div>
    </AppShell>
  );
}

// ─── Performance Drop Alert ───────────────────────────────────────────────────

const AT_RISK = [
  { usn: "1RVCE22CS001", name: "Aakash Singh", ia1: 8, ia2: 10, attendance: 63, counsellor: false },
  { usn: "1RVCE22CS003", name: "Chetan Kumar", ia1: 12, ia2: 9, attendance: 68, counsellor: true },
  { usn: "1RVCE22CS005", name: "Eshan Mehta", ia1: 16, ia2: 11, attendance: 72, counsellor: false },
];

export function PerformanceDrop() {
  return (
    <AppShell title="Performance Drop Alert">
      <div className="grid gap-5">
        <div className="rounded border-l-4 border-l-[#8B6914] bg-[#FDF9F0] p-4">
          <p className="font-medium text-[#8B6914]">⚠️ {AT_RISK.length} students showing performance decline</p>
          <p className="text-sm mt-1">Students with IA scores below 40% or declining trend are listed below.</p>
        </div>
        <div className="grid gap-3">
          {AT_RISK.map(s=>(
            <div key={s.usn} className="rounded border border-border bg-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-text-muted">{s.usn}</p>
                  <div className="flex gap-4 mt-1 text-xs text-text-muted">
                    <span>IA-1: <strong className="text-[#8B2F2F]">{s.ia1}/25</strong></span>
                    <span>IA-2: <strong className="text-[#8B2F2F]">{s.ia2}/25</strong></span>
                    <span>Attendance: <strong className={s.attendance<75?"text-[#8B2F2F]":""}>{s.attendance}%</strong></span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {s.counsellor && <span className="rounded px-2 py-0.5 text-xs bg-[#E6EEF5] text-[#2F567A]">Counsellor Notified</span>}
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="text-xs">Notify Counsellor</Button>
                    <Button size="sm" variant="outline" className="text-xs">Call Parent</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
