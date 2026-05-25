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

  const sermonCount = sermonsResult.count ?? 0;
  const eventCount = eventsResult.count ?? 0;
  const newLeadCount = leadsResult.count ?? 0;
  const isEmptySetup = sermonCount === 0 && eventCount === 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {isEmptySetup ? (
        <Card className="md:col-span-2">
          <h2 className="text-lg font-semibold">First-time setup</h2>
          <p className="mt-1 text-sm text-slate-600">
            This admin area has no sermons or events yet. Run <code className="rounded bg-slate-100 px-1">npm run seed</code>{" "}
            with Supabase service-role credentials to load demo-ready content, or create records manually below.
          </p>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-lg font-semibold">Sermons</h2>
        <p className="mt-1 text-sm text-slate-600">Total sermons: {sermonCount}</p>
        <Link href="/admin/sermons" className="mt-3 inline-block text-sm underline">
          Manage sermons
        </Link>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Events</h2>
        <p className="mt-1 text-sm text-slate-600">Total events: {eventCount}</p>
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
        <p className="mt-1 text-sm text-slate-600">New leads: {newLeadCount}</p>
        <Link href="/admin/people" className="mt-3 inline-block text-sm underline">
          Open people management
        </Link>
      </Card>
    </div>
  );
}
