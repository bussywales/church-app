import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/sermons", label: "Sermons" },
  { href: "/events", label: "Events" },
  { href: "/give", label: "Give" },
  { href: "/my/registrations", label: "My Registrations" },
  { href: "/account", label: "Account" },
  { href: "/admin", label: "Admin" },
];

export function SiteNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-4 text-sm text-slate-700">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
