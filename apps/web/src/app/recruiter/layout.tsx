"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Briefcase, Users, LayoutDashboard, Plus, LogOut, BarChart2, MessageSquare, Calendar, Heart, Building2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/recruiter/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recruiter/jobs", label: "My Job Posts", icon: Briefcase },
  { href: "/recruiter/jobs/new", label: "Post a Job", icon: Plus },
  { href: "/recruiter/candidates", label: "Find Candidates", icon: Users },
  { href: "/recruiter/drives", label: "Campus Drives", icon: Calendar },
  { href: "/recruiter/pre-joining", label: "Pre-Joining", icon: Heart },
  { href: "/recruiter/tpo", label: "TPO Workspace", icon: Building2 },
  { href: "/recruiter/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/recruiter/outreach", label: "AI Outreach", icon: MessageSquare },
];

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="flex h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-stone-200 flex flex-col">
        <div className="px-6 py-5 border-b border-stone-200">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">EdAI Recruiter</p>
          <h1 className="text-lg font-bold text-stone-900 mt-0.5">Recruiter Portal</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                path === href || (href !== "/recruiter/dashboard" && path.startsWith(href))
                  ? "bg-amber-50 text-amber-700"
                  : "text-stone-600 hover:bg-stone-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-200">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-stone-500 hover:text-red-600"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
