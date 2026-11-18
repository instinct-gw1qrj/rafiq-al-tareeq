export type Tone = "road" | "anis" | "med" | "sos" | "gold" | "success";

export const TONE: Record<Tone, { soft: string; text: string; solid: string; border: string }> = {
  road: { soft: "bg-road-soft", text: "text-road", solid: "bg-road text-primary-foreground", border: "border-road/30" },
  anis: { soft: "bg-anis-soft", text: "text-anis", solid: "bg-anis text-primary-foreground", border: "border-anis/30" },
  med: { soft: "bg-med-soft", text: "text-med", solid: "bg-med text-primary-foreground", border: "border-med/30" },
  sos: { soft: "bg-sos-soft", text: "text-sos", solid: "bg-sos text-sos-foreground", border: "border-sos/30" },
  gold: { soft: "bg-gold-soft", text: "text-accent-foreground", solid: "bg-gold text-foreground", border: "border-gold/40" },
  success: { soft: "bg-success-soft", text: "text-success", solid: "bg-success text-primary-foreground", border: "border-success/30" },
};
