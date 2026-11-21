import { Link } from "@tanstack/react-router";
import { Bot, Store } from "lucide-react";
import { PlaceCard } from "@/components/app/PlaceCard";
import { filterPlaces, usePlaces } from "@/lib/places";

export function HomeLinks() {
  const [places] = usePlaces();
  const featured = filterPlaces(places, { query: "", kind: "all" }).filter((p) => p.sponsored).slice(0, 5);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Link to="/assistant" className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-soft">
          <span className="flex size-10 items-center justify-center rounded-xl bg-anis-soft text-anis"><Bot className="size-5" /></span>
          <span className="text-sm font-bold">اسأل رفيق</span>
        </Link>
        <Link to="/places" className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-soft">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gold-soft text-accent-foreground"><Store className="size-5" /></span>
          <span className="text-sm font-bold">استراحات وأماكن</span>
        </Link>
      </div>
      {featured.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">أماكن موصى بها</h2>
            <Link to="/places" className="text-xs font-semibold text-primary">الكل</Link>
          </div>
          <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">{featured.map((p) => <PlaceCard key={p.id} p={p} compact />)}</ul>
        </section>
      )}
    </div>
  );
}
