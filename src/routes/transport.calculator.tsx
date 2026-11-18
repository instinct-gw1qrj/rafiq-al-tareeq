import { createFileRoute } from "@tanstack/react-router";
import { Calculator, Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { VehicleIcon } from "@/components/app/VehicleIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatFare, toArabicDigits } from "@/lib/arabic";
import { pageHead } from "@/lib/seo";
import { uid } from "@/lib/storage";
import { calcTotal, VEHICLE_LABELS, type Vehicle } from "@/lib/transport";
import { useCalc } from "@/lib/use-transport";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/transport/calculator")({
  head: () =>
    pageHead(
      "حاسبة تكلفة المشوار",
      "احسب إجمالي تكلفة مشوارك متعدد المراحل: مواصلة + توكتوك + سرفيس، للفرد ولكل المرافقين.",
    ),
  component: CalculatorPage,
});

const VEHICLES: Vehicle[] = ["tuktuk", "service", "microbus", "bus", "train", "metro", "taxi"];

function CalculatorPage() {
  const [calc, setCalc] = useCalc();
  const [vehicle, setVehicle] = useState<Vehicle>("microbus");
  const [fare, setFare] = useState("");
  const [label, setLabel] = useState("");
  const { perPerson, total } = calcTotal(calc);

  const addLeg = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(fare.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))));
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("اكتب أجرة صحيحة");
      return;
    }
    setCalc((p) => ({
      ...p,
      legs: [...p.legs, { id: uid(), vehicle, fare: value, label: label.trim() || VEHICLE_LABELS[vehicle] }],
    }));
    setFare("");
    setLabel("");
  };

  const setPassengers = (n: number) => setCalc((p) => ({ ...p, passengers: Math.min(20, Math.max(1, n)) }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="حاسبة المشوار"
        subtitle="اجمع كل مراحل رحلتك"
        icon={Calculator}
        tone="road"
        back={{ to: "/transport", label: "دليل الطريق" }}
      />

      <section className="bg-hero rounded-3xl p-5 text-primary-foreground shadow-soft">
        <p className="text-sm text-primary-foreground/80">الإجمالي</p>
        <p className="text-4xl font-bold text-gold" aria-live="polite">
          {formatFare(total)}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-primary-foreground/20 pt-3 text-sm">
          <span>
            للفرد: <strong>{formatFare(perPerson)}</strong> · {toArabicDigits(calc.legs.length)} مرحلة
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="تقليل عدد الأفراد"
              onClick={() => setPassengers(calc.passengers - 1)}
              className="flex size-8 items-center justify-center rounded-full bg-primary-foreground/15"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-14 text-center">{toArabicDigits(calc.passengers)} فرد</span>
            <button
              type="button"
              aria-label="زيادة عدد الأفراد"
              onClick={() => setPassengers(calc.passengers + 1)}
              className="flex size-8 items-center justify-center rounded-full bg-primary-foreground/15"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <form onSubmit={addLeg} className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-soft">
        <h2 className="font-bold">أضف مرحلة</h2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {VEHICLES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVehicle(v)}
              className={cn(
                "flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-2 text-xs font-medium",
                vehicle === v ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground",
              )}
            >
              <VehicleIcon vehicle={v} className="size-5" />
              {VEHICLE_LABELS[v]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="وصف (اختياري): من المحطة للجامعة" className="h-11" />
          <Input
            value={fare}
            onChange={(e) => setFare(e.target.value)}
            placeholder="الأجرة"
            inputMode="decimal"
            className="h-11 text-center"
            aria-label="الأجرة بالجنيه"
          />
        </div>
        <Button type="submit" size="xl" className="w-full">
          <Plus /> إضافة للحساب
        </Button>
      </form>

      {calc.legs.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">مراحل المشوار</h2>
            <Button variant="ghost" size="sm" onClick={() => setCalc((p) => ({ ...p, legs: [] }))}>
              <RotateCcw /> مسح الكل
            </Button>
          </div>
          <ol className="space-y-2">
            {calc.legs.map((l, i) => (
              <li key={l.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-road-soft text-road">
                  <VehicleIcon vehicle={l.vehicle} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {toArabicDigits(i + 1)}. {l.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{VEHICLE_LABELS[l.vehicle]}</p>
                </div>
                <span className="font-bold text-primary">{formatFare(l.fare)}</span>
                <button
                  type="button"
                  aria-label="حذف المرحلة"
                  onClick={() => setCalc((p) => ({ ...p, legs: p.legs.filter((x) => x.id !== l.id) }))}
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-sos-soft hover:text-sos"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          لم تُضف أي مرحلة بعد. أضف مراحل يدوياً أو من صفحة أي خط بزر «أضف للحاسبة».
        </p>
      )}
    </div>
  );
}
