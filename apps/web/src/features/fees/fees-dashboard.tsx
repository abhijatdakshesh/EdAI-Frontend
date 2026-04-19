"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";

import { collectPayment, getFeesDashboard } from "./repository";
import type { FeesDashboardResponse } from "./types";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    value
  );
}

export function FeesDashboard() {
  const [data, setData] = useState<FeesDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyInvoiceId, setBusyInvoiceId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getFeesDashboard());
    } finally {
      setLoading(false);
    }
  }

  async function onCollect(invoiceId: string) {
    setBusyInvoiceId(invoiceId);
    try {
      await collectPayment(invoiceId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              dues: prev.dues.map((d) => (d.invoiceId === invoiceId ? { ...d, status: "paid", dueAmount: 0 } : d))
            }
          : prev
      );
    } finally {
      setBusyInvoiceId(null);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AppShell title="Fees">
      <div className="grid gap-4">
        <ModuleCard
          heading="Collection Snapshot"
          description={
            data
              ? `Generated ${new Date(data.generatedAt).toLocaleTimeString()} • Total Due ${formatINR(
                  data.totalDueAmount
                )} • Overdue ${data.overdueCount}`
              : "Loading fee dues..."
          }
        >
          <Button onClick={() => void load()}>{loading ? "Refreshing..." : "Refresh Dues"}</Button>
        </ModuleCard>

        {data ? (
          <ModuleCard
            heading="Active Invoices"
            description={data.dues
              .map((d) => `${d.studentName} • ${formatINR(d.dueAmount)} • ${d.status}`)
              .join(" • ")}
          >
            <div className="space-y-2">
              {data.dues.map((d) => (
                <div key={d.invoiceId} className="flex items-center justify-between rounded border p-2">
                  <div>
                    <p className="text-sm font-medium">{d.studentName}</p>
                    <p className="text-xs text-text-secondary">
                      {d.program} • Due {formatINR(d.dueAmount)} • {d.status}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyInvoiceId === d.invoiceId || d.status === "paid"}
                    onClick={() => void onCollect(d.invoiceId)}
                  >
                    {d.status === "paid" ? "Collected" : "Collect"}
                  </Button>
                </div>
              ))}
            </div>
          </ModuleCard>
        ) : null}
      </div>
    </AppShell>
  );
}
