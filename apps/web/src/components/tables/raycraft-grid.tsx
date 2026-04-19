"use client";

import { AgGridReact } from "ag-grid-react";
import type { ComponentProps } from "react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "@/styles/ag-grid-raycraft.css";

type RaycraftGridProps = ComponentProps<typeof AgGridReact> & {
  className?: string;
  height?: string | number;
};

export function RaycraftGrid({ className, height = 360, ...props }: RaycraftGridProps) {
  const style = useMemo(() => ({ width: "100%", height }), [height]);

  return (
    <div className={cn("ag-theme-alpine ag-theme-raycraft rounded border border-border", className)} style={style}>
      <AgGridReact {...props} />
    </div>
  );
}
