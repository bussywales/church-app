import { requireRole } from "@/lib/auth";
import { ADMIN_PANEL_ROLES } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { getOptionalEnv, publicClientEnv, serverEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  await requireRole(ADMIN_PANEL_ROLES);

  const supabase = await createClient();
  const { error } = await supabase.from("settings").select("key").limit(1);

  return (
    <section className="space-y-5">
      <Card>
        <h2 className="text-xl font-semibold">Runtime health</h2>
        <p className="mt-1 text-sm text-slate-600">
          Environment and connectivity checks for this deployment. No keys or secrets are shown here.
        </p>

        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-900">APP_ENV</dt>
            <dd className="mt-1 text-slate-600">{serverEnv.APP_ENV}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">NEXT_PUBLIC_APP_ENV</dt>
            <dd className="mt-1 text-slate-600">{publicClientEnv.NEXT_PUBLIC_APP_ENV}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">VERCEL_ENV</dt>
            <dd className="mt-1 text-slate-600">{getOptionalEnv("VERCEL_ENV") || "Not set"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Database connectivity</dt>
            <dd className={error ? "mt-1 text-rose-700" : "mt-1 text-emerald-700"}>
              {error ? "Failed" : "Connected"}
            </dd>
          </div>
        </dl>

        {error ? <p className="mt-4 text-sm text-rose-700">{error.message}</p> : null}
      </Card>
    </section>
  );
}
