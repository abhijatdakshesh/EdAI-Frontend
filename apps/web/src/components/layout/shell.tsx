"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useRef } from "react";
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
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-r border-border bg-surface px-4 py-6 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
          <Link href={homeRoute} className="block">
            <p className="label-track">Raycraft Technologies</p>
            <h2 className="mt-2 text-3xl">{portalName}</h2>
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
        <main className="px-6 py-6">
          <header className="mb-6 flex items-start justify-between border-b border-border pb-4">
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
          {children}
        </main>
      </div>
    </div>
  );
}
