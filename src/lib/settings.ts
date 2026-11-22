import { useStore } from "./storage";

export const DEFAULT_ADMIN_PASSWORD = "1234";

export interface Settings {
  userName: string;
  emergencyName: string;
  emergencyNumber: string;
  notifications: boolean;
  lastNotified: string;
  adminPassword: string;
  phone: string;
  emergencyRelation: string;
  governorate: string;
  registered: boolean;
  theme: "light" | "dark";
  batterySaver: boolean;
  batteryWarn: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  userName: "",
  emergencyName: "",
  emergencyNumber: "",
  notifications: false,
  lastNotified: "",
  adminPassword: DEFAULT_ADMIN_PASSWORD,
  phone: "",
  emergencyRelation: "",
  governorate: "",
  registered: false,
  theme: "light",
  batterySaver: false,
  batteryWarn: true,
};

export const SETTINGS_KEY = "rafiq.settings.v1";

export function useSettings() {
  const [stored, setStored] = useStore<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const settings = { ...DEFAULT_SETTINGS, ...stored };
  const update = (patch: Partial<Settings>) =>
    setStored((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...patch }));
  return [settings, update] as const;
}

export function checkAdminPassword(input: string, settings: Pick<Settings, "adminPassword">) {
  const expected = settings.adminPassword || DEFAULT_ADMIN_PASSWORD;
  return input.trim() === expected;
}

/** Keeps digits and a leading + so the number works in tel:/sms: links. */
export function cleanPhone(input: string) {
  const ascii = input.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const trimmed = ascii.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/[^0-9]/g, "");
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
