"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useMyChildren, useChildFees, useInitiateChildPayment, useVerifyChildPayment } from "@/lib/api/parent";

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

export function ParentFees() {
  const { data: session } = useSession();
  const { data: children = [], isLoading: loadingChildren } = useMyChildren();
  const [selectedUsn, setSelectedUsn] = useState("");
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState<{ type: "success" | "error" | "warn"; text: string } | null>(null);

  const activeUsn = selectedUsn || (children[0]?.usn ?? "");
  const { data: fees, isLoading: loadingFees } = useChildFees(activeUsn);
  const initiatePayment = useInitiateChildPayment();
  const verifyPayment = useVerifyChildPayment();

  const pendingItems = fees?.items.filter((i) => i.status !== "PAID") ?? [];
  const paidItems = fees?.items.filter((i) => i.status === "PAID") ?? [];

  const selectedAmount = pendingItems
    .filter((i) => selectedFeeIds.includes(i.id))
    .reduce((sum, i) => sum + i.amount, 0);

  function toggleFee(id: string) {
    setSelectedFeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handlePay() {
    if (!activeUsn || selectedFeeIds.length === 0) return;
    setPaying(true);
    try {
      const result = await initiatePayment.mutateAsync({
        childUsn: activeUsn,
        feeIds: selectedFeeIds,
        amount: selectedAmount,
      });

      if (typeof window !== "undefined" && (window as unknown as { Razorpay?: unknown }).Razorpay) {
        const Razorpay = (window as unknown as { Razorpay: new (opts: unknown) => { open(): void } }).Razorpay;
        const rzp = new Razorpay({
          key: result.key ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: result.amount * 100,
          currency: result.currency,
          order_id: result.orderId,
          name: "RV Trust ERP",
          description: `Fee Payment — ${children.find((c) => c.usn === activeUsn)?.name ?? activeUsn}`,
          prefill: { email: session?.user?.email ?? "" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              const verifyResult = await verifyPayment.mutateAsync({
                childUsn: activeUsn,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
              if (verifyResult.success) {
                setSelectedFeeIds([]);
                setPayMsg({ type: "success", text: `Payment successful! Receipt: ${verifyResult.receiptId}` });
              } else {
                setPayMsg({ type: "error", text: "Payment verification failed. Please contact accounts@rvitm.edu.in" });
              }
            } catch {
              setPayMsg({ type: "error", text: "Payment verification error. Please contact support." });
            }
          },
        });
        rzp.open();
      } else {
        setPayMsg({ type: "warn", text: `Payment gateway not loaded. Please refresh and try again. (Order ID: ${result.orderId})` });
      }
    } finally {
      setPaying(false);
    }
  }

  return (
    <AppShell title="Fees">
      <div className="grid gap-5">
        {/* Child selector */}
        {children.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {children.map((c) => (
              <button
                key={c.usn}
                onClick={() => { setSelectedUsn(c.usn); setSelectedFeeIds([]); }}
                className={cn(
                  "rounded border px-4 py-2 text-sm transition-colors",
                  activeUsn === c.usn
                    ? "border-[#1C1810] bg-[#1C1810] text-[#F2EFE9]"
                    : "border-border bg-surface hover:border-[#1C1810]",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {loadingChildren ? (
          <p className="text-sm text-text-muted">Loading children…</p>
        ) : children.length === 0 ? (
          <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
            No children linked to your account.
          </p>
        ) : (
          <>
            {/* Summary */}
            {loadingFees ? (
              <div data-testid="fees-loading-skeleton" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded border border-border bg-surface h-20" />
                ))}
              </div>
            ) : !fees ? (
              <p className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
                No fee data available.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Due", value: `₹${(fees.totalDue ?? 0).toLocaleString()}` },
                  { label: "Paid", value: `₹${(fees.totalPaid ?? 0).toLocaleString()}` },
                  { label: "Outstanding", value: `₹${(fees.totalOutstanding ?? 0).toLocaleString()}`, warn: (fees.totalOutstanding ?? 0) > 0 },
                  { label: "Status", value: fees.status ?? "PENDING", warn: fees.status !== "PAID" },
                ].map((s) => (
                  <div key={s.label} className={cn("rounded border-l-4 bg-surface p-4",
                    (s as { warn?: boolean }).warn ? "border-l-[#8B6914]" : "border-l-[#3D6B4F]")}>
                    <p className="label-track">{s.label}</p>
                    <p className="mt-1 text-xl font-light">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Pending dues */}
            {pendingItems.length > 0 && (
              <div>
                <p className="label-track mb-3">Pending Dues</p>
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
                        <p className="font-medium text-sm">{componentLabel[item.component] ?? item.component}</p>
                        <p className="text-xs text-text-muted">Sem {item.semester} · {item.academicYear} · Due {item.dueDate}</p>
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

                {payMsg && (
                  <p className={cn("text-xs mt-2",
                    payMsg.type === "success" ? "text-[#3D6B4F]" : payMsg.type === "warn" ? "text-[#8B6914]" : "text-[#8B2F2F]")}>
                    {payMsg.text}
                  </p>
                )}
                {selectedFeeIds.length > 0 && (
                  <div className="mt-3 rounded border border-[#1C1810] bg-cream-100 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedFeeIds.length} item{selectedFeeIds.length > 1 ? "s" : ""} selected</p>
                      <p className="text-2xl font-light">₹{selectedAmount.toLocaleString()}</p>
                    </div>
                    <Button onClick={handlePay} disabled={paying}>
                      {paying ? "Processing…" : "Pay Now"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Paid history */}
            {paidItems.length > 0 && (
              <div>
                <p className="label-track mb-2">Payment History</p>
                <div className="overflow-x-auto rounded border border-border">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-cream-200">
                      <tr>
                        {["Component", "Sem", "Amount", "Paid On", "Receipt"].map((h) => (
                          <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paidItems.map((item) => (
                        <tr key={item.id} className="border-t border-border even:bg-cream-50">
                          <td className="px-4 py-2">{componentLabel[item.component] ?? item.component}</td>
                          <td className="px-4 py-2">{item.semester}</td>
                          <td className="px-4 py-2 font-medium">₹{item.amount.toLocaleString()}</td>
                          <td className="px-4 py-2 text-text-muted">{item.paidDate ?? "—"}</td>
                          <td className="px-4 py-2 font-mono text-xs text-text-muted">{item.receiptNo ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
