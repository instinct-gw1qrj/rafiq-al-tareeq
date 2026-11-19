import type { AdminAction } from "./ai.functions";
import { uid } from "./storage";
import { VEHICLE_LABELS, type TransportRoute } from "./transport";

/** Applies AI-prepared admin actions to the official route list. Pure. */
export function applyAdminActions(routes: TransportRoute[], actions: AdminAction[], now = new Date()): TransportRoute[] {
  const stamp = now.toISOString();
  let next = routes;
  for (const a of actions) {
    if (a.type === "add_route") {
      next = [
        ...next,
        {
          ...a.route,
          id: `r-${uid()}`,
          stages: a.route.stages.map((s) => ({ ...s, id: uid(), note: s.note ?? undefined })),
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

export function describeAction(a: AdminAction, routes: TransportRoute[]): string {
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
