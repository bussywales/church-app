type SermonDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SermonDetailPage({ params }: SermonDetailPageProps) {
  const { id } = await params;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-semibold">Sermon {id}</h1>
      <p className="mt-2 text-slate-600">Empty sermon detail route.</p>
    </div>
  );
}
