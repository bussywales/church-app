import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type StatusTone = "gold" | "blue" | "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  gold: "bg-gold/18 text-primary ring-gold/35",
  blue: "bg-royal/10 text-royal ring-royal/20",
  success: "bg-success/12 text-success ring-success/20",
  warning: "bg-warning/14 text-warning ring-warning/25",
  danger: "bg-danger/12 text-danger ring-danger/20",
  neutral: "bg-muted/14 text-muted-foreground ring-border",
};

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusTone;
};

export function StatusBadge({ tone = "neutral", className, ...props }: StatusBadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.13em] ring-1",
        toneClasses[tone],
        className,
      )}
    />
  );
}
