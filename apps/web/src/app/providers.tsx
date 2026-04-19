"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";

import { queryClient } from "@/lib/query-client";
import { RealtimeProvider } from "@/lib/realtime/realtime-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>{children}</RealtimeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
