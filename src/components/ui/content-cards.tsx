import Link from "next/link";
import type { ReactNode } from "react";
import { PremiumCard } from "@/components/ui/card";
import { CTAButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export function FeatureCard({
  title,
  description,
  href,
  label = "Explore",
}: {
  title: string;
  description: string;
  href: string;
  label?: string;
}) {
  return (
    <PremiumCard className="group h-full transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(14,36,71,0.14)]">
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-full text-sm font-bold text-royal underline-offset-4 transition hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ivory"
      >
        {label}
      </Link>
    </PremiumCard>
  );
}

export function SermonCard({
  title,
  href,
  speaker,
  meta,
  tags,
}: {
  title: string;
  href: string;
  speaker?: string | null;
  meta?: string | null;
  tags?: string[] | null;
}) {
  return (
    <PremiumCard className="h-full">
      <StatusBadge tone="gold">Latest message</StatusBadge>
      <h3 className="mt-4 font-display text-3xl leading-tight text-ink">
        <Link
          href={href}
          className="rounded-lg hover:text-royal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ivory"
        >
          {title}
        </Link>
      </h3>
      <p className="mt-3 text-sm text-muted-foreground">
        {speaker || "Covenant Ways Church"}
        {meta ? ` · ${meta}` : ""}
      </p>
      {tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-royal/8 px-3 py-1 text-xs font-semibold text-royal"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-6">
        <CTAButton href={href} variant="outline" size="sm">
          Watch message
        </CTAButton>
      </div>
    </PremiumCard>
  );
}

export function EventCard({
  title,
  href,
  startsAt,
  location,
  description,
}: {
  title: string;
  href: string;
  startsAt: string;
  location?: string | null;
  description?: string | null;
}) {
  return (
    <PremiumCard className="h-full">
      <StatusBadge tone="blue">Upcoming</StatusBadge>
      <h3 className="mt-4 font-display text-2xl leading-tight text-ink">
        <Link
          href={href}
          className="rounded-lg hover:text-royal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ivory"
        >
          {title}
        </Link>
      </h3>
      <p className="mt-3 text-sm font-semibold text-primary">{startsAt}</p>
      {location ? <p className="mt-1 text-sm text-muted-foreground">{location}</p> : null}
      {description ? (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
    </PremiumCard>
  );
}

export function FundCard({
  title,
  description,
  amount,
}: {
  title: string;
  description: string;
  amount?: string;
}) {
  return (
    <PremiumCard className="h-full">
      <StatusBadge tone="success">Giving</StatusBadge>
      <h3 className="mt-4 font-display text-2xl text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      {amount ? <p className="mt-5 text-2xl font-extrabold text-primary">{amount}</p> : null}
    </PremiumCard>
  );
}

export function StatCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/40 bg-white/16 p-4 text-white shadow-inner backdrop-blur">
      <p className="font-display text-3xl">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/72">{label}</p>
      {children ? <div className="mt-3 text-sm text-white/76">{children}</div> : null}
    </div>
  );
}
