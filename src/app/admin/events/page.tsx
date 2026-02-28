import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { CONTENT_ADMIN_ROLES } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDateTime, toDatetimeLocalValue } from "@/lib/content";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toIsoOrNull(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseCapacity(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed);
}

async function createEventAction(formData: FormData) {
  "use server";

  await requireRole(CONTENT_ADMIN_ROLES);
  const supabase = await createClient();

  const title = readText(formData, "title");
  const startsAt = toIsoOrNull(readText(formData, "starts_at"));

  if (!title || !startsAt) {
    return;
  }

  await supabase.from("events").insert({
    title,
    description: readText(formData, "description") || null,
    location: readText(formData, "location") || null,
    starts_at: startsAt,
    ends_at: toIsoOrNull(readText(formData, "ends_at")),
    capacity: parseCapacity(readText(formData, "capacity")),
    is_published: formData.get("is_published") === "on",
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
}

async function updateEventAction(formData: FormData) {
  "use server";

  await requireRole(CONTENT_ADMIN_ROLES);
  const supabase = await createClient();

  const id = readText(formData, "id");
  const title = readText(formData, "title");
  const startsAt = toIsoOrNull(readText(formData, "starts_at"));

  if (!id || !title || !startsAt) {
    return;
  }

  await supabase
    .from("events")
    .update({
      title,
      description: readText(formData, "description") || null,
      location: readText(formData, "location") || null,
      starts_at: startsAt,
      ends_at: toIsoOrNull(readText(formData, "ends_at")),
      capacity: parseCapacity(readText(formData, "capacity")),
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", id);

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
}

async function toggleEventPublishAction(formData: FormData) {
  "use server";

  await requireRole(CONTENT_ADMIN_ROLES);
  const supabase = await createClient();

  const id = readText(formData, "id");
  const publish = readText(formData, "publish") === "true";

  if (!id) {
    return;
  }

  await supabase.from("events").update({ is_published: publish }).eq("id", id);

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
}

async function deleteEventAction(formData: FormData) {
  "use server";

  await requireRole(CONTENT_ADMIN_ROLES);
  const supabase = await createClient();

  const id = readText(formData, "id");

  if (!id) {
    return;
  }

  await supabase.from("events").delete().eq("id", id);

  revalidatePath("/admin/events");
  revalidatePath("/events");
}

export default async function AdminEventsPage() {
  await requireRole(CONTENT_ADMIN_ROLES);
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, location, starts_at, ends_at, capacity, is_published, created_at")
    .order("starts_at", { ascending: true });

  return (
    <section className="space-y-5">
      <Card>
        <h2 className="text-xl font-semibold">Create event</h2>
        <form action={createEventAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="title" required placeholder="Title" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input
            name="location"
            placeholder="Location"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="text-sm text-slate-700">
            Starts at
            <input
              type="datetime-local"
              name="starts_at"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Ends at
            <input
              type="datetime-local"
              name="ends_at"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <input
            type="number"
            name="capacity"
            min={1}
            placeholder="Capacity"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="is_published" /> Publish now
          </label>
          <textarea
            name="description"
            rows={4}
            placeholder="Description"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 md:col-span-2"
          >
            Create event
          </button>
        </form>
      </Card>

      <div className="grid gap-4">
        {(events ?? []).map((event) => (
          <Card key={event.id}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{event.title}</h3>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  event.is_published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {event.is_published ? "Published" : "Draft"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Starts {formatDateTime(event.starts_at)}</p>
            <Link href={`/admin/events/${event.id}/checkin`} className="mt-2 inline-block text-xs underline">
              Open check-in
            </Link>

            <form action={updateEventAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="id" value={event.id} />
              <input
                name="title"
                required
                defaultValue={event.title}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="location"
                defaultValue={event.location ?? ""}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <label className="text-sm text-slate-700">
                Starts at
                <input
                  type="datetime-local"
                  name="starts_at"
                  required
                  defaultValue={toDatetimeLocalValue(event.starts_at)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Ends at
                <input
                  type="datetime-local"
                  name="ends_at"
                  defaultValue={toDatetimeLocalValue(event.ends_at)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <input
                type="number"
                name="capacity"
                min={1}
                defaultValue={event.capacity ?? ""}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="is_published" defaultChecked={event.is_published} /> Published
              </label>
              <textarea
                name="description"
                rows={4}
                defaultValue={event.description ?? ""}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
              />
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 md:col-span-2"
              >
                Save changes
              </button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              <form action={toggleEventPublishAction}>
                <input type="hidden" name="id" value={event.id} />
                <input type="hidden" name="publish" value={event.is_published ? "false" : "true"} />
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
                >
                  {event.is_published ? "Unpublish" : "Publish"}
                </button>
              </form>

              <form action={deleteEventAction}>
                <input type="hidden" name="id" value={event.id} />
                <button
                  type="submit"
                  className="rounded-md bg-rose-700 px-3 py-2 text-xs font-medium text-white hover:bg-rose-600"
                >
                  Delete
                </button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
