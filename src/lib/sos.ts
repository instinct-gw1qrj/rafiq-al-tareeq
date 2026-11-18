import { cleanPhone } from "./settings";

export interface Coords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function mapsLink(c: Coords) {
  return `https://maps.google.com/?q=${c.lat.toFixed(6)},${c.lng.toFixed(6)}`;
}

export function buildSosMessage(opts: { situation: string; coords: Coords | null; name?: string }) {
  const lines = [`🚨 استغاثة عاجلة — ${opts.situation}`];
  if (opts.name) lines.push(`من: ${opts.name}`);
  lines.push("أحتاج مساعدة فوراً.");
  if (opts.coords) {
    lines.push(`موقعي الحالي: ${mapsLink(opts.coords)}`);
    if (opts.coords.accuracy) lines.push(`دقة الموقع: حوالي ${Math.round(opts.coords.accuracy)} متر`);
  } else {
    lines.push("تعذّر تحديد الموقع تلقائياً، برجاء الاتصال بي.");
  }
  lines.push("— مُرسلة من تطبيق رفيق الطريق");
  return lines.join("\n");
}

export function smsLink(phone: string, body: string) {
  return `sms:${cleanPhone(phone)}?body=${encodeURIComponent(body)}`;
}

export function whatsappLink(phone: string, body: string) {
  let digits = cleanPhone(phone).replace(/^\+/, "");
  // Egyptian local mobile (01xxxxxxxxx) -> international 201xxxxxxxxx
  if (/^01\d{9}$/.test(digits)) digits = `2${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

export function getCurrentCoords(timeoutMs = 12000): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
    );
  });
}
