"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { useDepartments, useUpdateDepartment, type Department } from "@/lib/api/academics";

export function Departments() {
  const [selected, setSelected] = useState<Department | null>(null);

  const { data: depts = [], isLoading, error } = useDepartments();
  const updateDept = useUpdateDepartment();

  const totalEstimatedFaculty = depts.length * 25; // placeholder until analytics endpoint
  const totalEstimatedStudents = depts.length * 360;

  return (
    <AppShell title="Departments">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Departments", value: depts.length },
              { label: "Active", value: depts.filter((d) => d.active).length },
              { label: "Est. Faculty", value: totalEstimatedFaculty },
              { label: "Est. Students", value: totalEstimatedStudents },
            ].map((s) => (
              <div key={s.label} className="rounded border border-border bg-surface p-4">
                <p className="label-track">{s.label}</p>
                <p className="mt-1 text-3xl font-light">
                  {isLoading ? "—" : s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button size="sm">+ Add Department</Button>
            <Button size="sm" variant="outline">Export</Button>
          </div>

          {error && (
            <p className="rounded bg-[#F5E6E6] px-4 py-3 text-sm text-[#8B2F2F]">
              Failed to load departments: {(error as Error).message}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded border border-border bg-surface p-4 h-28 animate-pulse"
                  />
                ))
              : depts.map((dept) => (
                  <button
                    key={dept.code}
                    onClick={() =>
                      setSelected(selected?.code === dept.code ? null : dept)
                    }
                    className={`rounded border p-4 text-left transition-colors hover:border-[#1C1810] ${
                      selected?.code === dept.code
                        ? "border-[#1C1810] bg-cream-100"
                        : "border-border bg-surface"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{dept.code}</p>
                        <p className="text-xs text-text-muted mt-0.5">{dept.name}</p>
                      </div>
                      <span className="label-track text-xs">
                        Est. {dept.established}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      HOD: {dept.hodUserId}
                    </p>
                    <div className="mt-1">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          dept.active
                            ? "bg-[#EBF3EE] text-[#3D6B4F]"
                            : "bg-[#F0EEEB] text-[#6B6358]"
                        }`}
                      >
                        {dept.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </button>
                ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="rounded border border-border bg-surface p-5 self-start sticky top-4">
            <p className="label-track">Department Details</p>
            <h3 className="mt-2 text-2xl font-light">{selected.code}</h3>
            <p className="text-sm text-text-muted">{selected.name}</p>
            <span className="ray-rule ml-0" />
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-text-muted">HOD User ID</dt>
                <dd className="font-medium">{selected.hodUserId}</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-text-muted">Established</dt>
                <dd>{selected.established}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Status</dt>
                <dd>{selected.active ? "Active" : "Inactive"}</dd>
              </div>
            </dl>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={updateDept.isPending}
                onClick={() =>
                  updateDept.mutate({
                    code: selected.code,
                    active: !selected.active,
                  })
                }
              >
                {selected.active ? "Deactivate" : "Activate"}
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                View Faculty
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted self-start">
            Select a department to view details
          </div>
        )}
      </div>
    </AppShell>
  );
}
