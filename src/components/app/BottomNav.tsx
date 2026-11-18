import { Link, useRouterState } from "@tanstack/react-router";
import { BusFront, HeartPulse, House, MoonStar, Siren } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "الرئيسية", icon: House, match: (p: string) => p === "/" },
  { to: "/transport", label: "دليل الطريق", icon: BusFront, match: (p: string) => p.startsWith("/transport") },
  { to: "/anis", label: "أنيس الطريق", icon: MoonStar, match: (p: string) => p.startsWith("/anis") },
  { to: "/medical", label: "إسعافات", icon: HeartPulse, match: (p: string) => p.startsWith("/medical") },
  { to: "/sos", label: "طوارئ", icon: Siren, match: (p: string) => p.startsWith("/sos") },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="القائمة الرئيسية"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-float backdrop-blur"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-1 pt-1.5">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const isSos = item.to === "/sos";
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                  active ? (isSos ? "text-sos" : "text-primary") : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    active && (isSos ? "bg-sos-soft" : "bg-primary-soft"),
                    !active && isSos && "text-sos",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.9} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
