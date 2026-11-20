import { useStore } from "./storage";

export const FAVORITES_KEY = "rafiq.favorites.v1";

export function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function useFavorites() {
  const [favs, setFavs] = useStore<string[]>(FAVORITES_KEY, []);
  const toggle = (id: string) => setFavs((prev) => toggleId(prev ?? [], id));
  return [favs ?? [], toggle] as const;
}
