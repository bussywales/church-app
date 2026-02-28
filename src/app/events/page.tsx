import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/content";

function sortEventsUpcomingFirst(
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    capacity: number | null;
  }>,
) {
  const now = Date.now();

  return events.sort((left, right) => {
    const leftStarts = new Date(left.starts_at).getTime();
    const rightStarts = new Date(right.starts_at).getTime();
    const leftUpcoming = leftStarts >= now;
    const rightUpcoming = rightStarts >= now;

    if (leftUpcoming !== rightUpcoming) {
      return leftUpcoming ? -1 : 1;
    }

    if (leftUpcoming) {
      return leftStarts - rightStarts;
    }

    return rightStarts - leftStarts;
  });
}

export default async function EventsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, title, description, location, starts_at, ends_at, capacity")
    .eq("is_published", true);

  const events = sortEventsUpcomingFirst(data ?? []);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Events</h1>

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <h2 className="text-xl font-semibold">
              <Link className="hover:underline" href={`/events/${event.id}`}>
                {event.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {formatDateTime(event.starts_at)}
              {event.ends_at ? ` - ${formatDateTime(event.ends_at)}` : ""}
            </p>
            {event.location ? <p className="mt-1 text-sm text-slate-600">{event.location}</p> : null}
            {event.description ? <p className="mt-3 text-sm text-slate-700">{event.description}</p> : null}
            <p className="mt-3 text-xs text-slate-500">
              Capacity: {event.capacity ?? "No limit"}
            </p>
          </Card>
        ))}

        {!events.length ? (
          <Card>
            <p className="text-slate-600">No published events found.</p>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
