"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/use-auth";
import { useFeeSummary, useFeeHistory, useInitiatePayment, useVerifyPayment } from "@/lib/api/fees";

const statusColor: Record<string, string> = {
  PAID: "bg-[#EBF3EE] text-[#3D6B4F]",
  PENDING: "bg-[#F5EDDB] text-[#8B6914]",
  OVERDUE: "bg-[#F5E6E6] text-[#8B2F2F]",
  PARTIAL: "bg-[#E6EEF5] text-[#2F567A]",
};

const componentLabel: Record<string, string> = {
  TUITION: "Tuition Fee",
  HOSTEL: "Hostel Fee",
  TRANSPORT: "Transport Fee",
  EXAM: "Exam Fee",
  LIBRARY: "Library Fee",
  OTHER: "Other",
};

export function StudentFees() {
  const { session } = useAuth();
  const usn = session?.user?.sapId ?? session?.user?.id ?? "";

  const { data: summary, isLoading: loadingSummary } = useFeeSummary(usn);
  const { data: history = [], isLoading: loadingHistory } = useFeeHistory(usn);
  const initiatePayment = useInitiatePayment();
  const verifyPayment = useVerifyPayment();

  const [tab, setTab] = useState<"dues" | "history">("dues");
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const pendingItems = summary?.items?.filter((i) => i.status !== "PAID") ?? [];
  const paidItems = history;

  function toggleFee(id: string) {
    setSelectedFeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const selectedAmount = pendingItems
    .filter((i) => selectedFeeIds.includes(i.id))
    .reduce((sum, i) => sum + i.amount, 0);

  async function handlePay() {
    if (!usn || selectedFeeIds.length === 0) return;
    setPaying(true);
    setPayMsg(null);
    try {
      const result = await initiatePayment.mutateAsync({
        studentUsn: usn,
        feeIds: selectedFeeIds,
        amount: selectedAmount,
        gateway: "RAZORPAY",
      });

      const RazorpayConstructor = typeof window !== "undefined"
        ? (window as unknown as { Razorpay?: new (opts: unknown) => { open(): void } }).Razorpay
        : undefined;

      if (RazorpayConstructor) {
        const rzp = new RazorpayConstructor({
          key: result.key ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: result.amount * 100,
          currency: result.currency,
          order_id: result.orderId,
          name: "RV Trust ERP",
          description: "Fee Payment",
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            await verifyPayment.mutateAsync({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              studentUsn: usn,
            });
            setSelectedFeeIds([]);
            setPayMsg({ type: "success", text: "Payment successful! Receipt will be emailed to you." });
          },
        });
        rzp.open();
      } else {
        setPayMsg({ type: "error", text: `Payment gateway not loaded. Please refresh and try again. (Order: ${result.orderId})` });
      }
    } catch {
      setPayMsg({ type: "error", text: "Payment initiation failed. Please try again." });
    } finally {
      setPaying(false);
    }
  }

  return (
    <AppShell title="Fees & Scholarships">
      <div className="grid gap-5">
        {/* Summary cards */}
        {loadingSummary ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded border border-border bg-surface p-4 h-20" />
            ))}
          </div>
        ) : summary ? (
          // r21 — KPI row mirrors Results Portal: Total Fee / Paid / Pending / Next Due
          (() => {
            const pending = summary.items?.filter((i) => i.status !== "PAID") ?? [];
            const nextDue = pending
              .map((i) => i.dueDate)
              .filter(Boolean)
              .sort()[0];
            return (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total Fee", value: `₹${(summary.totalDue ?? 0).toLocaleString()}`, warn: false },
                  { label: "Paid", value: `₹${(summary.totalPaid ?? 0).toLocaleString()}`, warn: false },
                  { label: "Pending", value: `₹${(summary.totalOutstanding ?? 0).toLocaleString()}`, warn: (summary.totalOutstanding ?? 0) > 0 },
                  { label: "Next Due", value: nextDue ?? "—", warn: !!nextDue },
                ].map((s) => (
                  <div key={s.label} className={cn("rounded border-l-4 bg-surface p-4",
                    s.warn ? "border-l-[#8B6914]" : "border-l-[#3D6B4F]")}>
                    <p className="label-track">{s.label}</p>
                    <p className="mt-1 text-xl font-light">{s.value}</p>
                  </div>
                ))}
              </div>
            );
          })()
        ) : null}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {(["dues", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t
                  ? "border-[#1C1810] text-text-primary"
                  : "border-transparent text-text-muted hover:text-text-primary",
              )}
            >
              {t === "dues" ? "Pending Dues" : "Payment History"}
            </button>
          ))}
        </div>

        {tab === "dues" && (
          <>
            {pendingItems.length === 0 ? (
              <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
                No pending dues. All fees are cleared!
              </p>
            ) : (
              <>
                <p className="text-xs text-text-muted">
                  Select fee items to pay together.
                </p>
                {/* r21 — itemised fee table matching Results Portal layout. */}
                <div className="overflow-x-auto rounded border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-200">
                      <tr>
                        {["", "Component", "Semester", "Year", "Due Date", "Amount", "Status"].map((h) => (
                          <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingItems.map((item) => (
                        <tr
                          key={item.id}
                          className={cn(
                            "border-t border-border cursor-pointer transition-colors",
                            selectedFeeIds.includes(item.id) ? "bg-cream-100" : "even:bg-cream-50 hover:bg-cream-100",
                          )}
                          onClick={() => toggleFee(item.id)}
                        >
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedFeeIds.includes(item.id)}
                              onChange={() => toggleFee(item.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-2 font-medium">
                            {componentLabel[item.component] ?? item.component}
                          </td>
                          <td className="px-4 py-2">Sem {item.semester}</td>
                          <td className="px-4 py-2 text-text-muted">{item.academicYear}</td>
                          <td className="px-4 py-2 text-text-muted">{item.dueDate}</td>
                          <td className="px-4 py-2 font-medium">₹{item.amount.toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusColor[item.status])}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {payMsg && (
                  <div className={cn("rounded border p-3 text-sm", payMsg.type === "success" ? "border-[#3D6B4F] bg-[#F8FCF9] text-[#3D6B4F]" : "border-[#8B2F2F] bg-[#FDF5F5] text-[#8B2F2F]")}>
                    {payMsg.text}
                  </div>
                )}
                {selectedFeeIds.length > 0 && (
                  <div className="rounded border border-[#1C1810] bg-cream-100 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {selectedFeeIds.length} item{selectedFeeIds.length > 1 ? "s" : ""} selected
                      </p>
                      <p className="text-2xl font-light">₹{selectedAmount.toLocaleString()}</p>
                    </div>
                    <Button onClick={() => void handlePay()} disabled={paying || initiatePayment.isPending}>
                      {paying ? "Processing…" : "Pay Now"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {loadingHistory ? (
              <p className="text-sm text-text-muted">Loading history…</p>
            ) : paidItems.length === 0 ? (
              <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
                No payment history yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-cream-200">
                    <tr>
                      {["Component", "Semester", "Amount", "Paid On", "Receipt", "Status"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paidItems.map((item) => (
                      <tr key={item.id} className="border-t border-border even:bg-cream-50">
                        <td className="px-4 py-2">{componentLabel[item.component] ?? item.component}</td>
                        <td className="px-4 py-2">Sem {item.semester}</td>
                        <td className="px-4 py-2 font-medium">₹{item.amount.toLocaleString()}</td>
                        <td className="px-4 py-2 text-text-muted">{item.paidDate ?? "—"}</td>
                        <td className="px-4 py-2 text-text-muted font-mono text-xs">{item.receiptNo ?? "—"}</td>
                        <td className="px-4 py-2">
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusColor[item.status])}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
