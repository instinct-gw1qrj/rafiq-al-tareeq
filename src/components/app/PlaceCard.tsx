import { BedDouble, Coffee, Fuel, MapPin, MoonStar, Phone, UtensilsCrossed, Wrench, type LucideIcon } from "lucide-react";
import { PLACE_KIND_LABELS, type PlaceKind, type RecPlace } from "@/lib/places";
import { cn } from "@/lib/utils";

export const PLACE_ICONS: Record<PlaceKind, LucideIcon> = {
  rest: BedDouble,
  mosque: MoonStar,
  food: UtensilsCrossed,
  cafe: Coffee,
  fuel: Fuel,
  service: Wrench,
};

export function PlaceCard({ p, compact }: { p: RecPlace; compact?: boolean }) {
  const Icon = PLACE_ICONS[p.kind];
  return (
    <li
      className={cn(
        "flex gap-3 rounded-2xl border bg-card p-4 shadow-soft",
        p.sponsored ? "border-gold/50" : "border-border",
        compact && "min-w-[16rem] p-3",
      )}
    >
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", p.sponsored ? "bg-gold-soft text-accent-foreground" : "bg-road-soft text-road")}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="font-bold text-foreground">{p.name}</h3>
          {p.sponsored && <span className="rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-foreground">موصى به</span>}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" /> {PLACE_KIND_LABELS[p.kind]} · {[p.area, p.road].filter(Boolean).join(" — ")}
        </p>
        {p.offer && <p className="mt-1.5 text-sm leading-relaxed text-foreground">{p.offer}</p>}
        {p.phone && (
          <a href={`tel:${p.phone}`} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <Phone className="size-3.5" /> اتصال {p.phone}
          </a>
        )}
      </div>
    </li>
  );
}
