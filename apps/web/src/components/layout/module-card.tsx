import type { ReactNode } from "react";

export function ModuleCard({
  heading,
  description,
  children
}: {
  heading: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <p className="label-track">Feature</p>
      <h3 className="text-2xl">{heading}</h3>
      <p className="mt-2 text-text-secondary">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
