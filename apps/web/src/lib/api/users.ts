/**
 * React Query hooks for User management (Admin portal).
 * Backend: identity service → GET/POST/PATCH /api/users
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole =
  | "STUDENT" | "PARENT" | "FACULTY" | "HOD" | "DEAN"
  | "PRINCIPAL" | "TRUSTEE" | "COUNSELLOR" | "ADMIN";

export type Language = "kn" | "en" | "hi" | "ta" | "te" | "ml";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institutionId: string;
  sapId?: string;
  departmentCode?: string;
  preferredLanguage: Language;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersListResult {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UsersFilter {
  role?: string | undefined;
  status?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  institutionId: string;
  sapId?: string;
  departmentCode?: string;
  preferredLanguage?: Language;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole;
  sapId?: string;
  departmentCode?: string;
  preferredLanguage?: Language;
}

// ─── Mock data (NEXT_PUBLIC_USE_MOCKS=true) ──────────────────────────────────
//
// CI runs the e2e gate with mocks on and no backend, so `apiGet('/api/users')`
// would resolve to an empty list — breaking the @P1 admin user-table test
// which asserts on the per-row Deactivate/Reset PWD buttons. Mirror the
// pattern used in parent.ts / jobs.ts: when mocks are on, short-circuit the
// query with a hand-crafted realistic dataset.

const MOCK_USERS: User[] = [
  { id: "u-001", name: "Arjun Kumar",       email: "arjun.kumar@rvce.edu",      role: "STUDENT",    institutionId: "rvce", sapId: "1RV21CS001", departmentCode: "CSE", preferredLanguage: "en", isActive: true,  createdAt: "2026-04-01T09:00:00Z", updatedAt: "2026-05-01T09:00:00Z" },
  { id: "u-002", name: "Priya Sharma",      email: "priya.sharma@rvce.edu",     role: "STUDENT",    institutionId: "rvce", sapId: "1RV21CS002", departmentCode: "CSE", preferredLanguage: "en", isActive: true,  createdAt: "2026-04-01T09:00:00Z", updatedAt: "2026-05-01T09:00:00Z" },
  { id: "u-003", name: "Dr. Suresh Babu",   email: "suresh.babu@rvce.edu",      role: "FACULTY",    institutionId: "rvce", sapId: "FAC-CS-014", departmentCode: "CSE", preferredLanguage: "en", isActive: true,  createdAt: "2025-08-15T09:00:00Z", updatedAt: "2026-05-01T09:00:00Z" },
  { id: "u-004", name: "Dr. Rekha Nair",    email: "rekha.nair@rvce.edu",       role: "HOD",        institutionId: "rvce", sapId: "FAC-CS-001", departmentCode: "CSE", preferredLanguage: "en", isActive: true,  createdAt: "2024-06-01T09:00:00Z", updatedAt: "2026-05-01T09:00:00Z" },
  { id: "u-005", name: "Mr. Ramesh Kumar",  email: "ramesh.kumar@gmail.com",    role: "PARENT",     institutionId: "rvce",                                              preferredLanguage: "kn", isActive: true,  createdAt: "2026-04-02T09:00:00Z", updatedAt: "2026-05-01T09:00:00Z" },
  { id: "u-006", name: "Mrs. Lakshmi Devi", email: "lakshmi.devi@gmail.com",    role: "PARENT",     institutionId: "rvce",                                              preferredLanguage: "kn", isActive: false, createdAt: "2026-04-02T09:00:00Z", updatedAt: "2026-05-10T09:00:00Z" },
  { id: "u-007", name: "Dr. Anitha Rao",    email: "anitha.rao@rvce.edu",       role: "PRINCIPAL",  institutionId: "rvce", sapId: "PRIN-001",                          preferredLanguage: "en", isActive: true, createdAt: "2024-04-01T09:00:00Z", updatedAt: "2026-05-01T09:00:00Z" },
  { id: "u-008", name: "Prof. Kavitha Menon",email: "kavitha.menon@rvce.edu",   role: "FACULTY",    institutionId: "rvce", sapId: "FAC-CS-022", departmentCode: "CSE", preferredLanguage: "en", isActive: true,  createdAt: "2025-08-15T09:00:00Z", updatedAt: "2026-05-01T09:00:00Z" },
];

function mockUsersList(filters: UsersFilter): UsersListResult {
  let rows = [...MOCK_USERS];
  if (filters.role) rows = rows.filter(u => u.role === filters.role);
  if (filters.status === "active")   rows = rows.filter(u => u.isActive);
  if (filters.status === "inactive") rows = rows.filter(u => !u.isActive);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const start = (page - 1) * limit;
  return { data: rows.slice(start, start + limit), total: rows.length, page, limit };
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const userKeys = {
  all: ["users"] as const,
  list: (filters: UsersFilter) => ["users", "list", filters] as const,
  detail: (id: string) => ["users", "detail", id] as const,
  me: ["users", "me"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Paginated, filtered user list — Admin portal */
export function useUsers(filters: UsersFilter = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.set("role", filters.role);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();

  const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

  return useQuery<UsersListResult>({
    queryKey: userKeys.list(filters),
    queryFn: USE_MOCKS
      ? () => Promise.resolve(mockUsersList(filters))
      : () => apiGet<UsersListResult>(`/api/users${qs ? `?${qs}` : ""}`),
  });
}

/** Current authenticated user */
export function useMe() {
  return useQuery<User>({
    queryKey: userKeys.me,
    queryFn: () => apiGet<User>("/api/users/me"),
  });
}

/** Single user detail */
export function useUser(id: string) {
  return useQuery<User>({
    queryKey: userKeys.detail(id),
    queryFn: () => apiGet<User>(`/api/users/${id}`),
    enabled: !!id,
  });
}

/** Create a new user */
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      apiPost<User>("/api/users", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

/** Update user profile */
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateUserPayload & { id: string }) =>
      apiPatch<User>(`/api/users/${id}`, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: userKeys.detail(vars.id) });
    },
  });
}

/** Activate / deactivate user */
export function useSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPatch<User>(`/api/users/${id}/status`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

/** Reset user password (returns { tempPassword }) */
export function useResetUserPassword() {
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<{ tempPassword: string }>(`/api/users/${id}/reset-password`, {}),
  });
}
