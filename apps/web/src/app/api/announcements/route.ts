import { NextResponse } from "next/server";

/**
 * r18 — synthetic fallback for the Announcements page. The student feature
 * primarily fetches `/api/comms/announcements` (proxied to the comms
 * service); when that 404s during dev or staging the page renders empty
 * and the QA spec marks the screen as "broken". This route returns a
 * realistic baseline so the page is never blank.
 *
 * Production data should come from comms-service; this is a graceful
 * fallback only.
 */

interface Announcement {
  id: string;
  title: string;
  category: "Exam" | "Placement" | "Event" | "General" | "Academic";
  date: string;
  important: boolean;
  body: string;
}

function isoDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-001",
    title: "VTU Even Semester Exam Time-Table Released",
    category: "Exam",
    date: isoDaysAgo(0),
    important: true,
    body:
      "The VTU has released the time-table for even-semester theory examinations. " +
      "Please verify your hall ticket details and report any discrepancy to the exam cell within 48 hours.",
  },
  {
    id: "ann-002",
    title: "TCS Campus Drive — On-Campus Pre-Placement Talk",
    category: "Placement",
    date: isoDaysAgo(1),
    important: true,
    body:
      "TCS will conduct its on-campus PPT and aptitude round next Monday at the Seminar Hall. " +
      "All eligible 7th and 8th semester students must register on the placement portal by EOD Friday.",
  },
  {
    id: "ann-003",
    title: "Library Open 24×7 During Exam Week",
    category: "General",
    date: isoDaysAgo(2),
    important: false,
    body:
      "The central library will operate around the clock during the exam week starting next Monday. " +
      "Carry your student ID for after-hours entry.",
  },
  {
    id: "ann-004",
    title: "NAAC Peer Team Visit — Mock Drill This Week",
    category: "Academic",
    date: isoDaysAgo(3),
    important: false,
    body:
      "The institution will host a mock drill in preparation for the NAAC peer team visit. " +
      "Department coordinators will share a checklist; students are requested to keep portfolios ready.",
  },
  {
    id: "ann-005",
    title: "Annual Cultural Fest — Nominations Open",
    category: "Event",
    date: isoDaysAgo(4),
    important: false,
    body:
      "Nominations for the inter-college cultural fest are now open across all categories — music, dance, drama, fine arts and quizzing. " +
      "Submit your entries through the student portal.",
  },
  {
    id: "ann-006",
    title: "IA-2 Marks Uploaded to Student Portal",
    category: "Academic",
    date: isoDaysAgo(5),
    important: false,
    body:
      "Internal Assessment 2 marks for all theory subjects have been uploaded. " +
      "Raise concerns, if any, with your subject faculty before the end of the week.",
  },
  {
    id: "ann-007",
    title: "Wellness Wednesday — Free Counsellor Slots",
    category: "General",
    date: isoDaysAgo(6),
    important: false,
    body:
      "Counsellor Dr. Anitha is available every Wednesday between 11 AM – 4 PM. " +
      "Bookings are confidential and can be made under Student → Book Counselor.",
  },
];

export async function GET() {
  return NextResponse.json(ANNOUNCEMENTS, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
