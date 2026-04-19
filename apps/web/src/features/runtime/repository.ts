import { apiClient } from "@/lib/api/client";

import { moduleRuntimeStatusMap } from "./mock-data";
import type { ModuleRuntimeStatus } from "./types";

const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export async function getModuleRuntimeStatus(moduleKey: string): Promise<ModuleRuntimeStatus | null> {
  if (USE_MOCK) return moduleRuntimeStatusMap[moduleKey] ?? null;
  return apiClient.get<ModuleRuntimeStatus>(`/modules/${moduleKey}/runtime`);
}
