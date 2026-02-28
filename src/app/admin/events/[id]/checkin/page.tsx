import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { CONTENT_ADMIN_ROLES } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/content";

type CheckinPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string }>;
};

type CheckedInRow = {
  id: string;
  user_id: string;
  qr_code: string | null;
  checked_in_at: string | null;
};

async function submitCheckinAction(formData: FormData) {
  "use server";

  await requireRole(CONTENT_ADMIN_ROLES);
  const eventId = String(formData.get("event_id") ?? "").trim();
  const token = String(formData.get("qr_token") ?? "").trim();

  if (!eventId || !token) {
    redirect(`/admin/events/${eventId}/checkin?result=missing`);
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("registrations")
    .update({
      status: "CHECKED_IN",
      checked_in_at: new Date().toISOString(),
    })
    .eq("event_id", eventId)
    .eq("qr_code", token)
    .select("id")
    .limit(1);

  if (error || !data?.length) {
    redirect(`/admin/events/${eventId}/checkin?result=not_found`);
  }

  revalidatePath(`/admin/events/${eventId}/checkin`);
  revalidatePath(`/events/${eventId}`);
  redirect(`/admin/events/${eventId}/checkin?result=checked_in`);
}

export default async function AdminEventCheckinPage({ params, searchParams }: CheckinPageProps) {
  await requireRole(CONTENT_ADMIN_ROLES);
  const { id } = await params;
  const { result } = await searchParams;

  const supabase = await createClient();

  const [{ data: event }, { data: recentCheckinsRaw }] = await Promise.all([
    supabase.from("events").select("id, title, starts_at").eq("id", id).maybeSingle(),
    supabase
      .from("registrations")
      .select("id, user_id, qr_code, checked_in_at")
      .eq("event_id", id)
      .eq("status", "CHECKED_IN")
      .order("checked_in_at", { ascending: false })
      .limit(10),
  ]);

  if (!event) {
    notFound();
  }

  const recentCheckinsRows = (recentCheckinsRaw ?? []) as CheckedInRow[];
  const profileIds = Array.from(new Set(recentCheckinsRows.map((row) => row.user_id)));

  const { data: profileData } = profileIds.length
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", profileIds)
    : { data: [] as Array<{ user_id: string; full_name: string | null }> };

  const namesById = new Map((profileData ?? []).map((profile) => [profile.user_id, profile.full_name]));

  const recentCheckins = recentCheckinsRows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    qr_code: row.qr_code,
    checked_in_at: row.checked_in_at,
    full_name: namesById.get(row.user_id) ?? null,
  }));

  return (
    <section className="space-y-5">
      <Card>
        <h1 className="text-2xl font-semibold">Event check-in</h1>
        <p className="mt-1 text-sm text-slate-600">{event.title}</p>
        <p className="text-sm text-slate-600">{formatDateTime(event.starts_at)}</p>

        <form action={submitCheckinAction} className="mt-4 space-y-3">
          <input type="hidden" name="event_id" value={event.id} />
          <label className="block text-sm text-slate-700">
            QR token
            <input
              name="qr_token"
              placeholder="Paste or scan token"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Check in attendee
          </button>
        </form>

        {result === "checked_in" ? <p className="mt-3 text-sm text-emerald-700">Check-in recorded.</p> : null}
        {result === "not_found" ? <p className="mt-3 text-sm text-rose-700">Token not found for this event.</p> : null}
        {result === "missing" ? <p className="mt-3 text-sm text-rose-700">Please provide a token.</p> : null}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Last 10 check-ins</h2>

        {recentCheckins.length ? (
          <ul className="mt-3 space-y-3">
            {recentCheckins.map((item) => (
              <li key={item.id} className="rounded-md border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">{item.full_name || item.user_id}</p>
                <p className="text-xs text-slate-600">{item.checked_in_at ? formatDateTime(item.checked_in_at) : "No timestamp"}</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-500">{item.qr_code || "No QR token"}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No check-ins recorded yet.</p>
        )}

        <Link href="/admin/events" className="mt-4 inline-block text-sm underline">
          Back to events admin
        </Link>
      </Card>
    </section>
  );
}
