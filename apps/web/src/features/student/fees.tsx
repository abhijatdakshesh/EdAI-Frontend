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

  const pendingItems = summary?.items.filter((i) => i.status !== "PAID") ?? [];
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
    try {
      const result = await initiatePayment.mutateAsync({
        studentUsn: usn,
        feeIds: selectedFeeIds,
        amount: selectedAmount,
        gateway: "RAZORPAY",
      });

      if (typeof window !== "undefined" && (window as unknown as { Razorpay?: unknown }).Razorpay) {
        const Razorpay = (window as unknown as { Razorpay: new (opts: unknown) => { open(): void } }).Razorpay;
        const rzp = new Razorpay({
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
            alert("Payment successful!");
          },
        });
        rzp.open();
      } else {
        alert(`Razorpay not loaded. Order ID: ${result.orderId}`);
      }
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Due", value: `₹${summary.totalDue.toLocaleString()}`, warn: false },
              { label: "Total Paid", value: `₹${summary.totalPaid.toLocaleString()}`, warn: false },
              { label: "Outstanding", value: `₹${summary.totalOutstanding.toLocaleString()}`, warn: summary.totalOutstanding > 0 },
              { label: "Status", value: summary.status, warn: summary.status !== "PAID" },
            ].map((s) => (
              <div key={s.label} className={cn("rounded border-l-4 bg-surface p-4",
                s.warn ? "border-l-[#8B6914]" : "border-l-[#3D6B4F]")}>
                <p className="label-track">{s.label}</p>
                <p className="mt-1 text-xl font-light">{s.value}</p>
              </div>
            ))}
          </div>
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
                <div className="grid gap-2">
                  {pendingItems.map((item) => (
                    <label
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 rounded border p-4 cursor-pointer transition-colors",
                        selectedFeeIds.includes(item.id)
                          ? "border-[#1C1810] bg-cream-100"
                          : "border-border bg-surface hover:border-[#1C1810]",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFeeIds.includes(item.id)}
                        onChange={() => toggleFee(item.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {componentLabel[item.component] ?? item.component}
                        </p>
                        <p className="text-xs text-text-muted">
                          Sem {item.semester} · {item.academicYear} · Due {item.dueDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{item.amount.toLocaleString()}</p>
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusColor[item.status])}>
                          {item.status}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedFeeIds.length > 0 && (
                  <div className="rounded border border-[#1C1810] bg-cream-100 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {selectedFeeIds.length} item{selectedFeeIds.length > 1 ? "s" : ""} selected
                      </p>
                      <p className="text-2xl font-light">₹{selectedAmount.toLocaleString()}</p>
                    </div>
                    <Button onClick={handlePay} disabled={paying || initiatePayment.isPending}>
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
