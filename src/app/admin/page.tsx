import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function AdminPage() {
  const supabase = await createClient();

  const [sermonsResult, eventsResult, leadsResult] = await Promise.all([
    supabase.from("sermons").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "NEW"),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <h2 className="text-lg font-semibold">Sermons</h2>
        <p className="mt-1 text-sm text-slate-600">Total sermons: {sermonsResult.count ?? 0}</p>
        <Link href="/admin/sermons" className="mt-3 inline-block text-sm underline">
          Manage sermons
        </Link>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Events</h2>
        <p className="mt-1 text-sm text-slate-600">Total events: {eventsResult.count ?? 0}</p>
        <Link href="/admin/events" className="mt-3 inline-block text-sm underline">
          Manage events
        </Link>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Giving settings</h2>
        <p className="mt-1 text-sm text-slate-600">Configure Gift Aid and donation options.</p>
        <Link href="/admin/settings" className="mt-3 inline-block text-sm underline">
          Open settings
        </Link>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">People CRM</h2>
        <p className="mt-1 text-sm text-slate-600">New leads: {leadsResult.count ?? 0}</p>
        <Link href="/admin/people" className="mt-3 inline-block text-sm underline">
          Open people management
        </Link>
      </Card>
    </div>
  );
}
