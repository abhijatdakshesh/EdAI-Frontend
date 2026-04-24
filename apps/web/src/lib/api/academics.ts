/**
 * React Query hooks for Academics — Departments, Classes, Courses.
 * Backend: academics service → /api/departments, /api/classes, /api/courses
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Department {
  code: string;
  name: string;
  hodUserId: string;
  established: number;
  active: boolean;
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  departmentCode: string;
  semester: number;
  section: string;
  strength: number;
  classTeacherId: string;
  academicYear: string;
  createdAt: string;
}

export interface EnrolledStudent {
  usn: string;
  name: string;
  attendancePct?: number;
}

export type CourseType = "THEORY" | "LAB" | "ELECTIVE";

export interface Course {
  id: string;
  code: string;
  name: string;
  departmentCode: string;
  semester: number;
  credits: number;
  type: CourseType;
  syllabusUrl?: string;
  active: boolean;
  createdAt: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const deptKeys = {
  all: ["departments"] as const,
  detail: (code: string) => ["departments", code] as const,
};

export const classKeys = {
  all: ["classes"] as const,
  list: (f: object) => ["classes", "list", f] as const,
  detail: (id: string) => ["classes", "detail", id] as const,
  students: (id: string) => ["classes", id, "students"] as const,
};

export const courseKeys = {
  all: ["courses"] as const,
  list: (f: object) => ["courses", "list", f] as const,
  detail: (id: string) => ["courses", "detail", id] as const,
};

// ─── Department Hooks ─────────────────────────────────────────────────────────

export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: deptKeys.all,
    queryFn: () => apiGet<Department[]>("/api/departments"),
  });
}

export function useDepartment(code: string) {
  return useQuery<Department>({
    queryKey: deptKeys.detail(code),
    queryFn: () => apiGet<Department>(`/api/departments/${code}`),
    enabled: !!code,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Department, "active" | "createdAt">) =>
      apiPost<Department>("/api/departments", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: deptKeys.all }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, ...payload }: Partial<Department> & { code: string }) =>
      apiPatch<Department>(`/api/departments/${code}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: deptKeys.all }),
  });
}

// ─── Class Hooks ──────────────────────────────────────────────────────────────

export interface ClassesFilter {
  departmentCode?: string | undefined;
  semester?: number | undefined;
  academicYear?: string | undefined;
}

export function useClasses(filters: ClassesFilter = {}) {
  const params = new URLSearchParams();
  if (filters.departmentCode) params.set("departmentCode", filters.departmentCode);
  if (filters.semester) params.set("semester", String(filters.semester));
  if (filters.academicYear) params.set("academicYear", filters.academicYear);
  const qs = params.toString();

  return useQuery<Class[]>({
    queryKey: classKeys.list(filters),
    queryFn: () => apiGet<Class[]>(`/api/classes${qs ? `?${qs}` : ""}`),
  });
}

export function useClass(id: string) {
  return useQuery<Class>({
    queryKey: classKeys.detail(id),
    queryFn: () => apiGet<Class>(`/api/classes/${id}`),
    enabled: !!id,
  });
}

export function useClassStudents(classId: string) {
  return useQuery<EnrolledStudent[]>({
    queryKey: classKeys.students(classId),
    queryFn: () => apiGet<EnrolledStudent[]>(`/api/classes/${classId}/students`),
    enabled: !!classId,
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Class, "id" | "createdAt">) =>
      apiPost<Class>("/api/classes", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.all }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Class> & { id: string }) =>
      apiPatch<Class>(`/api/classes/${id}`, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: classKeys.all });
      qc.invalidateQueries({ queryKey: classKeys.detail(v.id) });
    },
  });
}

// ─── Course Hooks ─────────────────────────────────────────────────────────────

export interface CoursesFilter {
  departmentCode?: string | undefined;
  semester?: number | undefined;
  type?: CourseType | undefined;
  search?: string | undefined;
}

export function useCourses(filters: CoursesFilter = {}) {
  const params = new URLSearchParams();
  if (filters.departmentCode) params.set("departmentCode", filters.departmentCode);
  if (filters.semester) params.set("semester", String(filters.semester));
  if (filters.type) params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();

  return useQuery<Course[]>({
    queryKey: courseKeys.list(filters),
    queryFn: () => apiGet<Course[]>(`/api/courses${qs ? `?${qs}` : ""}`),
  });
}

export function useCourse(id: string) {
  return useQuery<Course>({
    queryKey: courseKeys.detail(id),
    queryFn: () => apiGet<Course>(`/api/courses/${id}`),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Course, "id" | "active" | "createdAt">) =>
      apiPost<Course>("/api/courses", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.all }),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Course> & { id: string }) =>
      apiPatch<Course>(`/api/courses/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.all }),
  });
}

export function useDeactivateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<Course>(`/api/courses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.all }),
  });
}
