import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const portals = [
  {
    role: "Student",
    icon: "🎓",
    description: "Access your courses, attendance, results, fee status, and exam registrations.",
    href: "/student/dashboard",
    accent: "#3D6B4F",
    bg: "#EBF3EE",
  },
  {
    role: "Faculty",
    icon: "📋",
    description: "Mark attendance, enter IA marks, manage assignments and class schedules.",
    href: "/teacher/classes",
    accent: "#2F567A",
    bg: "#E6EEF5",
  },
  {
    role: "Admin",
    icon: "⚙️",
    description: "Oversee departments, users, VTU windows, analytics and compliance.",
    href: "/admin/users",
    accent: "#1C1810",
    bg: "#F0EDE6",
  },
  {
    role: "Parent",
    icon: "👨‍👩‍👧",
    description: "Monitor your child's attendance, results, fee dues, and announcements.",
    href: "/parent/dashboard",
    accent: "#8B6914",
    bg: "#F5EDDB",
  },
];

const features = [
  { icon: "📊", label: "Attendance Intelligence", desc: "Real-time tracking with at-risk alerts and parent notifications." },
  { icon: "🏛️", label: "VTU Integration", desc: "End-to-end exam registration with automated eligibility checks." },
  { icon: "💬", label: "AI Assistant", desc: "Contextual chatbot for students, faculty, and admin teams." },
  { icon: "📁", label: "Results & Marks", desc: "Secure marks entry, verification, and grade publishing." },
  { icon: "💳", label: "Fee Management", desc: "Invoice tracking, payment status, and scholarship management." },
  { icon: "🎯", label: "Placements", desc: "Drive management, candidate pipeline, and offer tracking." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-text-primary">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="border-b border-border bg-surface/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Image src="/rv-logo.png" alt="RV Trust" width={36} height={36} className="object-contain invert" />
            <div>
              <p className="font-semibold text-sm leading-tight tracking-tight">ED8AI For RV & RSST Institutions</p>
              <p className="text-[10px] text-text-muted leading-tight">RV Educational Institutions </p>
            </div>
          </div>
          <Link href="/login">
            <Button size="sm">Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <div className="flex justify-center mb-6">
          <Image src="/rv-logo.png" alt="RV Trust" width={72} height={72} className="object-contain invert" />
        </div>
        <p className="label-track mb-4 text-text-secondary">RV Educational Institutions· Powered by Ed8AI</p>
        <h1 className="display text-5xl sm:text-6xl lg:text-7xl leading-tight mx-auto max-w-3xl">
          One Platform.<br />
          Every Role.
        </h1>
        <span className="ray-rule mx-auto" />
        <p className="mt-4 max-w-xl mx-auto text-text-secondary text-base leading-relaxed">
          A unified AI-powered ERP for RV Trust institutions — connecting students,
          faculty, administrators, and parents in a single intelligent workspace.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/login">
            <Button size="lg">Get Started →</Button>
          </Link>
          <Link href="/student/dashboard">
            <Button variant="outline" size="lg">Student Portal</Button>
          </Link>
        </div>

        {/* Stats strip */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {[
            { value: "6", label: "User Roles" },
            { value: "20+", label: "Feature Modules" },
            { value: "AI", label: "Powered Insights" },
            { value: "VTU", label: "Integrated" },
          ].map((s) => (
            <div key={s.label} className="bg-surface px-6 py-5 text-center">
              <p className="text-3xl font-light">{s.value}</p>
              <p className="label-track text-xs mt-1 text-text-secondary">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Portal Cards ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <p className="label-track text-center mb-2 text-text-secondary">Portals</p>
        <h2 className="text-2xl font-light text-center mb-8">Sign in as</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {portals.map((p) => (
            <Link key={p.role} href={p.href} className="group">
              <div
                className="rounded-xl border border-border bg-surface p-5 h-full flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ borderTopColor: p.accent, borderTopWidth: 3 }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ background: p.bg }}
                >
                  {p.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1" style={{ color: p.accent }}>{p.role}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{p.description}</p>
                </div>
                <span
                  className="text-xs font-medium flex items-center gap-1 transition-gap group-hover:gap-2"
                  style={{ color: p.accent }}
                >
                  Open portal <span>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-xl border border-border bg-surface p-8">
          <p className="label-track mb-2 text-text-secondary">Capabilities</p>
          <h2 className="text-2xl font-light mb-8">Built for every academic workflow</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.label} className="flex gap-4">
                <div className="w-9 h-9 rounded-lg bg-cream-200 flex items-center justify-center text-lg shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{f.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-xl bg-[#1C1810] text-[#F2EFE9] p-10 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/rv-logo.png" alt="RV Trust" width={44} height={44} className="object-contain brightness-200" />
          </div>
          <p className="label-track mb-3 text-[#F2EFE9]/60">Ready to begin?</p>
          <h2 className="text-3xl font-light mb-2">Sign in to your portal</h2>
          <p className="text-sm text-[#F2EFE9]/70 mb-6 max-w-sm mx-auto">
            Your role is automatically detected from your institutional email.
          </p>
          <Link href="/login">
            <button className="rounded-lg bg-[#F2EFE9] text-[#1C1810] px-6 py-2.5 text-sm font-semibold hover:bg-white transition-colors">
              Sign In →
            </button>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface mt-8">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* RV Trust */}
            <div className="flex items-center gap-3">
              <Image src="/rv-logo.png" alt="RV Trust" width={32} height={32} className="object-contain invert" />
              <div>
                <p className="text-sm font-medium leading-tight">RV Trust AI ERP</p>
                <p className="text-xs text-text-muted">RV College of Engineering, Bengaluru</p>
              </div>
            </div>

            {/* Quick links */}
            <div className="flex gap-4 text-xs text-text-secondary">
              <Link href="/login" className="hover:text-text-primary">Sign In</Link>
              <Link href="/student/dashboard" className="hover:text-text-primary">Student</Link>
              <Link href="/teacher/classes" className="hover:text-text-primary">Faculty</Link>
              <Link href="/admin/users" className="hover:text-text-primary">Admin</Link>
            </div>
          </div>

          {/* Raycraft credit */}
          <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-text-muted">
              © {new Date().getFullYear()} RV Trust. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Designed &amp; developed by</span>
              <div className="flex items-center gap-1.5">
                <Image
                  src="/raycraft-logo.png"
                  alt="Raycraft Technologies"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                <span className="text-xs font-medium text-text-secondary">Raycraft Technologies Pvt. Ltd.</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}
