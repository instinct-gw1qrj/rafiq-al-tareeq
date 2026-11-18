import { cn } from "@/lib/utils";

export function Signature({ className, tone = "default" }: { className?: string; tone?: "default" | "light" }) {
  return (
    <p
      className={cn(
        "font-display text-sm tracking-wide",
        tone === "light" ? "text-primary-foreground/90" : "text-muted-foreground",
        className,
      )}
    >
      تصميم{" "}
      <span className={cn("font-semibold", tone === "light" ? "text-gold" : "text-primary")}>
        دكتورة شروق محمد الباز
      </span>
    </p>
  );
}
