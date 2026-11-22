import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { qiblaBearing } from "@/lib/qibla";

type OrientationEventWithHeading = DeviceOrientationEvent & { webkitCompassHeading?: number };

/**
 * Interactive Qibla compass: the needle turns to the Kaaba as you rotate the phone.
 * Falls back to the plain bearing number when the device has no compass sensor
 * (most laptops and some older phones).
 */
export function QiblaCompass() {
  const [bearing, setBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [status, setStatus] = useState("جاري تحديد موقعك…");
  const [needPerm, setNeedPerm] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("جهازك لا يدعم تحديد الموقع");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBearing(qiblaBearing(pos.coords.latitude, pos.coords.longitude));
        setStatus("لف الموبايل حتى تدب الإبرة على الكعبة");
      },
      () => setStatus("فعّل خدمة الموقع (GPS) لعرض البوصلة"),
      { timeout: 10000, maximumAge: 60000 },
    );

    const onOrient = (e: Event) => {
      const ev = e as OrientationEventWithHeading;
      const h =
        typeof ev.webkitCompassHeading === "number"
          ? ev.webkitCompassHeading // iOS: clockwise from north
          : ev.alpha != null
            ? 360 - ev.alpha // Android absolute: counter-clockwise
            : null;
      if (h != null) setHeading(((h % 360) + 360) % 360);
    };
    window.addEventListener("deviceorientationabsolute", onOrient, true);
    window.addEventListener("deviceorientation", onOrient, true);

    const dio = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof dio.requestPermission === "function") setNeedPerm(true);

    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrient, true);
      window.removeEventListener("deviceorientation", onOrient, true);
    };
  }, []);

  const askPermission = async () => {
    const dio = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      const res = await dio.requestPermission?.();
      if (res !== "granted") setStatus("لم يُسمح باستخدام البوصلة");
      setNeedPerm(false);
    } catch {
      setStatus("تعذّر تفعيل البوصلة");
    }
  };

  const aligned =
    bearing != null && heading != null && Math.abs((((bearing - heading + 540) % 360) - 180)) < 8;
  const needleRot = bearing != null ? (heading != null ? bearing - heading : bearing) : 0;

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <h2 className="flex items-center gap-2 font-bold"><Compass className="size-5 text-anis" /> بوصلة القبلة</h2>
      {needPerm && heading == null && (
        <button
          type="button"
          onClick={() => void askPermission()}
          className="w-full rounded-2xl bg-anis p-3 text-sm font-bold text-primary-foreground"
        >
          تفعيل البوصلة (إذن من المتصفح)
        </button>
      )}
      <div className="mx-auto grid size-52 place-items-center">
        <div
          className="relative size-48 rounded-full border-4 border-anis/30 bg-anis-soft shadow-soft transition-transform"
          style={{ transform: `rotate(${aligned ? 0 : -needleRot}deg)` }}
        >
          {/* north marker */}
          <span className="absolute inset-x-0 top-1 text-center text-xs font-bold text-muted-foreground">شمال</span>
          <span className="absolute inset-x-0 bottom-1 text-center text-xs text-muted-foreground">جنوب</span>
          <span className="absolute inset-y-0 right-1 grid place-items-center text-xs text-muted-foreground">غ</span>
          <span className="absolute inset-y-0 left-1 grid place-items-center text-xs text-muted-foreground">ش</span>
          {/* qibla needle */}
          <div
            className={`absolute inset-0 grid place-items-center transition-transform ${aligned ? "text-success" : "text-anis"}`}
            style={{ transform: `rotate(${needleRot}deg)` }}
          >
            <span className={`absolute top-2 flex size-9 items-center justify-center rounded-full text-lg ${aligned ? "bg-success text-primary-foreground" : "bg-anis text-primary-foreground"}`}>
              🕋
            </span>
            <span className={`h-16 w-1.5 rounded-full ${aligned ? "bg-success" : "bg-anis"}`} />
          </div>
        </div>
      </div>
      <p className={`text-center text-sm font-bold ${aligned ? "text-success" : "text-foreground"}`}>
        {aligned ? "القبلة قدامك — الله أكبر" : status}
      </p>
      {bearing != null && (
        <p className="text-center text-xs text-muted-foreground">
          اتجاه القبلة من الشمال: {toArabicDigits(Math.round(bearing))}°
        </p>
      )}
    </div>
  );
}

function toArabicDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)] ?? d);
}
