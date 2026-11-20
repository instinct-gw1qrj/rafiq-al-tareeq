import { Star } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({ id }: { id: string }) {
  const [favs, toggle] = useFavorites();
  const on = favs.includes(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-label={on ? "إزالة من مشاويري المفضلة" : "إضافة إلى مشاويري المفضلة"}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15"
    >
      <Star className={cn("size-5", on && "fill-current")} />
    </button>
  );
}
