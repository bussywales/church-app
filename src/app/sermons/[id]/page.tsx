import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDate, toYoutubeEmbedUrl } from "@/lib/content";

type SermonDetail = {
  id: string;
  title: string;
  speaker: string | null;
  series: string | null;
  youtube_url: string | null;
  preached_at: string | null;
  notes_md: string | null;
  tags: string[] | null;
};

type SermonDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SermonDetailPage({ params }: SermonDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("sermons")
    .select("id, title, speaker, series, youtube_url, preached_at, notes_md, tags")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  const sermon = data as SermonDetail | null;

  if (!sermon) {
    notFound();
  }

  const embedUrl = toYoutubeEmbedUrl(sermon.youtube_url);

  return (
    <article className="space-y-5">
      <Card>
        <h1 className="text-3xl font-semibold">{sermon.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {sermon.speaker || "Unknown speaker"}
          {sermon.series ? ` · ${sermon.series}` : ""}
          {sermon.preached_at ? ` · ${formatDate(sermon.preached_at)}` : ""}
        </p>

        {(sermon.tags ?? []).length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {(sermon.tags ?? []).map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Video</h2>
        {embedUrl ? (
          <div className="mt-3 aspect-video overflow-hidden rounded-md border border-slate-200">
            <iframe
              title={sermon.title}
              src={embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No YouTube video attached for this sermon yet.</p>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Notes</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {sermon.notes_md?.trim() || "No sermon notes have been published."}
        </p>
      </Card>
    </article>
  );
}
