import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const selectClass =
  "h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium text-foreground/85">{label}</span>
      {children}
    </label>
  );
}
