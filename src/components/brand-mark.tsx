import Link from "next/link";
import { cn } from "@/lib/cn";

type BrandMarkProps = {
  compact?: boolean;
  href?: string;
  className?: string;
};

export function BrandMark({ compact = false, href = "/", className }: BrandMarkProps) {
  const mark = (
    <span
      className={cn("inline-flex items-center gap-3 text-left", className)}
      aria-label="Covenant Ways Church"
    >
      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-royal)_50%,var(--color-gold))] shadow-[0_14px_34px_rgba(14,36,71,0.24)] ring-1 ring-white/60">
        <span className="absolute inset-1 rounded-[1rem] border border-white/25" />
        <span className="font-display text-[1.35rem] leading-none text-white drop-shadow-sm">
          C
        </span>
      </span>
      {compact ? null : (
        <span className="grid leading-tight">
          <span className="font-display text-xl text-ink">Covenant Ways</span>
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-royal">
            Church
          </span>
        </span>
      )}
    </span>
  );

  return (
    <Link
      href={href}
      className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ivory"
    >
      {mark}
    </Link>
  );
}
