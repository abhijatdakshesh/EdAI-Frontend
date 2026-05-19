"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiDownload } from "@/lib/api/client";
import {
  useUsers,
  useCreateUser,
  useSetUserStatus,
  useResetUserPassword,
  type UserRole,
  type CreateUserPayload,
} from "@/lib/api/users";

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-[#F5E6E6] text-[#8B2F2F]",
  FACULTY: "bg-[#E6EEF5] text-[#2F567A]",
  HOD: "bg-[#EBF3EE] text-[#3D6B4F]",
  STUDENT: "bg-[#F5EDDB] text-[#8B6914]",
  PARENT: "bg-[#F0EBF5] text-[#6B2F8B]",
  COUNSELLOR: "bg-[#EBF3EE] text-[#3D6B4F]",
  PRINCIPAL: "bg-[#F5E6E6] text-[#8B2F2F]",
  DEAN: "bg-[#E6EEF5] text-[#2F567A]",
  TRUSTEE: "bg-[#F5EDDB] text-[#8B6914]",
};

const ALL_ROLES: UserRole[] = [
  "ADMIN","FACULTY","HOD","STUDENT","PARENT","COUNSELLOR","PRINCIPAL","DEAN","TRUSTEE",
];

const EMPTY_FORM: CreateUserPayload = {
  name: "", email: "", password: "",
  role: "STUDENT", institutionId: "rvce",
};

export function UserManagement() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "">("");
  const [filterStatus, setFilterStatus] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateUserPayload>(EMPTY_FORM);

  const { data, isLoading, error } = useUsers({
    role: filterRole || undefined,
    status: filterStatus || undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  const createUser = useCreateUser();
  const setStatus = useSetUserStatus();
  const resetPwd = useResetUserPassword();

  const users = data?.data ?? [];
  const total = data?.total ?? 0;

  function handleCreate() {
    // KAN-24 #1: STUDENT records key on sapId (USN). Without it the dashboard
    // falls through to UUID lookup and renders demo data tagged for another
    // student. Block submit so the admin sets it explicitly at create time.
    if (form.role === "STUDENT" && !(form.sapId ?? "").trim()) {
      alert("USN / SAP ID is required for STUDENT accounts. Without it the student dashboard cannot map to the right academic record.");
      return;
    }
    createUser.mutate(form, {
      onSuccess: () => {
        setShowCreate(false);
        setForm(EMPTY_FORM);
      },
    });
  }

  return (
    <AppShell title="User Management">
      <div className="grid gap-5">

        {/* Stats */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: total },
            { label: "Shown", value: users.length },
            { label: "Active", value: users.filter((u) => u.isActive).length },
            { label: "Inactive", value: users.filter((u) => !u.isActive).length },
          ].map((s) => (
            <div key={s.label} className="rounded border border-border bg-surface p-4">
              <p className="label-track">{s.label}</p>
              <p className="mt-1 text-3xl font-light">
                {isLoading ? "—" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters + actions */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, email or SAP ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1C1810] flex-1 min-w-[200px]"
          />
          <select
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value as UserRole | ""); setPage(1); }}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="">All Roles</option>
            {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as "" | "active" | "inactive"); setPage(1); }}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button size="sm" onClick={() => setShowCreate(true)}>+ Add User</Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => apiDownload("/api/users/export?format=csv", "users.csv").catch(e => alert(`Export failed: ${(e as Error).message}`))}
          >
            Export CSV
          </Button>
        </div>

        {/* Create user modal */}
        {showCreate && (
          <div className="rounded border border-[#1C1810] bg-surface p-5 grid gap-3">
            <p className="font-medium">Create New User</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(["name", "email", "password"] as const).map((field) => (
                <input
                  key={field}
                  type={field === "password" ? "password" : "text"}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none col-span-1"
                />
              ))}
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
              >
                {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input
                type="text"
                placeholder={form.role === "STUDENT" ? "USN / SAP ID (required)" : "SAP ID (optional)"}
                value={form.sapId ?? ""}
                onChange={(e) => setForm({ ...form, sapId: e.target.value })}
                required={form.role === "STUDENT"}
                className={cn(
                  "rounded border bg-white px-3 py-1.5 text-sm focus:outline-none",
                  form.role === "STUDENT" && !(form.sapId ?? "").trim()
                    ? "border-[#8B2F2F]"
                    : "border-border",
                )}
              />
              <input
                type="text"
                placeholder="Dept code (e.g. CSE)"
                value={form.departmentCode ?? ""}
                onChange={(e) => setForm({ ...form, departmentCode: e.target.value })}
                className="rounded border border-border bg-white px-3 py-1.5 text-sm focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={createUser.isPending}
              >
                {createUser.isPending ? "Creating…" : "Create User"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
            {createUser.isError && (
              <p className="text-xs text-[#8B2F2F]">{(createUser.error as Error).message}</p>
            )}
          </div>
        )}

        {/* Error state */}
        {error && (
          <p className="rounded bg-[#F5E6E6] px-4 py-3 text-sm text-[#8B2F2F]">
            Failed to load users: {(error as Error).message}
          </p>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-cream-200">
              <tr>
                {["Name", "Email", "Role", "Department", "Status", "SAP ID", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left label-track">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border animate-pulse">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 w-24 rounded bg-cream-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                : users.map((u) => (
                    <tr key={u.id} className="border-t border-border even:bg-cream-50">
                      <td className="px-4 py-2 font-medium">{u.name}</td>
                      <td className="px-4 py-2 text-text-muted">{u.email}</td>
                      <td className="px-4 py-2">
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", roleColors[u.role])}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-2">{u.departmentCode ?? "—"}</td>
                      <td className="px-4 py-2">
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                          u.isActive
                            ? "bg-[#EBF3EE] text-[#3D6B4F]"
                            : "bg-[#F0EEEB] text-[#6B6358]")}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-text-muted">{u.sapId ?? "—"}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            className="text-xs text-[#8B2F2F] hover:underline disabled:opacity-50"
                            disabled={setStatus.isPending}
                            onClick={() =>
                              setStatus.mutate({ id: u.id, isActive: !u.isActive })
                            }
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className="text-xs text-[#2F567A] hover:underline"
                            onClick={() => {
                              if (confirm(`Reset password for ${u.name}?`)) {
                                resetPwd.mutate(u.id, {
                                  onSuccess: (r) =>
                                    alert(`Temp password: ${r.tempPassword}`),
                                });
                              }
                            }}
                          >
                            Reset PWD
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && users.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-text-muted">
              No users match the current filters.
            </p>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center gap-3 text-sm">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-border px-3 py-1 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-text-muted">
              Page {page} · {total} total users
            </span>
            <button
              disabled={page * 20 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-border px-3 py-1 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
        {!isLoading && (
          <p className="text-xs text-text-muted">
            {users.length} of {total} users shown
          </p>
        )}
      </div>
    </AppShell>
  );
}
