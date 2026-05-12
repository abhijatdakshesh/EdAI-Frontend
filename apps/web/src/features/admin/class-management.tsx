"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClasses, useClassStudents, useCreateClass } from "@/lib/api/academics";
import { useDepartments } from "@/lib/api/academics";

export function ClassManagement() {
  const [deptFilter, setDeptFilter] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    departmentCode: "CSE",
    semester: 1,
    section: "A",
    strength: 60,
    classTeacherId: "",
    academicYear: "2025-26",
  });

  const { data: departments = [] } = useDepartments();
  const { data: classes = [], isLoading } = useClasses({
    departmentCode: deptFilter || undefined,
  });
  const { data: students = [], isLoading: loadingStudents } = useClassStudents(
    selectedClassId ?? "",
  );
  const createClass = useCreateClass();

  const totalStrength = classes.reduce((a, c) => a + c.strength, 0);
  const depts = ["", ...departments.map((d) => d.code)];

  return (
    <AppShell title="Class Management">
      <div className="grid gap-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Classes", value: classes.length },
            { label: "Departments", value: departments.length },
            { label: "Total Students", value: totalStrength },
            { label: "Academic Year", value: "2024-25" },
          ].map((s) => (
            <div key={s.label} className="rounded border border-border bg-surface p-4">
              <p className="label-track">{s.label}</p>
              <p className="mt-1 text-3xl font-light">
                {isLoading ? "—" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="">All Departments</option>
            {depts.filter(Boolean).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? "Cancel" : "+ Add Class"}
          </Button>
          <Button size="sm" variant="outline">
            Manage Sections
          </Button>
        </div>

        {showAdd && (
          <form
            className="rounded border border-border bg-surface p-4 grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              createClass.mutate(form, {
                onSuccess: () => {
                  setShowAdd(false);
                  setForm({ ...form, name: "" });
                },
              });
            }}
          >
            <input
              required
              placeholder="Class name (e.g. CSE-A 2025)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded border border-border bg-surface px-3 py-1.5 text-sm sm:col-span-2"
            />
            <select
              value={form.departmentCode}
              onChange={(e) => setForm({ ...form, departmentCode: e.target.value })}
              className="rounded border border-border bg-surface px-3 py-1.5 text-sm"
            >
              {departments.length
                ? departments.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code}
                    </option>
                  ))
                : ["CSE", "ISE", "ECE", "EEE", "ME"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
            </select>
            <input
              type="number" min={1} max={8}
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: +e.target.value })}
              className="rounded border border-border bg-surface px-3 py-1.5 text-sm"
              placeholder="Sem"
            />
            <input
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              className="rounded border border-border bg-surface px-3 py-1.5 text-sm"
              placeholder="Section (A)"
            />
            <input
              type="number" min={10} max={120}
              value={form.strength}
              onChange={(e) => setForm({ ...form, strength: +e.target.value })}
              className="rounded border border-border bg-surface px-3 py-1.5 text-sm"
              placeholder="Strength"
            />
            <Button type="submit" size="sm" className="sm:col-span-3" disabled={createClass.isPending || !form.name}>
              {createClass.isPending ? "Creating…" : "Create Class"}
            </Button>
            {createClass.error && (
              <p className="sm:col-span-3 text-xs text-[#8B2F2F]">
                {(createClass.error as Error).message}
              </p>
            )}
          </form>
        )}

        {/* Table + student panel */}
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead className="bg-cream-200">
                <tr>
                  {[
                    "Class","Dept","Sem","Section","Strength",
                    "Class Teacher","Actions",
                  ].map((h) => (
                    <th key={h} className="px-4 py-2 text-left label-track">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-border animate-pulse">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-3 w-20 rounded bg-cream-200" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : classes.map((c) => (
                      <tr
                        key={c.id}
                        className={cn(
                          "border-t border-border even:bg-cream-50",
                          selectedClassId === c.id && "bg-cream-100",
                        )}
                      >
                        <td className="px-4 py-2 font-medium">{c.name}</td>
                        <td className="px-4 py-2">{c.departmentCode}</td>
                        <td className="px-4 py-2">Sem {c.semester}</td>
                        <td className="px-4 py-2">Sec {c.section}</td>
                        <td className="px-4 py-2">{c.strength}</td>
                        <td className="px-4 py-2 text-text-muted">
                          {c.classTeacherId}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            className="text-xs text-[#2F567A] hover:underline"
                            onClick={() =>
                              setSelectedClassId(
                                selectedClassId === c.id ? null : c.id,
                              )
                            }
                          >
                            {selectedClassId === c.id ? "Hide" : "View Students"}
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!isLoading && classes.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-text-muted">
                No classes found.
              </p>
            )}
          </div>

          {/* Student list panel */}
          {selectedClassId ? (
            <div className="rounded border border-border bg-surface p-4 self-start">
              <p className="label-track mb-3">
                Students —{" "}
                {classes.find((c) => c.id === selectedClassId)?.name}
              </p>
              {loadingStudents ? (
                <p className="text-sm text-text-muted">Loading…</p>
              ) : (
                <div className="grid gap-2">
                  {students.map((s) => (
                    <div
                      key={s.usn}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-text-muted">{s.usn}</p>
                      </div>
                      {s.attendancePct !== undefined && (
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            s.attendancePct >= 85
                              ? "bg-[#EBF3EE] text-[#3D6B4F]"
                              : s.attendancePct >= 75
                                ? "bg-[#F5EDDB] text-[#8B6914]"
                                : "bg-[#F5E6E6] text-[#8B2F2F]",
                          )}
                        >
                          {s.attendancePct}%
                        </span>
                      )}
                    </div>
                  ))}
                  {students.length === 0 && (
                    <p className="text-sm text-text-muted">
                      No enrolled students found.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted self-start">
              Select a class to view students
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
