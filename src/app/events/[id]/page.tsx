type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-semibold">Event {id}</h1>
      <p className="mt-2 text-slate-600">Empty event detail route.</p>
    </div>
  );
}
