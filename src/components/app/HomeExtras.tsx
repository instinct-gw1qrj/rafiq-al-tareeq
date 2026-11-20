import { Link } from "@tanstack/react-router";
import { Backpack, ChevronLeft, Navigation, Star } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { useStore } from "@/lib/storage";
import { useRoutes } from "@/lib/use-transport";
import { cn } from "@/lib/utils";

const CHECKLIST = [
  "البطاقة الشخصية والكارنيه",
  "شاحن الهاتف والباور بانك",
  "المحفظة وفكة المواصلات",
  "أدوية السفر الشخصية",
  "المفاتيح",
];

export function TripCard() {
  return (
    <Link to="/trip" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Navigation className="size-5" />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-foreground">ابدأ رحلتي</p>
        <p className="text-xs text-muted-foreground">منبه الوجهة، رادار الأماكن، و«وصلت بالسلامة»</p>
      </div>
      <ChevronLeft className="size-5 text-muted-foreground" />
    </Link>
  );
}

export function FavoritesSection() {
  const [favs] = useFavorites();
  const [routes] = useRoutes();
  const list = routes.filter((r) => favs.includes(r.id));
  if (list.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 font-bold text-foreground">
        <Star className="size-5 text-primary" /> مشاويري المفضلة
      </h2>
      {list.map((r) => (
        <Link
          key={r.id}
          to="/transport/$routeId"
          params={{ routeId: r.id }}
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-soft"
        >
          <span className="font-medium text-foreground">{r.from} ← {r.to}</span>
          <ChevronLeft className="size-4 text-muted-foreground" />
        </Link>
      ))}
    </section>
  );
}

export function Checklist() {
  const [checked, setChecked] = useStore<string[]>("rafiq.checklist.v1", []);
  const done = checked ?? [];
  return (
    <details className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <summary className="flex cursor-pointer items-center gap-2 font-semibold text-foreground">
        <Backpack className="size-5 text-primary" /> شنطة المسافر ({done.length}/{CHECKLIST.length})
      </summary>
      <ul className="mt-3 space-y-2">
        {CHECKLIST.map((item) => {
          const on = done.includes(item);
          return (
            <li key={item}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => setChecked((p) => (on ? (p ?? []).filter((x) => x !== item) : [...(p ?? []), item]))}
                  className="size-4 accent-primary"
                />
                <span className={cn(on && "text-muted-foreground line-through")}>{item}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {done.length > 0 && (
        <button type="button" onClick={() => setChecked([])} className="mt-3 text-xs text-primary">
          تفريغ القائمة لرحلة جديدة
        </button>
      )}
    </details>
  );
}
