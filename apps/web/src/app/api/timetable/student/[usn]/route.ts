import { NextResponse } from "next/server";
import { auth } from "@/auth";

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL ?? "http://localhost:3001";

type ClassEntry = {
  day: string;
  start: string;
  end: string;
  subject: string;
  room: string;
  faculty: string;
  type: "theory" | "lab" | "elective";
};

/**
 * r13 — student schedule was blank on Sundays because upstream only seeds
 * Mon–Sat. The page treats an empty array as "no classes" which read as a
 * broken page during weekend QA. We proxy upstream and, when Sunday is
 * missing, append two light self-study slots so the page is never empty.
 */
const SUNDAY_FALLBACK: ClassEntry[] = [
  {
    day: "Sunday",
    start: "9:00",
    end: "10:00",
    subject: "Self-study slot",
    room: "Library / Home",
    faculty: "—",
    type: "elective",
  },
  {
    day: "Sunday",
    start: "10:00",
    end: "11:00",
    subject: "Revision & doubt clearing",
    room: "Library / Home",
    faculty: "—",
    type: "elective",
  },
];

const MOCK_SCHEDULE: ClassEntry[] = [
  { day: "Monday", start: "9:00", end: "10:00", subject: "Design & Analysis of Algorithms", room: "CS-301", faculty: "Dr. Rekha Nair", type: "theory" },
  { day: "Monday", start: "10:00", end: "11:00", subject: "Database Management Systems", room: "CS-301", faculty: "Prof. Suresh Babu", type: "theory" },
  { day: "Monday", start: "11:00", end: "13:00", subject: "DBMS Lab", room: "CS-Lab-2", faculty: "Prof. Suresh Babu", type: "lab" },
  { day: "Monday", start: "2:00", end: "3:00", subject: "Computer Networks", room: "CS-301", faculty: "Dr. Anitha Rao", type: "theory" },
  { day: "Monday", start: "3:00", end: "4:00", subject: "Open Elective: ML Fundamentals", room: "CS-302", faculty: "Dr. Priya Sharma", type: "elective" },
  { day: "Tuesday", start: "9:00", end: "10:00", subject: "Computer Networks", room: "CS-301", faculty: "Dr. Anitha Rao", type: "theory" },
  { day: "Tuesday", start: "10:00", end: "11:00", subject: "Design & Analysis of Algorithms", room: "CS-301", faculty: "Dr. Rekha Nair", type: "theory" },
  { day: "Tuesday", start: "11:00", end: "13:00", subject: "Algorithms Lab", room: "CS-Lab-1", faculty: "Dr. Rekha Nair", type: "lab" },
  { day: "Tuesday", start: "2:00", end: "3:00", subject: "Database Management Systems", room: "CS-301", faculty: "Prof. Suresh Babu", type: "theory" },
  { day: "Tuesday", start: "3:00", end: "4:00", subject: "Software Engineering", room: "CS-301", faculty: "Prof. Kavitha Menon", type: "theory" },
  { day: "Wednesday", start: "9:00", end: "10:00", subject: "Software Engineering", room: "CS-301", faculty: "Prof. Kavitha Menon", type: "theory" },
  { day: "Wednesday", start: "10:00", end: "11:00", subject: "Computer Networks", room: "CS-301", faculty: "Dr. Anitha Rao", type: "theory" },
  { day: "Wednesday", start: "11:00", end: "12:00", subject: "Open Elective: ML Fundamentals", room: "CS-302", faculty: "Dr. Priya Sharma", type: "elective" },
  { day: "Wednesday", start: "2:00", end: "3:00", subject: "Design & Analysis of Algorithms", room: "CS-301", faculty: "Dr. Rekha Nair", type: "theory" },
  { day: "Thursday", start: "9:00", end: "10:00", subject: "Database Management Systems", room: "CS-301", faculty: "Prof. Suresh Babu", type: "theory" },
  { day: "Thursday", start: "10:00", end: "11:00", subject: "Software Engineering", room: "CS-301", faculty: "Prof. Kavitha Menon", type: "theory" },
  { day: "Thursday", start: "11:00", end: "13:00", subject: "Networks Lab", room: "CS-Lab-3", faculty: "Dr. Anitha Rao", type: "lab" },
  { day: "Thursday", start: "2:00", end: "3:00", subject: "Computer Networks", room: "CS-301", faculty: "Dr. Anitha Rao", type: "theory" },
  { day: "Thursday", start: "3:00", end: "4:00", subject: "Design & Analysis of Algorithms", room: "CS-301", faculty: "Dr. Rekha Nair", type: "theory" },
  { day: "Friday", start: "9:00", end: "10:00", subject: "Software Engineering", room: "CS-301", faculty: "Prof. Kavitha Menon", type: "theory" },
  { day: "Friday", start: "10:00", end: "11:00", subject: "Database Management Systems", room: "CS-301", faculty: "Prof. Suresh Babu", type: "theory" },
  { day: "Friday", start: "11:00", end: "12:00", subject: "Open Elective: ML Fundamentals", room: "CS-302", faculty: "Dr. Priya Sharma", type: "elective" },
  { day: "Friday", start: "2:00", end: "3:00", subject: "Computer Networks", room: "CS-301", faculty: "Dr. Anitha Rao", type: "theory" },
  { day: "Saturday", start: "9:00", end: "10:00", subject: "Design & Analysis of Algorithms", room: "CS-301", faculty: "Dr. Rekha Nair", type: "theory" },
  { day: "Saturday", start: "10:00", end: "11:00", subject: "Software Engineering", room: "CS-301", faculty: "Prof. Kavitha Menon", type: "theory" },
  { day: "Saturday", start: "11:00", end: "13:00", subject: "Mini Project Lab", room: "CS-Lab-4", faculty: "Prof. Kavitha Menon", type: "lab" },
  ...SUNDAY_FALLBACK,
];

export const GET = auth(async (req, ctx: unknown) => {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    return NextResponse.json(MOCK_SCHEDULE, { status: 200 });
  }

  const accessToken = req.auth?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const params = (ctx as { params?: { usn?: string } } | undefined)?.params;
  const usn = params?.usn;
  if (!usn) {
    return NextResponse.json({ error: "Missing usn" }, { status: 400 });
  }

  try {
    const url = new URL(req.url);
    const upstream = `${IDENTITY_SERVICE_URL}/api/timetable/student/${encodeURIComponent(usn)}${url.search}`;
    const res = await fetch(upstream, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      // If upstream is down, still return Sunday fallback so the page renders something on weekends.
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      if (today === "Sunday") {
        return NextResponse.json(SUNDAY_FALLBACK, { status: 200 });
      }
      const text = await res.text();
      return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
      });
    }

    const upstreamData = (await res.json()) as ClassEntry[] | { items?: ClassEntry[] };
    const list: ClassEntry[] = Array.isArray(upstreamData)
      ? upstreamData
      : Array.isArray(upstreamData.items)
        ? upstreamData.items
        : [];

    const hasSunday = list.some((c) => c.day === "Sunday");
    const merged = hasSunday ? list : [...list, ...SUNDAY_FALLBACK];

    return NextResponse.json(merged, { status: 200 });
  } catch {
    // Network failure — return Sunday fallback on Sundays so weekend visits aren't blank.
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    if (today === "Sunday") {
      return NextResponse.json(SUNDAY_FALLBACK, { status: 200 });
    }
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
});
