export interface Place { name: string; lat: number; lng: number; kind: "gov" | "landmark" }

export const PLACES: Place[] = [
  { name: "القاهرة - ميدان التحرير", lat: 30.0444, lng: 31.2357, kind: "gov" },
  { name: "الجيزة - الأهرامات", lat: 29.9792, lng: 31.1342, kind: "landmark" },
  { name: "الإسكندرية - محطة الرمل", lat: 31.2001, lng: 29.9187, kind: "gov" },
  { name: "طنطا - مسجد السيد البدوي", lat: 30.7865, lng: 31.0004, kind: "gov" },
  { name: "كفر الشيخ", lat: 31.1107, lng: 30.9388, kind: "gov" },
  { name: "المنصورة", lat: 31.0409, lng: 31.3785, kind: "gov" },
  { name: "الزقازيق", lat: 30.5877, lng: 31.502, kind: "gov" },
  { name: "الزقازيق - كلية الزراعة", lat: 30.58571, lng: 31.52121, kind: "landmark" },
  { name: "الزقازيق - موقف السرفيس الداخلي (المحطة)", lat: 30.58286, lng: 31.50188, kind: "landmark" },
  { name: "بنها", lat: 30.4659, lng: 31.1848, kind: "gov" },
  { name: "شبين الكوم", lat: 30.5503, lng: 31.0106, kind: "gov" },
  { name: "دمنهور", lat: 31.0341, lng: 30.4682, kind: "gov" },
  { name: "دمياط", lat: 31.4165, lng: 31.8133, kind: "gov" },
  { name: "بورسعيد", lat: 31.2653, lng: 32.3019, kind: "gov" },
  { name: "الإسماعيلية", lat: 30.5965, lng: 32.2715, kind: "gov" },
  { name: "السويس", lat: 29.9668, lng: 32.5498, kind: "gov" },
  { name: "الفيوم", lat: 29.3084, lng: 30.8428, kind: "gov" },
  { name: "بني سويف", lat: 29.0661, lng: 31.0994, kind: "gov" },
  { name: "المنيا", lat: 28.0871, lng: 30.7618, kind: "gov" },
  { name: "أسيوط", lat: 27.1783, lng: 31.1859, kind: "gov" },
  { name: "سوهاج", lat: 26.5591, lng: 31.6957, kind: "gov" },
  { name: "قنا", lat: 26.1551, lng: 32.716, kind: "gov" },
  { name: "الأقصر - معبد الكرنك", lat: 25.7188, lng: 32.6573, kind: "landmark" },
  { name: "أسوان - السد العالي", lat: 23.9707, lng: 32.8775, kind: "landmark" },
  { name: "الغردقة", lat: 27.2579, lng: 33.8116, kind: "gov" },
  { name: "شرم الشيخ", lat: 27.9158, lng: 34.33, kind: "landmark" },
  { name: "مرسى مطروح", lat: 31.3543, lng: 27.2373, kind: "gov" },
  { name: "محطة مصر - رمسيس", lat: 30.0626, lng: 31.2467, kind: "landmark" },
  { name: "موقف عبود", lat: 30.0835, lng: 31.2432, kind: "landmark" },
];

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Trip alert stage for a distance to destination. */
export function alertStage(km: number, approachKm = 3, arriveKm = 0.4): "far" | "near" | "arrived" {
  if (km <= arriveKm) return "arrived";
  if (km <= approachKm) return "near";
  return "far";
}
