"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useAuth } from "@/lib/auth/use-auth";
import { homeRouteForRole } from "@/lib/auth/use-auth";
import { navForRole, portalLabel } from "@/lib/roadmap/phases";
import { cn } from "@/lib/utils";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready, logout } = useAuth();
  const { data: rawSession } = useSession();
  const signingOut = useRef(false);
  // Mobile drawer state. Closes automatically on route change so tapping a
  // nav link doesn't leave the drawer hanging open.
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // If token refresh failed, sign out cleanly — ref guard prevents calling signOut in a loop
  useEffect(() => {
    if (rawSession?.error === "RefreshAccessTokenError" && !signingOut.current) {
      signingOut.current = true;
      signOut({ callbackUrl: "/login" }).catch(() => {
        signingOut.current = false; // reset so fallback redirect is not suppressed
        window.location.href = "/login";
      });
      return;
    }
    if (ready && !session && !signingOut.current) router.replace("/login");
  }, [ready, router, session, rawSession?.error]);

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text-secondary">
        Loading session...
      </div>
    );
  }

  const nav = navForRole(session.role);
  const portalName = portalLabel(session.role);
  const homeRoute = homeRouteForRole(session.role);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Mobile top bar — only on <md. Hamburger + portal label + logout. */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="rounded p-2 -ml-2 hover:bg-cream-100 active:bg-cream-200"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {/* Logo-only on mobile to avoid duplicating the portal name (e.g.
            "Admin Portal") in a `md:hidden` element — that text would be in
            the DOM but invisible on desktop, breaking Playwright `.first()`
            assertions that match role-related strings like /admin|total/i. */}
        <Link href={homeRoute} className="flex-1 truncate" aria-label={`${portalName} home`}>
          <p className="text-sm font-medium">Raycraft</p>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void logout()}
          className="text-xs"
        >
          Logout
        </Button>
      </header>

      {/* Drawer backdrop (mobile only) */}
      {drawerOpen && (
        <button
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation"
          className="md:hidden fixed inset-0 z-40 bg-black/40"
        />
      )}

      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside
          className={cn(
            // Mobile: off-canvas drawer (fixed, slides in from left).
            // md+: in-flow column, sticky.
            "border-r border-border bg-surface px-4 py-6",
            "fixed inset-y-0 left-0 z-50 w-[260px] overflow-y-auto transition-transform",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
            "md:static md:translate-x-0 md:w-auto md:sticky md:top-0 md:h-screen md:overflow-y-auto md:z-0",
          )}
        >
          <Link href={homeRoute} className="block">
            <p className="label-track">Raycraft</p>
            <h2 className="mt-2 text-2xl md:text-3xl">{portalName}</h2>
          </Link>
          <span className="ray-rule ml-0" />
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.key}
                href={item.route}
                className={cn(
                  "block rounded px-3 py-2 text-sm transition-colors",
                  pathname === item.route
                    ? "bg-[#1C1810] text-[#F2EFE9]"
                    : "text-text-secondary hover:bg-cream-200 hover:text-text-primary",
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="px-4 py-4 md:px-6 md:py-6">
          {/* Desktop header (with title + email). Hidden on mobile because the
              sticky top bar already shows the portal label. */}
          <header className="hidden md:flex mb-6 items-start justify-between border-b border-border pb-4">
            <div>
              <p className="label-track">Module</p>
              <h1 className="text-4xl">{title}</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Signed in as {session.email} · {session.role}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void logout();
              }}
            >
              Logout
            </Button>
          </header>
          {/* Mobile page title (compact) */}
          <h1 className="md:hidden mb-4 text-2xl">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
