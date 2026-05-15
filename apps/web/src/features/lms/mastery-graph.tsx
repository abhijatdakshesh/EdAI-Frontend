"use client";

import { useMemo } from "react";
import type { LmsMastery } from "@/lib/api/lms";

/**
 * Lightweight SVG mastery graph. Each topic is a circle; size = constant,
 * fill = green proportional to masteryScore (0..1). No external dep — v2
 * can swap for reaflow / D3 force layout.
 */
export function MasteryGraph({ mastery }: { mastery: LmsMastery[] }) {
  const nodes = useMemo(() => {
    if (mastery.length === 0) {
      return [
        { topic: "scheduling", masteryScore: 0 },
        { topic: "fcfs", masteryScore: 0 },
        { topic: "sjf", masteryScore: 0 },
        { topic: "round-robin", masteryScore: 0 },
      ] as Array<{ topic: string; masteryScore: number }>;
    }
    return mastery;
  }, [mastery]);

  const cols = 2;
  const cellW = 130;
  const cellH = 80;
  const positions = nodes.map((_, i) => ({
    x: 20 + (i % cols) * cellW,
    y: 30 + Math.floor(i / cols) * cellH,
  }));

  const masteredCount = nodes.filter((n) => n.masteryScore >= 0.66).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 text-xs text-text-muted">
        <span className="rounded-full px-2 py-0.5 bg-[#EBF3EE] text-[#3D6B4F] font-medium">
          {masteredCount} / {nodes.length} mastered
        </span>
      </div>
      <svg viewBox={`0 0 280 ${Math.max(180, 30 + Math.ceil(nodes.length / cols) * cellH + 40)}`} className="w-full">
        {/* Edges (linear chain, prereq) */}
        {positions.slice(1).map((p, i) => {
          const prev = positions[i]!;
          return (
            <line
              key={i}
              x1={prev.x + 40}
              y1={prev.y}
              x2={p.x + 40}
              y2={p.y}
              stroke="#D8D4CC"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          );
        })}
        {/* Nodes */}
        {nodes.map((n, i) => {
          const pos = positions[i]!;
          const intensity = Math.max(0, Math.min(1, n.masteryScore));
          // Interpolate cream→green as mastery grows
          const fill = intensity >= 0.66
            ? "#EBF3EE"
            : intensity >= 0.34
            ? "#F5EDDB"
            : "#F0EEEB";
          const stroke = intensity >= 0.66 ? "#3D6B4F" : "#A89F92";
          return (
            <g key={n.topic}>
              <circle cx={pos.x + 40} cy={pos.y} r={22} fill={fill} stroke={stroke} strokeWidth={1.5} />
              <text
                x={pos.x + 40}
                y={pos.y + 4}
                textAnchor="middle"
                fontSize={10}
                fill="#1C1810"
                style={{ pointerEvents: "none" }}
              >
                {Math.round(n.masteryScore * 100)}%
              </text>
              <text
                x={pos.x + 40}
                y={pos.y + 38}
                textAnchor="middle"
                fontSize={10}
                fill="#6B6358"
                style={{ pointerEvents: "none" }}
              >
                {n.topic.length > 14 ? n.topic.slice(0, 13) + "…" : n.topic}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
