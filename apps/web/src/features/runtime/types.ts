export interface ModuleRuntimeStatus {
  moduleKey: string;
  healthy: boolean;
  lastSyncAt: string;
  pendingActions: number;
  note: string;
}
