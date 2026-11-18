import { Link } from "@tanstack/react-router";
import { Settings, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function AppHeader() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icons/icon-192.png" alt="" className="size-8 rounded-lg" />
          <span className="font-display text-lg font-bold text-foreground">رفيق الطريق</span>
        </Link>
        <div className="flex items-center gap-2">
          {offline && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-medium text-accent-foreground">
              <WifiOff className="size-3.5" /> بدون إنترنت
            </span>
          )}
          <Link
            to="/settings"
            aria-label="الإعدادات"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeProps={{ className: "bg-primary-soft text-primary" }}
          >
            <Settings className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
