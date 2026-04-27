"use client";

import dynamic from "next/dynamic";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

const RealtimeProvider = dynamic(
  () => import("@/lib/realtime/realtime-context").then((m) => m.RealtimeProvider),
  { ssr: false, loading: () => null },
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider>{children}</RealtimeProvider>
    </QueryClientProvider>
  );
}
