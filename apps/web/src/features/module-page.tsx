"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/shell";
import { ModuleCard } from "@/components/layout/module-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/use-auth";
import type { UserRole } from "@/lib/auth/session";
import { phaseModules } from "@/lib/roadmap/phases";

import { getModuleRuntimeStatus } from "./runtime/repository";
import type { ModuleRuntimeStatus } from "./runtime/types";

export function ModulePage({
  moduleKey,
  primaryAction,
  allowedRoles = ["ADMIN", "FACULTY"],
}: {
  moduleKey: string;
  primaryAction: string;
  allowedRoles?: UserRole[];
}) {
  const { session } = useAuth();
  const module = phaseModules.find((item) => item.key === moduleKey);
  const [runtime, setRuntime] = useState<ModuleRuntimeStatus | null>(null);

  useEffect(() => {
    let active = true;
    void getModuleRuntimeStatus(moduleKey).then((res) => {
      if (active) setRuntime(res);
    });
    return () => {
      active = false;
    };
  }, [moduleKey]);

  if (!module) return null;

  return (
    <AppShell title={module.title}>
      {session && !allowedRoles.includes(session.role) ? (
        <ModuleCard
          heading="Access restricted"
          description={`This module is available for ${allowedRoles.join(", ")} roles.`}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ModuleCard heading={`${module.title} Workspace`} description={module.description}>
            <div className="flex gap-3">
              <Button>{primaryAction}</Button>
              <Button variant="outline">View Reports</Button>
            </div>
          </ModuleCard>
          <ModuleCard
            heading={`Phase ${module.phase} Checklist`}
            description={module.checklist.join(" • ")}
          />
          <ModuleCard
            heading="Runtime Status"
            description={
              runtime
                ? `${runtime.healthy ? "Healthy" : "Needs attention"} • Pending ${runtime.pendingActions} • ${runtime.note}`
                : "Loading module runtime state..."
            }
          />
        </div>
      )}
    </AppShell>
  );
}
