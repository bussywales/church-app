import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "sm" | "md" | "lg" | "none";
};

const paddingClasses = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6 sm:p-7",
  none: "p-0",
};

export function Card({ className, padding = "md", ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-3xl border border-border bg-card text-card-foreground shadow-[0_18px_45px_rgba(14,36,71,0.08)]",
        paddingClasses[padding],
        className,
      )}
    />
  );
}

export function PremiumCard({
  className,
  children,
  ...props
}: CardProps & { children: ReactNode }) {
  return (
    <Card
      {...props}
      className={cn(
        "relative overflow-hidden bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(255,248,232,0.82))] ring-1 ring-white/70 before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gold/70 before:to-transparent",
        className,
      )}
    >
      {children}
    </Card>
  );
}
