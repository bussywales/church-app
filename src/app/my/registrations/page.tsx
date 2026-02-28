import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { ensureProfile, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/content";

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
};

type RegistrationRow = {
  id: string;
  event_id: string;
  status: string;
  qr_code: string | null;
  created_at: string;
};

type RegistrationWithEvent = RegistrationRow & {
  event: EventRow | null;
};

function toUpcomingRegistrations(rows: RegistrationWithEvent[]) {
  const now = Date.now();

  return rows
    .filter((row) => row.event && new Date(row.event.starts_at).getTime() >= now)
    .sort((left, right) => new Date(left.event!.starts_at).getTime() - new Date(right.event!.starts_at).getTime());
}

export default async function MyRegistrationsPage() {
  const user = await requireUser("/my/registrations");
  await ensureProfile(user);

  const supabase = await createClient();

  const { data: registrationData } = await supabase
    .from("registrations")
    .select("id, event_id, status, qr_code, created_at")
    .eq("user_id", user.id);

  const rows = (registrationData ?? []) as RegistrationRow[];
  const eventIds = Array.from(new Set(rows.map((row) => row.event_id)));

  const { data: eventData } = eventIds.length
    ? await supabase.from("events").select("id, title, starts_at, location").in("id", eventIds)
    : { data: [] as EventRow[] };

  const eventsById = new Map((eventData ?? []).map((event) => [event.id, event]));

  const withEvent: RegistrationWithEvent[] = rows.map((row) => ({
    ...row,
    event: eventsById.get(row.event_id) ?? null,
  }));

  const upcoming = toUpcomingRegistrations(withEvent);

  const qrImages = await Promise.all(
    upcoming.map(async (row) => {
      if (!row.qr_code) {
        return null;
      }

      return QRCode.toDataURL(row.qr_code, {
        margin: 1,
        width: 192,
      });
    }),
  );

  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-semibold">My Registrations</h1>

      {upcoming.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {upcoming.map((registration, index) => {
            const event = registration.event!;

            return (
              <Card key={registration.id}>
                <h2 className="text-lg font-semibold">{event.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{formatDateTime(event.starts_at)}</p>
                {event.location ? <p className="text-sm text-slate-600">{event.location}</p> : null}
                <p className="mt-2 text-xs text-slate-500">Status: {registration.status}</p>

                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">QR token</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-800">{registration.qr_code ?? "Not assigned"}</p>

                  {qrImages[index] ? (
                    <Image
                      src={qrImages[index]}
                      alt={`QR code for ${event.title}`}
                      width={160}
                      height={160}
                      unoptimized
                      className="mt-3 rounded border border-slate-300 bg-white"
                    />
                  ) : null}
                </div>

                <Link href={`/events/${event.id}`} className="mt-4 inline-block text-sm underline">
                  View event
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <p className="text-slate-600">No upcoming registrations found.</p>
        </Card>
      )}
    </section>
  );
}
