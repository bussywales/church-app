import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { ADMIN_PANEL_ROLES } from "@/lib/roles";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole(ADMIN_PANEL_ROLES);

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <nav className="mt-3 flex flex-wrap gap-3 text-sm text-slate-700">
          <Link href="/admin" className="underline">
            Dashboard
          </Link>
          <Link href="/admin/sermons" className="underline">
            Sermons
          </Link>
          <Link href="/admin/events" className="underline">
            Events
          </Link>
          <Link href="/admin/settings" className="underline">
            Settings
          </Link>
        </nav>
      </div>
      {children}
    </section>
  );
}
