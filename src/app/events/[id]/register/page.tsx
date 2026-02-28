import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureProfile, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { RegisterEventForm } from "@/components/events/register-event-form";
import { formatDateTime } from "@/lib/content";

type EventRegisterPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventRegisterPage({ params }: EventRegisterPageProps) {
  const { id } = await params;
  const user = await requireUser(`/events/${id}/register`);
  await ensureProfile(user);

  const supabase = await createClient();

  const [{ data: event }, { count: registrationCount }, { data: existingRegistration }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, starts_at, capacity")
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle(),
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", id),
    supabase
      .from("registrations")
      .select("id, qr_code, status")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!event) {
    notFound();
  }

  const capacityReached = event.capacity !== null && (registrationCount ?? 0) >= event.capacity;

  return (
    <Card className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Register for {event.title}</h1>
      <p className="mt-2 text-sm text-slate-600">{formatDateTime(event.starts_at)}</p>

      {existingRegistration ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-emerald-700">You are already registered for this event.</p>
          <p className="text-xs text-slate-600">Status: {existingRegistration.status}</p>
          {existingRegistration.qr_code ? (
            <p className="break-all rounded-md bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700">
              QR token: {existingRegistration.qr_code}
            </p>
          ) : null}
        </div>
      ) : capacityReached ? (
        <p className="mt-4 text-sm text-amber-700">This event is full. Waitlist support is not enabled yet.</p>
      ) : (
        <div className="mt-4">
          <RegisterEventForm eventId={event.id} />
        </div>
      )}

      <Link href={`/events/${event.id}`} className="mt-5 inline-block text-sm text-slate-700 underline">
        Back to event details
      </Link>
    </Card>
  );
}
