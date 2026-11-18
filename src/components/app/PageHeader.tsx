import { Link } from "@tanstack/react-router";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { TONE, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  tone = "road",
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  tone?: Tone;
  back?: { to: string; label: string };
  action?: ReactNode;
}) {
  return (
    <div className="animate-rise mb-5 space-y-3">
      {back && (
        <Link
          to={back.to}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", TONE[tone].soft, TONE[tone].text)}>
            <Icon className="size-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
