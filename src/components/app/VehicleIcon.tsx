import { Bus, BusFront, Car, CarTaxiFront, TrainFront, TramFront, type LucideIcon } from "lucide-react";
import type { Vehicle } from "@/lib/transport";

const ICONS: Record<Vehicle, LucideIcon> = {
  tuktuk: CarTaxiFront,
  service: Car,
  microbus: BusFront,
  bus: Bus,
  train: TrainFront,
  metro: TramFront,
  taxi: CarTaxiFront,
};

export function VehicleIcon({ vehicle, className }: { vehicle: Vehicle; className?: string }) {
  const Icon = ICONS[vehicle];
  return <Icon className={className} />;
}
