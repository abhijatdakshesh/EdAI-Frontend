"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useCourses,
  useDeactivateCourse,
  useDepartments,
  type CourseType,
} from "@/lib/api/academics";

const typeColors: Record<CourseType, string> = {
  THEORY: "bg-[#E6EEF5] text-[#2F567A]",
  LAB: "bg-[#EBF3EE] text-[#3D6B4F]",
  ELECTIVE: "bg-[#F5EDDB] text-[#8B6914]",
};

export function CourseManagement() {
  const [deptFilter, setDeptFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<CourseType | "">("");
  const [search, setSearch] = useState("");

  const { data: departments = [] } = useDepartments();
  const { data: courses = [], isLoading } = useCourses({
    departmentCode: deptFilter || undefined,
    type: typeFilter || undefined,
    search: search || undefined,
  });
  const deactivate = useDeactivateCourse();

  return (
    <AppShell title="Course Management">
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Courses", value: courses.length },
            { label: "Theory", value: courses.filter((c) => c.type === "THEORY").length },
            { label: "Lab Courses", value: courses.filter((c) => c.type === "LAB").length },
            { label: "Electives", value: courses.filter((c) => c.type === "ELECTIVE").length },
          ].map((s) => (
            <div key={s.label} className="rounded border border-border bg-surface p-4">
              <p className="label-track">{s.label}</p>
              <p className="mt-1 text-3xl font-light">
                {isLoading ? "—" : s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search course name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none flex-1 min-w-[180px]"
          />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CourseType | "")}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm"
          >
            <option value="">All Types</option>
            <option value="THEORY">Theory</option>
            <option value="LAB">Lab</option>
            <option value="ELECTIVE">Elective</option>
          </select>
          <Button size="sm">+ Add Course</Button>
        </div>

        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-cream-200">
              <tr>
                {["VTU Code","Title","Dept","Sem","Credits","Type","Actions"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left label-track">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-border animate-pulse">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 w-20 rounded bg-cream-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                : courses.map((c) => (
                    <tr key={c.id} className="border-t border-border even:bg-cream-50">
                      <td className="px-4 py-2 font-mono text-xs font-medium">
                        {c.code}
                      </td>
                      <td className="px-4 py-2 font-medium">{c.name}</td>
                      <td className="px-4 py-2">{c.departmentCode}</td>
                      <td className="px-4 py-2">Sem {c.semester}</td>
                      <td className="px-4 py-2">{c.credits}</td>
                      <td className="px-4 py-2">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            typeColors[c.type],
                          )}
                        >
                          {c.type}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button className="text-xs text-[#2F567A] hover:underline">
                            Edit
                          </button>
                          <button
                            className="text-xs text-[#8B2F2F] hover:underline disabled:opacity-40"
                            disabled={deactivate.isPending}
                            onClick={() => {
                              if (confirm(`Deactivate ${c.code}?`))
                                deactivate.mutate(c.id);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && courses.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-text-muted">
              No courses found.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
