import { NextResponse } from "next/server";
import { auth } from "@/auth";

// SYNTH_OK: backend has no GET /api/timetable/student/:usn endpoint yet.
// Return a realistic CSE Sem-5 weekly schedule so the student/schedule page
// renders meaningful data on every demo. When the backend ships the real
// route, this BFF can forward instead of synthesising.
//
// IDOR_GUARDED: the [usn] segment is user-controlled. Students may only fetch
// their OWN schedule (auth.user.sapId or fallback id must match the URL param).
// Staff roles (ADMIN/HOD/COUNSELLOR/PRINCIPAL/DEAN/FACULTY) bypass the check
// because they legitimately need cross-student visibility.

const STAFF_ROLES = new Set([
  "ADMIN",
  "HOD",
  "COUNSELLOR",
  "PRINCIPAL",
  "DEAN",
  "FACULTY",
]);

type ClassEntry = {
  day: string;
  start: string;
  end: string;
  subject: string;
  room: string;
  faculty: string;
  type: "theory" | "lab" | "elective";
};

const SCHEDULE: ClassEntry[] = [
  // Monday
  { day: "Monday",    start: "9:00",  end: "10:00", subject: "Database Management Systems",      room: "LH-101",    faculty: "Dr. Priya Sharma",  type: "theory" },
  { day: "Monday",    start: "10:00", end: "11:00", subject: "Operating Systems",                room: "LH-102",    faculty: "Prof. Anitha Rao",  type: "theory" },
  { day: "Monday",    start: "11:00", end: "12:00", subject: "Computer Networks",                room: "LH-103",    faculty: "Dr. Ramesh Nair",   type: "theory" },
  { day: "Monday",    start: "2:00",  end: "4:00",  subject: "DBMS Lab",                         room: "LAB-CS-A",  faculty: "Dr. Priya Sharma",  type: "lab" },
  // Tuesday
  { day: "Tuesday",   start: "9:00",  end: "10:00", subject: "Design & Analysis of Algorithms",  room: "LH-101",    faculty: "Dr. Suresh Kumar",  type: "theory" },
  { day: "Tuesday",   start: "10:00", end: "11:00", subject: "Machine Learning",                 room: "LH-104",    faculty: "Dr. Meena Iyer",    type: "theory" },
  { day: "Tuesday",   start: "11:00", end: "12:00", subject: "Operating Systems",                room: "LH-102",    faculty: "Prof. Anitha Rao",  type: "theory" },
  { day: "Tuesday",   start: "2:00",  end: "4:00",  subject: "Operating Systems Lab",            room: "LAB-CS-B",  faculty: "Prof. Anitha Rao",  type: "lab" },
  // Wednesday
  { day: "Wednesday", start: "9:00",  end: "10:00", subject: "Computer Networks",                room: "LH-103",    faculty: "Dr. Ramesh Nair",   type: "theory" },
  { day: "Wednesday", start: "10:00", end: "11:00", subject: "Database Management Systems",      room: "LH-101",    faculty: "Dr. Priya Sharma",  type: "theory" },
  { day: "Wednesday", start: "11:00", end: "12:00", subject: "Design & Analysis of Algorithms",  room: "LH-101",    faculty: "Dr. Suresh Kumar",  type: "theory" },
  { day: "Wednesday", start: "2:00",  end: "4:00",  subject: "Computer Networks Lab",            room: "LAB-CS-C",  faculty: "Dr. Ramesh Nair",   type: "lab" },
  // Thursday
  { day: "Thursday",  start: "9:00",  end: "10:00", subject: "Machine Learning",                 room: "LH-104",    faculty: "Dr. Meena Iyer",    type: "theory" },
  { day: "Thursday",  start: "10:00", end: "11:00", subject: "Operating Systems",                room: "LH-102",    faculty: "Prof. Anitha Rao",  type: "theory" },
  { day: "Thursday",  start: "11:00", end: "12:00", subject: "Indian Constitution",              room: "LH-201",    faculty: "Prof. K. R. Murthy", type: "elective" },
  { day: "Thursday",  start: "2:00",  end: "4:00",  subject: "Machine Learning Lab",             room: "LAB-CS-D",  faculty: "Dr. Meena Iyer",    type: "lab" },
  // Friday
  { day: "Friday",    start: "9:00",  end: "10:00", subject: "Database Management Systems",      room: "LH-101",    faculty: "Dr. Priya Sharma",  type: "theory" },
  { day: "Friday",    start: "10:00", end: "11:00", subject: "Computer Networks",                room: "LH-103",    faculty: "Dr. Ramesh Nair",   type: "theory" },
  { day: "Friday",    start: "11:00", end: "12:00", subject: "Design & Analysis of Algorithms",  room: "LH-101",    faculty: "Dr. Suresh Kumar",  type: "theory" },
  { day: "Friday",    start: "2:00",  end: "3:00",  subject: "Mini Project (Sem 5)",             room: "LH-205",    faculty: "Dr. Priya Sharma",  type: "elective" },
  // Saturday
  { day: "Saturday",  start: "9:00",  end: "10:00", subject: "Design & Analysis of Algorithms",  room: "LH-101",    faculty: "Dr. Suresh Kumar",  type: "theory" },
  { day: "Saturday",  start: "10:00", end: "11:00", subject: "Machine Learning",                 room: "LH-104",    faculty: "Dr. Meena Iyer",    type: "theory" },
  { day: "Saturday",  start: "11:00", end: "12:00", subject: "Soft Skills & Aptitude",           room: "LH-202",    faculty: "Prof. Latha Murthy", type: "elective" },
];

export const GET = auth(async (req, ctx) => {
  if (!req.auth?.accessToken) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // IDOR_GUARDED: enforce that students can only read their OWN schedule.
  // The Next.js auth() wrapper passes the route context as the second arg;
  // params is a Promise on App Router for dynamic segments.
  const params = (await (ctx?.params as Promise<{ usn: string }> | undefined)) ?? { usn: "" };
  const requestedUsn = params.usn;
  const role = req.auth.user?.role;
  const isStaff = role !== undefined && STAFF_ROLES.has(role);

  if (!isStaff) {
    const ownUsn = req.auth.user?.sapId ?? req.auth.user?.id;
    if (!ownUsn || ownUsn !== requestedUsn) {
      // 404 (not 403) so the route does not leak whether a USN exists.
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json(SCHEDULE);
});
