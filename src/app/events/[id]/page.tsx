import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/content";
import { RegisterEventButton } from "@/components/events/register-event-button";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  const [{ data: event }, { count: registrationCount }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, description, location, starts_at, ends_at, capacity")
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle(),
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", id),
  ]);

  if (!event) {
    notFound();
  }

  const currentCount = registrationCount ?? 0;
  const capacityReached = event.capacity !== null && currentCount >= event.capacity;

  return (
    <article className="space-y-5">
      <Card>
        <h1 className="text-3xl font-semibold">{event.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {formatDateTime(event.starts_at)}
          {event.ends_at ? ` - ${formatDateTime(event.ends_at)}` : ""}
        </p>

        {event.location ? <p className="mt-2 text-sm text-slate-700">Location: {event.location}</p> : null}

        {event.description ? <p className="mt-4 text-sm leading-6 text-slate-700">{event.description}</p> : null}

        <p className="mt-4 text-sm text-slate-700">
          Registrations: {currentCount}
          {event.capacity !== null ? ` / ${event.capacity}` : " (unlimited)"}
        </p>

        <div className="mt-5">
          <RegisterEventButton eventId={event.id} capacityReached={capacityReached} isAuthenticated={Boolean(user)} />
        </div>

        {capacityReached ? (
          <p className="mt-3 text-sm text-amber-700">
            This event is full. Waitlist support is not enabled yet.
          </p>
        ) : null}
      </Card>
    </article>
  );
}
