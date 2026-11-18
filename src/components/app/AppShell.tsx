import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { maybeShowDailyNotification } from "@/lib/daily";
import { registerOfflineSupport } from "@/lib/pwa-register";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { Splash } from "./Splash";

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    void registerOfflineSupport();
    void maybeShowDailyNotification();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Splash />
      <AppHeader />
      <main className="mx-auto max-w-md px-4 pb-32 pt-5">{children}</main>
      <BottomNav />
      <Toaster position="top-center" dir="rtl" />
    </div>
  );
}
