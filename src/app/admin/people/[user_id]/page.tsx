import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth";
import { PEOPLE_ADMIN_ROLES } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/content";

type AdminPersonDetailPageProps = {
  params: Promise<{ user_id: string }>;
};

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

async function updatePersonAction(formData: FormData) {
  "use server";

  await requireRole(PEOPLE_ADMIN_ROLES);
  const supabase = await createClient();

  const userId = readText(formData, "user_id");

  if (!userId) {
    return;
  }

  await supabase
    .from("profiles")
    .update({
      status: readText(formData, "status") === "MEMBER" ? "MEMBER" : "VISITOR",
      tags: parseTags(readText(formData, "tags")),
    })
    .eq("user_id", userId);

  revalidatePath(`/admin/people/${userId}`);
  revalidatePath("/admin/people");
}

async function addNoteAction(formData: FormData) {
  "use server";

  const { user: adminUser } = await requireRole(PEOPLE_ADMIN_ROLES);
  const supabase = await createClient();

  const profileUserId = readText(formData, "profile_user_id");
  const note = readText(formData, "note");

  if (!profileUserId || !note) {
    return;
  }

  await supabase.from("people_notes").insert({
    profile_user_id: profileUserId,
    note,
    created_by: adminUser.id,
  });

  revalidatePath(`/admin/people/${profileUserId}`);
}

export default async function AdminPersonDetailPage({ params }: AdminPersonDetailPageProps) {
  const [{ user_id: userId }, currentUser] = await Promise.all([params, requireUser()]);
  await requireRole(PEOPLE_ADMIN_ROLES);
  const supabase = await createClient();

  const [{ data: profile }, { data: notesRaw }, { data: noteAuthorsRaw }] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, email, full_name, phone, address_line1, city, postcode, status, tags, role, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("people_notes")
      .select("id, note, created_by, created_at")
      .eq("profile_user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("user_id, full_name"),
  ]);

  if (!profile) {
    notFound();
  }

  const noteAuthors = new Map((noteAuthorsRaw ?? []).map((author) => [author.user_id, author.full_name]));
  const notes = (notesRaw ?? []).map((note) => ({
    ...note,
    author_name: noteAuthors.get(note.created_by) || null,
  }));

  return (
    <section className="space-y-5">
      <Card>
        <h1 className="text-2xl font-semibold">{profile.full_name || "Unnamed person"}</h1>
        <p className="mt-1 text-sm text-slate-600">{profile.email || "No email"}</p>
        {profile.phone ? <p className="text-sm text-slate-600">{profile.phone}</p> : null}
        <p className="mt-2 text-xs text-slate-500">Profile role: {profile.role}</p>

        <form action={updatePersonAction} className="mt-4 space-y-3">
          <input type="hidden" name="user_id" value={profile.user_id} />
          <label className="block text-sm text-slate-700">
            Status
            <select
              name="status"
              defaultValue={profile.status}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="VISITOR">VISITOR</option>
              <option value="MEMBER">MEMBER</option>
            </select>
          </label>
          <label className="block text-sm text-slate-700">
            Tags (comma separated)
            <input
              name="tags"
              defaultValue={(profile.tags ?? []).join(", ")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Save profile
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Internal notes</h2>
        <p className="mt-1 text-sm text-slate-600">Visible only to admins and pastoral team.</p>

        <form action={addNoteAction} className="mt-4 space-y-3">
          <input type="hidden" name="profile_user_id" value={profile.user_id} />
          <textarea
            name="note"
            rows={4}
            placeholder="Add internal note"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Add note
          </button>
        </form>

        <div className="mt-4 space-y-3">
          {notes.map((note) => (
            <article key={note.id} className="rounded-md border border-slate-200 p-3">
              <p className="whitespace-pre-wrap text-sm text-slate-800">{note.note}</p>
              <p className="mt-2 text-xs text-slate-500">
                By {note.author_name || note.created_by}
                {note.created_by === currentUser.id ? " (you)" : ""} · {formatDateTime(note.created_at)}
              </p>
            </article>
          ))}
          {!notes.length ? <p className="text-sm text-slate-600">No internal notes yet.</p> : null}
        </div>
      </Card>
    </section>
  );
}
