import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { CONTENT_ADMIN_ROLES } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/content";

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

async function createSermonAction(formData: FormData) {
  "use server";

  await requireRole(CONTENT_ADMIN_ROLES);
  const supabase = await createClient();

  const title = readText(formData, "title");

  if (!title) {
    return;
  }

  const tags = parseTags(readText(formData, "tags"));

  await supabase.from("sermons").insert({
    title,
    speaker: readText(formData, "speaker") || null,
    series: readText(formData, "series") || null,
    youtube_url: readText(formData, "youtube_url") || null,
    preached_at: readText(formData, "preached_at") || null,
    notes_md: readText(formData, "notes_md") || null,
    tags,
    is_published: formData.get("is_published") === "on",
  });

  revalidatePath("/admin/sermons");
  revalidatePath("/sermons");
}

async function updateSermonAction(formData: FormData) {
  "use server";

  await requireRole(CONTENT_ADMIN_ROLES);
  const supabase = await createClient();

  const id = readText(formData, "id");
  const title = readText(formData, "title");

  if (!id || !title) {
    return;
  }

  const tags = parseTags(readText(formData, "tags"));

  await supabase
    .from("sermons")
    .update({
      title,
      speaker: readText(formData, "speaker") || null,
      series: readText(formData, "series") || null,
      youtube_url: readText(formData, "youtube_url") || null,
      preached_at: readText(formData, "preached_at") || null,
      notes_md: readText(formData, "notes_md") || null,
      tags,
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", id);

  revalidatePath("/admin/sermons");
  revalidatePath("/sermons");
  revalidatePath(`/sermons/${id}`);
}

async function toggleSermonPublishAction(formData: FormData) {
  "use server";

  await requireRole(CONTENT_ADMIN_ROLES);
  const supabase = await createClient();

  const id = readText(formData, "id");
  const publish = readText(formData, "publish") === "true";

  if (!id) {
    return;
  }

  await supabase.from("sermons").update({ is_published: publish }).eq("id", id);

  revalidatePath("/admin/sermons");
  revalidatePath("/sermons");
  revalidatePath(`/sermons/${id}`);
}

async function deleteSermonAction(formData: FormData) {
  "use server";

  await requireRole(CONTENT_ADMIN_ROLES);
  const supabase = await createClient();

  const id = readText(formData, "id");

  if (!id) {
    return;
  }

  await supabase.from("sermons").delete().eq("id", id);

  revalidatePath("/admin/sermons");
  revalidatePath("/sermons");
}

export default async function AdminSermonsPage() {
  await requireRole(CONTENT_ADMIN_ROLES);
  const supabase = await createClient();

  const { data: sermons } = await supabase
    .from("sermons")
    .select("id, title, speaker, series, youtube_url, preached_at, notes_md, tags, is_published, created_at")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-5">
      <Card>
        <h2 className="text-xl font-semibold">Create sermon</h2>
        <form action={createSermonAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="title" required placeholder="Title" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="speaker" placeholder="Speaker" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="series" placeholder="Series" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input
            name="youtube_url"
            placeholder="YouTube URL"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            name="preached_at"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="tags"
            placeholder="Tags (comma separated)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            name="notes_md"
            placeholder="Notes (markdown)"
            rows={4}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
            <input type="checkbox" name="is_published" /> Publish now
          </label>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 md:col-span-2"
          >
            Create sermon
          </button>
        </form>
      </Card>

      <div className="grid gap-4">
        {(sermons ?? []).map((sermon) => (
          <Card key={sermon.id}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{sermon.title}</h3>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  sermon.is_published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {sermon.is_published ? "Published" : "Draft"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Created {formatDate(sermon.created_at)}
              {sermon.preached_at ? ` · Preached ${formatDate(sermon.preached_at)}` : ""}
            </p>

            <form action={updateSermonAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="id" value={sermon.id} />
              <input
                name="title"
                defaultValue={sermon.title}
                required
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="speaker"
                defaultValue={sermon.speaker ?? ""}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="series"
                defaultValue={sermon.series ?? ""}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="youtube_url"
                defaultValue={sermon.youtube_url ?? ""}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="date"
                name="preached_at"
                defaultValue={sermon.preached_at ?? ""}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="tags"
                defaultValue={(sermon.tags ?? []).join(", ")}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                name="notes_md"
                defaultValue={sermon.notes_md ?? ""}
                rows={4}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
              />
              <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                <input type="checkbox" name="is_published" defaultChecked={sermon.is_published} /> Published
              </label>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 md:col-span-2"
              >
                Save changes
              </button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              <form action={toggleSermonPublishAction}>
                <input type="hidden" name="id" value={sermon.id} />
                <input type="hidden" name="publish" value={sermon.is_published ? "false" : "true"} />
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
                >
                  {sermon.is_published ? "Unpublish" : "Publish"}
                </button>
              </form>

              <form action={deleteSermonAction}>
                <input type="hidden" name="id" value={sermon.id} />
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
