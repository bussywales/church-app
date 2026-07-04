import Link from "next/link";
import { createOptionalPublicClient } from "@/lib/supabase/optional-public";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/content";

type SermonListItem = {
  id: string;
  title: string;
  speaker: string | null;
  series: string | null;
  preached_at: string | null;
  tags: string[] | null;
};

type SermonFilterSource = {
  series: string | null;
  tags: string[] | null;
};

type SermonsPageProps = {
  searchParams: Promise<{
    series?: string;
    tag?: string;
  }>;
};

function buildFilterHref(series: string | null, tag: string | null) {
  const params = new URLSearchParams();

  if (series) {
    params.set("series", series);
  }

  if (tag) {
    params.set("tag", tag);
  }

  const query = params.toString();
  return query ? `/sermons?${query}` : "/sermons";
}

function filterPillClass(isActive: boolean) {
  return `inline-flex min-h-11 items-center rounded-full px-4 text-xs font-medium ${
    isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
  }`;
}

export default async function SermonsPage({ searchParams }: SermonsPageProps) {
  const params = await searchParams;
  const selectedSeries = params.series?.trim() || "";
  const selectedTag = params.tag?.trim() || "";
  const supabase = await createOptionalPublicClient("Sermons page");

  let sermons: SermonListItem[] = [];
  let filterData: SermonFilterSource[] = [];

  if (supabase) {
    try {
      let sermonsQuery = supabase
        .from("sermons")
        .select("id, title, speaker, series, preached_at, tags")
        .eq("is_published", true)
        .order("preached_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (selectedSeries) {
        sermonsQuery = sermonsQuery.eq("series", selectedSeries);
      }

      if (selectedTag) {
        sermonsQuery = sermonsQuery.contains("tags", [selectedTag]);
      }

      const [
        { data: sermonsData, error: sermonsError },
        { data: filterDataRaw, error: filterError },
      ] = await Promise.all([
        sermonsQuery,
        supabase.from("sermons").select("series, tags").eq("is_published", true),
      ]);

      if (sermonsError || filterError) {
        console.warn("Sermons page: optional public content fetch failed.");
      } else {
        sermons = (sermonsData ?? []) as SermonListItem[];
        filterData = (filterDataRaw ?? []) as SermonFilterSource[];
      }
    } catch {
      console.warn("Sermons page: optional public content fetch failed.");
    }
  }

  const availableSeries = Array.from(
    new Set(
      (filterData ?? [])
        .map((item) => item.series)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const availableTags = Array.from(
    new Set(
      (filterData ?? []).flatMap((item) =>
        (item.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Sermons</h1>

      <Card>
        <h2 className="text-sm font-medium text-slate-700">Filter by series</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={buildFilterHref(null, selectedTag || null)}
            className={filterPillClass(!selectedSeries)}
          >
            All series
          </Link>
          {availableSeries.map((series) => (
            <Link
              key={series}
              href={buildFilterHref(series, selectedTag || null)}
              className={filterPillClass(selectedSeries === series)}
            >
              {series}
            </Link>
          ))}
        </div>

        <h2 className="mt-5 text-sm font-medium text-slate-700">Filter by tag</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={buildFilterHref(selectedSeries || null, null)}
            className={filterPillClass(!selectedTag)}
          >
            All tags
          </Link>
          {availableTags.map((tag) => (
            <Link
              key={tag}
              href={buildFilterHref(selectedSeries || null, tag)}
              className={filterPillClass(selectedTag === tag)}
            >
              #{tag}
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid gap-4">
        {sermons.map((sermon) => (
          <Card key={sermon.id}>
            <h2 className="text-xl font-semibold">
              <Link
                className="inline-flex min-h-11 items-center hover:underline"
                href={`/sermons/${sermon.id}`}
              >
                {sermon.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {sermon.speaker || "Unknown speaker"}
              {sermon.series ? ` · ${sermon.series}` : ""}
              {sermon.preached_at ? ` · ${formatDate(sermon.preached_at)}` : ""}
            </p>
            {(sermon.tags ?? []).length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(sermon.tags ?? []).map((tag) => (
                  <Link
                    key={tag}
                    href={buildFilterHref(selectedSeries || null, tag)}
                    className="inline-flex min-h-11 items-center rounded-full bg-slate-100 px-4 text-xs font-medium text-slate-700"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : null}
          </Card>
        ))}

        {!sermons.length ? (
          <Card>
            <p className="text-slate-600">No published sermons match the current filters.</p>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
