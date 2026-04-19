export interface KpiCard {
  label: string;
  value: string | number;
  unit?: string;
  trend: "up" | "down" | "flat";
  trendValue: string;
  status: "healthy" | "warning" | "critical";
}

export interface CampusHealthRow {
  campusId: string;
  campusName: string;
  attendanceRate: number;
  feeCollectionRate: number;
  atRiskStudents: number;
  openGrievances: number;
  healthScore: number;
}

export interface RecentAlert {
  alertId: string;
  kind: "attendance" | "finance" | "compliance" | "behavior" | "placement";
  message: string;
  severity: "info" | "warning" | "critical";
  occurredAt: string;
}

export interface DashboardResponse {
  generatedAt: string;
  kpis: KpiCard[];
  campusHealth: CampusHealthRow[];
  recentAlerts: RecentAlert[];
}
