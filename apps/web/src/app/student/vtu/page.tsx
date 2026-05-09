"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";

const VTU_RESULTS_URL = "https://results.vtu.ac.in/JJEcbcs25/index.php";

export default function StudentVTUPage() {
  useEffect(() => {
    const t = setTimeout(() => {
      window.open(VTU_RESULTS_URL, "_blank", "noopener,noreferrer");
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <AppShell title="VTU Results">
      <div className="grid place-items-center min-h-[50vh]">
        <div className="max-w-md text-center grid gap-4 rounded border border-border bg-surface p-8">
          <p className="label-track">Redirecting</p>
          <h2 className="text-2xl font-light">Opening official VTU Results portal…</h2>
          <p className="text-sm text-text-muted">
            Your browser should open <span className="font-mono">results.vtu.ac.in</span> in a new tab.
            If it doesn&apos;t, click the button below.
          </p>
          <a href={VTU_RESULTS_URL} target="_blank" rel="noopener noreferrer">
            <Button className="w-full">Open VTU Results Portal</Button>
          </a>
          <p className="text-xs text-text-muted">
            VTU is the source of truth for declared results. Use your USN + DOB on the VTU page.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
