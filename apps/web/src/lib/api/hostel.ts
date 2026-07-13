import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "./client";

// ── Types (mirror EdAI-Backend hostel module) ──

export interface MessMenuRow {
  day: string;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
}

export interface HostelAllocation {
  studentUsn: string;
  block: string;
  blockType: string;
  roomNumber: string;
  floor: number;
  bedNo: number;
  messType: string;
  warden: string | null;
  wardenPhone: string | null;
  status: string;
  messMenu: MessMenuRow[];
}

export interface Complaint {
  id: string;
  studentUsn: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface LeaveRequest {
  id: string;
  studentUsn: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  approvedBy: string | null;
  createdAt: string;
}

export interface OccupancyRow {
  block: string;
  type: string;
  capacity: number;
  occupied: number;
}

// ── Query keys ──

export const hostelKeys = {
  student: (usn: string) => ["hostel", "student", usn] as const,
  complaints: (status?: string) => ["hostel", "complaints", status ?? "all"] as const,
  leave: (status?: string) => ["hostel", "leave", status ?? "all"] as const,
  occupancy: () => ["hostel", "occupancy"] as const,
};

// ── Student hooks ──

export function useStudentHostel(usn: string) {
  return useQuery<HostelAllocation | null>({
    queryKey: hostelKeys.student(usn),
    queryFn: () => apiGet<HostelAllocation | null>(`/api/hostel/student/${usn}`),
    enabled: !!usn,
  });
}

export function useRaiseComplaint(usn: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { category: string; description: string }) =>
      apiPost<Complaint>(`/api/hostel/student/${usn}/complaints`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: hostelKeys.complaints() }),
  });
}

export function useRequestLeave(usn: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { fromDate: string; toDate: string; reason: string }) =>
      apiPost<LeaveRequest>(`/api/hostel/student/${usn}/leave`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: hostelKeys.leave() }),
  });
}

// ── Warden / admin hooks ──

export function useComplaints(status?: string) {
  return useQuery<Complaint[]>({
    queryKey: hostelKeys.complaints(status),
    queryFn: () => apiGet<Complaint[]>(`/api/hostel/complaints${status ? `?status=${status}` : ""}`),
  });
}

export function useResolveComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPatch<Complaint>(`/api/hostel/complaints/${id}/resolve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: hostelKeys.complaints() }),
  });
}

export function useLeaveRequests(status?: string) {
  return useQuery<LeaveRequest[]>({
    queryKey: hostelKeys.leave(status),
    queryFn: () => apiGet<LeaveRequest[]>(`/api/hostel/leave${status ? `?status=${status}` : ""}`),
  });
}

export function useDecideLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      apiPatch<LeaveRequest>(`/api/hostel/leave/${id}`, { approve }),
    onSuccess: () => qc.invalidateQueries({ queryKey: hostelKeys.leave() }),
  });
}

export function useOccupancy() {
  return useQuery<OccupancyRow[]>({
    queryKey: hostelKeys.occupancy(),
    queryFn: () => apiGet<OccupancyRow[]>(`/api/hostel/occupancy`),
  });
}
