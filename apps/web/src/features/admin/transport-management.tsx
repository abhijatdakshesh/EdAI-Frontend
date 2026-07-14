"use client";

import { useState } from "react";
import { useBusRoutes, useRouteStops, useBusLocation } from "@/lib/api/transport";

export default function TransportManagement() {
  const { data: routes = [] } = useBusRoutes();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: stops = [] } = useRouteStops(selected ?? "");
  const { data: live } = useBusLocation(selected ?? "");

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      {/* Routes list */}
      <section className="rounded border border-border bg-surface p-5">
        <p className="label-track mb-3">Bus Routes ({routes.length})</p>
        <div className="grid gap-2">
          {routes.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              className={`rounded p-3 text-left text-sm transition ${
                selected === r.id ? "bg-[#3D6B4F] text-white" : "bg-cream-100 hover:bg-border"
              }`}
            >
              <p className="font-medium">{r.code} — {r.name}</p>
              <p className={selected === r.id ? "text-white/80" : "text-text-muted"}>
                {r.vehicleNo ?? "—"} · {r.allocated}/{r.capacity} seats · {r.driverName ?? "no driver"}
              </p>
            </button>
          ))}
          {routes.length === 0 && <p className="text-sm text-text-muted">No routes configured.</p>}
        </div>
      </section>

      {/* Route detail — stops + live location */}
      <section className="rounded border border-border bg-surface p-5">
        {!selected ? (
          <p className="text-sm text-text-muted">Select a route to view stops and live tracking.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="label-track">Live Tracking</p>
              {live ? (
                <span className="inline-flex items-center gap-1 text-xs text-[#3D6B4F]">
                  <span className="h-2 w-2 rounded-full bg-[#3D6B4F] animate-pulse" /> LIVE ·{" "}
                  {live.speedKmph != null ? `${live.speedKmph} km/h` : "—"}
                </span>
              ) : (
                <span className="text-xs text-text-muted">No signal</span>
              )}
            </div>
            {live && (
              <div className="mb-4 rounded bg-cream-100 p-3 text-sm">
                <p className="text-text-muted text-xs">Last position</p>
                <p className="font-mono">{live.lat.toFixed(5)}, {live.lng.toFixed(5)}</p>
                <p className="text-xs text-text-muted">at {new Date(live.recordedAt).toLocaleTimeString()}</p>
              </div>
            )}
            <p className="label-track mb-2">Stops</p>
            <ol className="grid gap-2">
              {stops.map((s) => (
                <li key={s.id} className="flex justify-between rounded bg-cream-100 p-2 text-sm">
                  <span className="font-medium">{s.seq}. {s.name}</span>
                  <span className="text-text-muted">{s.pickupTime ?? "—"}</span>
                </li>
              ))}
              {stops.length === 0 && <p className="text-sm text-text-muted">No stops configured.</p>}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}
