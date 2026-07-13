import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./client";

// ── Types (mirror EdAI-Backend transport module) ──

export interface BusLocation {
  routeId: string;
  lat: number;
  lng: number;
  speedKmph: number | null;
  heading: number | null;
  recordedAt: string;
}

export interface StudentTransport {
  studentUsn: string;
  routeCode: string;
  routeName: string;
  driverName: string | null;
  driverPhone: string | null;
  vehicleNo: string | null;
  stopName: string | null;
  pickupTime: string | null;
  passStatus: string;
  feeStatus: string;
  validUntil: string | null;
  live: BusLocation | null;
  etaMinutes: number | null;
}

export interface BusRoute {
  id: string;
  code: string;
  name: string;
  driverName: string | null;
  driverPhone: string | null;
  vehicleNo: string | null;
  capacity: number;
  allocated: number;
}

export interface BusStop {
  id: string;
  name: string;
  seq: number;
  pickupTime: string | null;
  lat: number | null;
  lng: number | null;
}

export const transportKeys = {
  student: (usn: string) => ["transport", "student", usn] as const,
  routes: () => ["transport", "routes"] as const,
  stops: (routeId: string) => ["transport", "stops", routeId] as const,
  location: (routeId: string) => ["transport", "location", routeId] as const,
};

export function useStudentTransport(usn: string) {
  return useQuery<StudentTransport | null>({
    queryKey: transportKeys.student(usn),
    queryFn: () => apiGet<StudentTransport | null>(`/api/transport/student/${usn}`),
    enabled: !!usn,
  });
}

export function useBusRoutes() {
  return useQuery<BusRoute[]>({
    queryKey: transportKeys.routes(),
    queryFn: () => apiGet<BusRoute[]>(`/api/transport/routes`),
  });
}

export function useRouteStops(routeId: string) {
  return useQuery<BusStop[]>({
    queryKey: transportKeys.stops(routeId),
    queryFn: () => apiGet<BusStop[]>(`/api/transport/routes/${routeId}/stops`),
    enabled: !!routeId,
  });
}

/**
 * Latest bus location. Poll as a fallback; the live push comes over the
 * `bus:location` Socket.IO event via RealtimeProvider.
 */
export function useBusLocation(routeId: string, pollMs = 15000) {
  return useQuery<BusLocation | null>({
    queryKey: transportKeys.location(routeId),
    queryFn: () => apiGet<BusLocation | null>(`/api/transport/routes/${routeId}/location`),
    enabled: !!routeId,
    refetchInterval: pollMs,
  });
}
