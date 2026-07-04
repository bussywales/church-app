import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CTAButton } from "@/components/ui/button";

type SectionProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
};

export function Section({
  eyebrow,
  title,
  description,
  children,
  className,
  actions,
}: SectionProps) {
  return (
    <section className={cn("space-y-6 py-8 sm:py-10", className)}>
      {title || eyebrow || description || actions ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            {eyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-deep">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: Omit<SectionProps, "children" | "className">) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(135deg,rgba(14,36,71,0.96),rgba(35,74,138,0.9))] p-6 text-white shadow-[0_26px_70px_rgba(14,36,71,0.24)] sm:p-8">
      <div className="absolute -right-20 -top-20 size-56 rounded-full bg-gold/25 blur-3xl" />
      <div className="relative max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">{eyebrow}</p>
        ) : null}
        {title ? (
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{title}</h1>
        ) : null}
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/78">{description}</p>
        ) : null}
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}

export function HeroSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("relative overflow-hidden rounded-[2.25rem]", className)}>
      {children}
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,var(--color-primary),var(--color-royal))] p-6 text-white shadow-[0_26px_70px_rgba(14,36,71,0.24)] sm:p-8">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
            Take your next step
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">There is room for you here.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">
            Join us for worship, connect with a small group, or take a simple next step into church
            family life.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <CTAButton href="/new-here" variant="gold">
            I&apos;m New
          </CTAButton>
          <CTAButton href="/events" variant="secondary">
            See Events
          </CTAButton>
        </div>
      </div>
    </section>
  );
}
