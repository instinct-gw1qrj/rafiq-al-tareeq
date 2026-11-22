import { useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { maybeShowDailyNotification } from "@/lib/daily";
import { registerOfflineSupport } from "@/lib/pwa-register";
import { pullContent, recordVisit } from "@/lib/cloud-sync";
import { useSettings } from "@/lib/settings";
import { recordOpen, recordSection } from "@/lib/stats";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { Splash } from "./Splash";
import { Onboarding, ThemeSync } from "./Onboarding";

export function AppShell({ children }: { children: ReactNode }) {
  const [s] = useSettings();
  useEffect(() => {
    void registerOfflineSupport();
    void maybeShowDailyNotification();
    void pullContent().catch(() => {});
    try {
      if (!sessionStorage.getItem("rafiq.opened")) {
        sessionStorage.setItem("rafiq.opened", "1");
        recordOpen();
        void recordVisit().catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }, []);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => recordSection(pathname), [pathname]);

  return (
    <div className={`min-h-screen bg-background ${s.batterySaver ? "battery-saver" : ""}`}>
      <ThemeSync />
      <Splash />
      <Onboarding />
      <AppHeader />
      <main className="mx-auto max-w-md px-4 pb-32 pt-5">{children}</main>
      <BottomNav />
      <Toaster position="top-center" dir="rtl" />
    </div>
  );
}
