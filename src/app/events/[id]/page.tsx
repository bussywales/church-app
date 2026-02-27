import Link from "next/link";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-semibold">Event {id}</h1>
      <p className="mt-2 text-slate-600">Empty event detail route.</p>
      <Link
        href={`/events/${id}/register`}
        className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Register
      </Link>
    </div>
  );
}
