import type { AdminAction } from "./ai.functions";
import { makePlace, PLACE_KIND_LABELS, type RecPlace } from "./places";
import { uid } from "./storage";
import { VEHICLE_LABELS, type TransportRoute } from "./transport";

/** Applies AI-prepared admin actions to the official route list. Pure. */
export function applyAdminActions(routes: TransportRoute[], actions: AdminAction[], now = new Date()): TransportRoute[] {
  const stamp = now.toISOString();
  let next = routes;
  for (const a of actions) {
    if (a.type === "add_place" || a.type === "update_place" || a.type === "delete_place" || a.type === "set_ads") continue;
    if (a.type === "add_route") {
      next = [
        ...next,
        {
          ...a.route,
          id: `r-${uid()}`,
          stages: a.route.stages.map(({ note, ...s }) => (note ? { ...s, id: uid(), note } : { ...s, id: uid() })),
          updatedAt: stamp,
          source: "official",
        },
      ];
    } else if (a.type === "delete_route") {
      next = next.filter((r) => r.id !== a.routeId);
    } else {
      next = next.map((r) => {
        if (r.id !== a.routeId) return r;
        if (a.type === "add_note") return { ...r, notes: [...r.notes, a.note], updatedAt: stamp };
        return {
          ...r,
          updatedAt: stamp,
          stages: r.stages.map((s) =>
            s.id !== a.stageId ? s : a.type === "set_fare" ? { ...s, fare: a.fare } : { ...s, note: a.note },
          ),
        };
      });
    }
  }
  return next;
}

/** Applies AI-prepared place actions to the recommended places list. Pure. */
export function applyPlaceActions(places: RecPlace[], actions: AdminAction[], now = new Date()): RecPlace[] {
  let next = places;
  for (const a of actions) {
    if (a.type === "add_place") next = [makePlace(a.place, now), ...next];
    else if (a.type === "delete_place") next = next.filter((p) => p.id !== a.placeId);
    else if (a.type === "update_place") {
      const patch = Object.fromEntries(Object.entries(a.patch).filter(([, v]) => v !== undefined)) as Partial<RecPlace>;
      next = next.map((p) => (p.id === a.placeId ? { ...p, ...patch } : p));
    }
  }
  return next;
}

/** The ads on/off switch requested by the last set_ads action, if any. */
export function adsSwitch(actions: AdminAction[]): boolean | undefined {
  let v: boolean | undefined;
  for (const a of actions) if (a.type === "set_ads") v = a.enabled;
  return v;
}

export function describeAction(a: AdminAction, routes: TransportRoute[], places: RecPlace[] = []): string {
  const p = "placeId" in a ? places.find((x) => x.id === a.placeId) : undefined;
  if (a.type === "add_place") return `إضافة ${a.place.sponsored ? "مكان موصى به" : "مكان"}: ${a.place.name} (${PLACE_KIND_LABELS[a.place.kind]}) — ${a.place.offer}`;
  if (a.type === "update_place") return `تعديل ${p?.name ?? "مكان"}`;
  if (a.type === "delete_place") return `حذف ${p?.name ?? "مكان"}`;
  if (a.type === "set_ads") return a.enabled ? "تشغيل الإعلانات" : "إيقاف الإعلانات";
  const r = "routeId" in a ? routes.find((x) => x.id === a.routeId) : undefined;
  const name = r ? `${r.from} ← ${r.to}` : "";
  switch (a.type) {
    case "add_route":
      return `إضافة خط ${a.route.from} ← ${a.route.to} (${a.route.stages.map((s) => VEHICLE_LABELS[s.vehicle]).join(" + ")})`;
    case "set_fare":
      return `تعديل أجرة مرحلة في ${name} إلى ${a.fare} جنيه`;
    case "delete_route":
      return `حذف خط ${name}`;
    case "add_note":
      return `ملاحظة على ${name}: ${a.note}`;
    case "set_stage_note":
      return `إرشاد لمرحلة في ${name}: ${a.note}`;
  }
}
