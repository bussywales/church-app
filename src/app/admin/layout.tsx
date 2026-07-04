import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { ADMIN_PANEL_ROLES } from "@/lib/roles";
import { BrandMark } from "@/components/brand-mark";
import { StatusBadge } from "@/components/ui/status-badge";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sermons", label: "Sermons" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/people", label: "People" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/health", label: "Health" },
  { href: "/admin/design-system", label: "Design System" },
];

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole(ADMIN_PANEL_ROLES);

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(135deg,rgba(14,36,71,0.96),rgba(35,74,138,0.9))] p-5 text-white shadow-[0_24px_70px_rgba(14,36,71,0.20)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <BrandMark compact className="text-white" />
            <div>
              <StatusBadge tone="gold" className="bg-white/12 text-gold ring-white/20">
                Operations
              </StatusBadge>
              <h1 className="mt-2 font-display text-3xl">Admin Command</h1>
              <p className="mt-1 text-sm text-white/70">
                Manage content, people, giving settings and service readiness.
              </p>
            </div>
          </div>
          <nav
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Admin navigation"
          >
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-white/10 px-3 text-sm font-bold text-white/78 transition hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </section>
  );
}
