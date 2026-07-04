import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { CTAButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/sermons", label: "Sermons" },
  { href: "/events", label: "Events" },
  { href: "/new-here", label: "New Here" },
];

const memberLinks = [
  { href: "/my/registrations", label: "My Registrations" },
  { href: "/account", label: "Account" },
  { href: "/admin", label: "Admin" },
];

function NavLink({
  href,
  label,
  subtle = false,
}: {
  href: string;
  label: string;
  subtle?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 items-center rounded-full px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ivory",
        subtle
          ? "text-muted-foreground hover:bg-white/70 hover:text-primary"
          : "text-primary hover:bg-white/75 hover:text-royal",
      )}
    >
      {label}
    </Link>
  );
}

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-ivory/86 shadow-[0_12px_35px_rgba(14,36,71,0.08)] backdrop-blur-xl">
      <nav
        className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Primary navigation"
      >
        <div className="flex items-center justify-between gap-3">
          <BrandMark />
          <div className="flex shrink-0 items-center gap-2">
            <CTAButton href="/give" variant="gold" size="sm" className="hidden sm:inline-flex">
              Give
            </CTAButton>
            <Link
              href="/admin"
              className="hidden rounded-full border border-border bg-white/65 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ivory md:inline-flex"
            >
              Admin
            </Link>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {primaryLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
          <CTAButton href="/give" variant="gold" size="sm" className="sm:hidden">
            Give
          </CTAButton>
          <span className="mx-1 hidden h-10 w-px shrink-0 bg-border sm:block" />
          {memberLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} subtle />
          ))}
        </div>
      </nav>
    </header>
  );
}
