import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-text-primary">
      <section className="mx-auto max-w-5xl rounded-lg border border-border bg-surface p-8 shadow">
        <p className="label-track mb-2">RV Trust AI ERP</p>
        <h1 className="display text-5xl">Frontend Foundation</h1>
        <span className="ray-rule" />
        <p className="max-w-2xl text-text-secondary">
          Raycraft design tokens are now wired for the web app. Build feature modules in
          <code className="mx-1 rounded bg-cream-200 px-2 py-1 font-mono text-xs">src/features</code>
          and reuse components from
          <code className="mx-1 rounded bg-cream-200 px-2 py-1 font-mono text-xs">src/components/ui</code>.
        </p>
        <div className="mt-6 flex gap-3">
          <Button>Primary Action</Button>
          <Button variant="outline">Secondary Action</Button>
          <Button variant="ghost">Ghost Action</Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link className="label-track" href="/login">
            Login
          </Link>
          <Link className="label-track" href="/dashboard">
            Dashboard
          </Link>
          <Link className="label-track" href="/attendance">
            Attendance
          </Link>
          <Link className="label-track" href="/marks">
            Marks
          </Link>
          <Link className="label-track" href="/fees">
            Fees
          </Link>
          <Link className="label-track" href="/voice">
            Voice
          </Link>
          <Link className="label-track" href="/timeline">
            Timeline
          </Link>
          <Link className="label-track" href="/notifications">
            Notifications
          </Link>
          <Link className="label-track" href="/placements">
            Placements
          </Link>
          <Link className="label-track" href="/mentorship">
            Mentorship
          </Link>
          <Link className="label-track" href="/grievance">
            Grievance
          </Link>
          <Link className="label-track" href="/compliance">
            Compliance
          </Link>
          <Link className="label-track" href="/integrations">
            Integrations
          </Link>
        </div>
      </section>
    </main>
  );
}
