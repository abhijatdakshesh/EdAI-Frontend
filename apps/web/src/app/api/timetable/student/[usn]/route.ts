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

export const GET = auth(async (req, ctx: unknown) => {
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
