"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCounselorSlots, useMySessions, useBookCounselorSession } from "@/lib/api/counselor";

function getDateRange() {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + 14);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

const STATUS_STYLE: Record<string, string> = {
  UPCOMING: "bg-[#E6EEF5] text-[#2F567A]",
  COMPLETED: "bg-[#EBF3EE] text-[#3D6B4F]",
  CANCELLED: "bg-[#F5E6E6] text-[#8B2F2F]",
  NO_SHOW: "bg-[#F5EDDB] text-[#8B6914]",
};

export function BookCounselor() {
  const { from, to } = getDateRange();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [bookMsg, setBookMsg] = useState<string | null>(null);

  const { data: slots = [], isLoading: loadingSlots } = useCounselorSlots(from, to);
  const { data: pastSessions = [] } = useMySessions();
  const bookMutation = useBookCounselorSession();

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null;
  const availableSlots = slots.filter((s) => s.available);

  async function handleBook() {
    if (!selectedSlotId || !reason.trim()) return;
    setBookMsg(null);
    try {
      await bookMutation.mutateAsync({ slotId: selectedSlotId, reason: reason.trim() });
      setBookMsg("success");
      setSelectedSlotId(null);
      setReason("");
    } catch {
      setBookMsg("error");
    }
  }

  return (
    <AppShell title="Book Counselor">
      <div className="grid gap-6 max-w-3xl">
        {bookMsg === "success" && (
          <div className="rounded border border-[#3D6B4F] bg-[#F8FCF9] p-5">
            <p className="font-medium text-[#3D6B4F]">✓ Session Booked Successfully</p>
            <p className="text-sm mt-1">You will receive a confirmation email and a reminder 30 minutes before your session.</p>
          </div>
        )}
        {bookMsg === "error" && (
          <div className="rounded border border-[#8B2F2F] bg-[#FDF5F5] p-4 text-sm text-[#8B2F2F]">
            Booking failed. The slot may no longer be available. Please try another.
          </div>
        )}

        {/* Available slots */}
        <div>
          <p className="label-track mb-3">Available Slots (next 2 weeks)</p>
          {loadingSlots ? (
            <div className="grid gap-2">
              {[1, 2].map((i) => <div key={i} className="h-20 rounded border border-border bg-surface animate-pulse" />)}
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-text-muted rounded border border-dashed border-border p-6 text-center">
              No available slots in the next 2 weeks.
            </p>
          ) : (
            <div className="grid gap-3">
              {availableSlots.map((s) => (
                <button key={s.id} onClick={() => { setSelectedSlotId(s.id); setBookMsg(null); }}
                  className={cn("rounded border p-4 text-left transition-colors",
                    selectedSlotId === s.id ? "border-[#1C1810] bg-cream-100" : "border-border bg-surface hover:border-[#1C1810]")}>
                  <p className="font-medium">{s.counselorName}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {s.date} · {s.startTime} – {s.endTime}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Booking form */}
        {selectedSlot && bookMsg !== "success" && (
          <div className="rounded border border-border bg-surface p-5">
            <p className="label-track mb-4">
              Book Session with {selectedSlot.counselorName} — {selectedSlot.date} {selectedSlot.startTime}
            </p>
            <div className="grid gap-4">
              <div>
                <label className="text-sm text-text-muted block mb-1">Brief Description of Concern</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                  placeholder="What would you like to discuss?"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
              </div>
              <Button onClick={() => void handleBook()} disabled={!reason.trim() || bookMutation.isPending}>
                {bookMutation.isPending ? "Booking…" : "Confirm Booking"}
              </Button>
            </div>
          </div>
        )}

        {/* Past sessions */}
        {pastSessions.length > 0 && (
          <div>
            <p className="label-track mb-2">Past Sessions</p>
            <div className="grid gap-2">
              {pastSessions.map((s) => (
                <div key={s.id} className="rounded border border-border bg-surface p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{s.reason}</p>
                    <p className="text-xs text-text-muted">{s.counselorName} · {s.date} {s.startTime}</p>
                  </div>
                  <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_STYLE[s.status] ?? "bg-cream-100")}>
                    {s.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
