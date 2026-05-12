"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Globe, LinkIcon, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiGet } from "@/lib/api/client";

/**
 * Some scraped VTU notifications point to portal sections that we own
 * inside Ed8AI (Student Attendance, Student Feedback). Route those
 * internally per portal instead of leaking back to vtu.ac.in (which
 * routinely 404s and was filed as Stu_01_03 / Stu_01_04).
 */
function internalRouteFor(title: string, role: string | undefined): string | null {
  const t = title.toLowerCase();
  if (role === "STUDENT") {
    if (t.includes("student attendance") || /\battendance\b/.test(t)) return "/student/attendance";
    if (t.includes("student feedback") || /\bfeedback\b/.test(t)) return "/student/feedback";
  }
  if (role === "PARENT") {
    if (t.includes("attendance")) return "/parent/attendance";
  }
  return null;
}

interface VtuNotification {
  title: string;
  link: string;
  date?: string | null;
  source: "notifications" | "home";
}

interface VtuNotificationsResponse {
  items: VtuNotification[];
  fetchedAt: string;
  cached: boolean;
}

/**
 * Live notifications scraped from vtu.ac.in. Mounted on every portal
 * dashboard so admins, principals, HoDs, faculty, students, and parents
 * see the same source-of-truth circulars.
 */
export function VTUNotificationsPanel({ limit = 8 }: { limit?: number }) {
  const { data: session } = useSession();
  const role = session?.user?.role as string | undefined;
  const { data, isLoading, isError, refetch, isFetching } = useQuery<VtuNotificationsResponse>({
    queryKey: ["vtu", "live-notifications"],
    queryFn: () => apiGet<VtuNotificationsResponse>("/api/vtu/notifications"),
    staleTime: 5 * 60 * 1000,           // soft-refresh every 5 min
    refetchOnWindowFocus: false,
  });

  const items = (data?.items ?? []).slice(0, limit);

  return (
    <div className="rounded border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#5C4A35]" />
          <h3 className="font-medium text-sm">VTU Notifications</h3>
          <span className="text-xs text-text-muted">live from vtu.ac.in</span>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="text-xs text-text-muted hover:text-[#1C1810] transition-colors disabled:opacity-50 flex items-center gap-1"
          title="Refresh now"
          aria-label="Refresh VTU notifications"
        >
          <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {isLoading && (
        <div className="grid gap-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded bg-cream-100" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-[#8B2F2F]">
          Could not reach VTU. Try refreshing in a moment.
        </p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className="text-sm text-text-muted">No notifications right now.</p>
      )}

      {items.length > 0 && (
        <ul className="grid gap-1.5">
          {items.map((n) => {
            const internal = internalRouteFor(n.title, role);
            if (internal) {
              return (
                <li key={n.link}>
                  <Link
                    href={internal}
                    className="flex items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-cream-100 transition-colors group"
                  >
                    <LinkIcon className="w-3.5 h-3.5 mt-0.5 text-text-muted group-hover:text-[#1C1810] shrink-0" />
                    <span className="leading-snug">{n.title}</span>
                  </Link>
                </li>
              );
            }
            return (
              <li key={n.link}>
                <a
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-cream-100 transition-colors group"
                >
                  <ExternalLink className="w-3.5 h-3.5 mt-0.5 text-text-muted group-hover:text-[#1C1810] shrink-0" />
                  <span className="leading-snug">{n.title}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {data && (
        <p className="text-[10px] text-text-muted mt-3 text-right">
          Fetched {new Date(data.fetchedAt).toLocaleTimeString("en-IN")}{data.cached ? " (cached)" : ""}
        </p>
      )}
    </div>
  );
}
