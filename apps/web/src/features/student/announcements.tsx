"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/shell";
import { cn } from "@/lib/utils";
import { apiGet } from "@/lib/api/client";

interface Announcement {
  id: string;
  title: string;
  category: string;
  date: string;
  important: boolean;
  body: string;
}

const catColors: Record<string, string> = {
  Exam: "bg-[#F5E6E6] text-[#8B2F2F]",
  Placement: "bg-[#EBF3EE] text-[#3D6B4F]",
  Event: "bg-[#E6EEF5] text-[#2F567A]",
  General: "bg-[#F0EEEB] text-[#6B6358]",
  Academic: "bg-[#F5EDDB] text-[#8B6914]",
};

export function StudentAnnouncements() {
  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements", "student"],
    queryFn: () => apiGet<Announcement[]>("/api/comms/announcements"),
    staleTime: 300_000,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = announcements.find((a) => a.id === selectedId) ?? announcements[0] ?? null;

  return (
    <AppShell title="Announcements">
      {isLoading ? (
        <div className="grid gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded border border-border bg-surface animate-pulse" />)}
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded border border-dashed border-border p-10 text-center text-sm text-text-muted">
          No announcements at this time.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <div className="grid gap-2">
            {announcements.map((a) => (
              <button key={a.id} onClick={() => setSelectedId(a.id)}
                className={cn("rounded border p-4 text-left transition-colors",
                  selected?.id === a.id ? "border-[#1C1810] bg-cream-100" : "border-border bg-surface hover:border-[#1C1810]")}>
                <div className="flex items-start gap-2 justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {a.important && <span className="text-[#8B2F2F] text-xs font-bold" aria-label="Important">●</span>}
                      <p className="font-medium text-sm leading-snug">{a.title}</p>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{a.date}</p>
                  </div>
                  <span className={cn("rounded px-2 py-0.5 text-xs font-medium shrink-0", catColors[a.category] ?? "bg-cream-100 text-text-muted")}>
                    {a.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {selected && (
            <div className="rounded border border-border bg-surface p-5 self-start sticky top-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("rounded px-2 py-0.5 text-xs font-medium", catColors[selected.category] ?? "bg-cream-100")}>
                  {selected.category}
                </span>
                {selected.important && <span className="text-xs text-[#8B2F2F] font-medium">Important</span>}
              </div>
              <h3 className="text-lg font-medium leading-snug mt-1">{selected.title}</h3>
              <p className="text-xs text-text-muted mb-4">{selected.date}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{selected.body}</p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
