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

  return useQuery<UsersListResult>({
    queryKey: userKeys.list(filters),
    queryFn: () => apiGet<UsersListResult>(`/api/users${qs ? `?${qs}` : ""}`),
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
