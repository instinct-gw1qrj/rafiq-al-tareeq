import { createFileRoute, Link } from "@tanstack/react-router";
import { BatteryCharging, Bell, ChevronLeft, Phone, Settings as SettingsIcon, ShieldCheck, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/app/Field";
import { PageHeader } from "@/components/app/PageHeader";
import { Signature } from "@/components/app/Signature";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { testAlarm } from "@/lib/alarm";
import { pageHead } from "@/lib/seo";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/settings")({
  head: () => pageHead("الإعدادات", "رقم الطوارئ الشخصي، الإشعارات اليومية، ولوحة تحكم المسؤول."),
  component: SettingsPage,
});

function SettingsPage() {
  const [s, update] = useSettings();
  const toggleNotifications = async (on: boolean) => {
    if (on && "Notification" in window && Notification.permission !== "granted") {
      const res = await Notification.requestPermission().catch(() => "denied" as const);
      if (res !== "granted") {
        toast.error("لم يُسمح بالإشعارات من المتصفح");
        return;
      }
    }
    update({ notifications: on });
  };
  return (
    <div className="space-y-5">
      <PageHeader title="الإعدادات" icon={SettingsIcon} tone="road" />
      <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-bold"><Phone className="size-5 text-sos" /> إعدادات الطوارئ</h2>
        <Field label="اسمك (يظهر في رسالة الاستغاثة)">
          <Input value={s.userName} onChange={(e) => update({ userName: e.target.value })} className="h-11" />
        </Field>
        <Field label="اسم صاحب رقم الطوارئ">
          <Input value={s.emergencyName} onChange={(e) => update({ emergencyName: e.target.value })} className="h-11" placeholder="مثلاً: أخي محمد" />
        </Field>
        <Field label="رقم الطوارئ الشخصي">
          <Input value={s.emergencyNumber} onChange={(e) => update({ emergencyNumber: e.target.value })} inputMode="tel" dir="ltr" className="h-11 text-left" placeholder="01xxxxxxxxx" />
        </Field>
      </section>
      <section className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div>
          <h2 className="flex items-center gap-2 font-bold"><Bell className="size-5 text-anis" /> إشعارات يومية هادئة</h2>
          <p className="text-xs text-muted-foreground">آية ودعاء قصير مرة كل يوم عند فتح التطبيق</p>
        </div>
        <Switch checked={s.notifications} onCheckedChange={(v) => void toggleNotifications(v)} aria-label="الإشعارات اليومية" />
      </section>
      <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-bold"><BatteryCharging className="size-5 text-success" /> وضع توفير البطارية</h2>
            <p className="text-xs text-muted-foreground">خلفية داكنة مريحة للشاشة — الرحلة تكمل وقت أطول</p>
          </div>
          <Switch checked={s.batterySaver} onCheckedChange={(v) => update({ batterySaver: v })} aria-label="وضع توفير البطارية" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">تنبيه البطارية المنخفضة</p>
            <p className="text-xs text-muted-foreground">ينبهك لما البطارية توصل ٢٠٪ وأنت في المتابعة</p>
          </div>
          <Switch checked={s.batteryWarn} onCheckedChange={(v) => update({ batteryWarn: v })} aria-label="تنبيه البطارية المنخفضة" />
        </div>
        <Button variant="outline" className="w-full" onClick={testAlarm}><Volume2 /> جرّب نغمة المنبه القوية</Button>
      </section>
      <Link to="/admin" className="flex items-center gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <ShieldCheck className="size-6 text-gold" />
        <span className="flex-1 font-bold">لوحة تحكم المسؤول</span>
        <ChevronLeft className="size-5 text-muted-foreground" />
      </Link>
      <section className="rounded-3xl bg-hero p-6 text-center text-primary-foreground shadow-soft">
        <img src="/icons/icon-192.png" alt="" className="mx-auto mb-3 size-16 rounded-2xl" />
        <p className="font-display text-xl font-bold">رفيق الطريق</p>
        <p className="text-sm text-primary-foreground/80">يعمل بدون إنترنت — بياناتك محفوظة على جهازك</p>
        <Signature tone="light" className="mt-4 text-base" />
      </section>
    </div>
  );
}
