import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PEOPLE_ADMIN_ROLES } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

type AdminPeoplePageProps = {
  searchParams: Promise<{
    q?: string;
    status?: "VISITOR" | "MEMBER";
    tag?: string;
  }>;
};

function buildFilterHref(q: string, status: string, tag: string) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (status) {
    params.set("status", status);
  }

  if (tag) {
    params.set("tag", tag);
  }

  const query = params.toString();
  return query ? `/admin/people?${query}` : "/admin/people";
}

function sanitizeSearch(value: string) {
  return value.replaceAll("%", "").replaceAll(",", " ").trim();
}

export default async function AdminPeoplePage({ searchParams }: AdminPeoplePageProps) {
  await requireRole(PEOPLE_ADMIN_ROLES);
  const params = await searchParams;
  const q = sanitizeSearch(params.q?.trim() || "");
  const status = params.status === "VISITOR" || params.status === "MEMBER" ? params.status : "";
  const tag = params.tag?.trim() || "";
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("user_id, full_name, email, phone, status, tags, role, created_at")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const [{ data: profilesRaw }, { data: tagsSourceRaw }] = await Promise.all([
    query,
    supabase.from("profiles").select("tags"),
  ]);

  const profiles = profilesRaw ?? [];
  const availableTags = Array.from(
    new Set(
      (tagsSourceRaw ?? []).flatMap((item) =>
        (item.tags ?? []).map((tagValue) => tagValue.trim()).filter((tagValue) => tagValue.length > 0),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <section className="space-y-5">
      <Card>
        <h2 className="text-xl font-semibold">People</h2>
        <form action="/admin/people" className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search name or email"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="VISITOR">VISITOR</option>
            <option value="MEMBER">MEMBER</option>
          </select>
          <select name="tag" defaultValue={tag} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">All tags</option>
            {availableTags.map((tagValue) => (
              <option key={tagValue} value={tagValue}>
                {tagValue}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 md:col-span-4"
          >
            Apply filters
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link
            href={buildFilterHref(q, "", tag)}
            className={`rounded-full px-2 py-1 ${!status ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            All
          </Link>
          <Link
            href={buildFilterHref(q, "VISITOR", tag)}
            className={`rounded-full px-2 py-1 ${status === "VISITOR" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            Visitor
          </Link>
          <Link
            href={buildFilterHref(q, "MEMBER", tag)}
            className={`rounded-full px-2 py-1 ${status === "MEMBER" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            Member
          </Link>
        </div>
      </Card>

      <div className="grid gap-4">
        {profiles.map((profile) => (
          <Card key={profile.user_id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{profile.full_name || "Unnamed person"}</h3>
                <p className="mt-1 text-sm text-slate-600">{profile.email || "No email"}</p>
                {profile.phone ? <p className="text-sm text-slate-600">{profile.phone}</p> : null}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Role: {profile.role}</p>
                <p className="text-xs text-slate-500">Status: {profile.status}</p>
              </div>
            </div>

            {(profile.tags ?? []).length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(profile.tags ?? []).map((tagValue) => (
                  <Link
                    key={tagValue}
                    href={buildFilterHref(q, status, tagValue)}
                    className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    #{tagValue}
                  </Link>
                ))}
              </div>
            ) : null}

            <Link href={`/admin/people/${profile.user_id}`} className="mt-4 inline-block text-sm underline">
              Open profile
            </Link>
          </Card>
        ))}

        {!profiles.length ? (
          <Card>
            <p className="text-sm text-slate-600">No profiles match your filters.</p>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
