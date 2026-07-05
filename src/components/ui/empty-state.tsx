import type { ReactNode } from "react";
import { PremiumCard } from "@/components/ui/card";
import { CTAButton } from "@/components/ui/button";

export function EmptyState({
  eyebrow = "Nothing here yet",
  title,
  description,
  actionHref,
  actionLabel,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <PremiumCard className="text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">{eyebrow}</p>
      <h3 className="mt-3 font-display text-3xl text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {actionHref && actionLabel ? (
        <div className="mt-5">
          <CTAButton href={actionHref} variant="secondary">
            {actionLabel}
          </CTAButton>
        </div>
      ) : null}
    </PremiumCard>
  );
}

export function EmptyStateInline({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-white/55 p-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
