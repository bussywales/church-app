import { ensureProfile, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getGiftAidEnabled } from "@/lib/settings";
import { Card } from "@/components/ui/card";
import { GiveForm } from "@/components/give/give-form";

type GivePageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function GivePage({ searchParams }: GivePageProps) {
  const user = await requireUser("/give");
  const profile = await ensureProfile(user);
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: funds }, giftAidEnabled] = await Promise.all([
    supabase.from("funds").select("id, name, description").eq("is_active", true).order("name", { ascending: true }),
    getGiftAidEnabled(),
  ]);

  const missingAddress = !profile.address_line1 || !profile.city || !profile.postcode;

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <Card>
        <h1 className="text-3xl font-semibold">Give</h1>
        <p className="mt-2 text-sm text-slate-600">Secure one-off giving with Stripe Checkout.</p>
      </Card>

      <Card>
        <GiveForm
          funds={funds ?? []}
          giftAidEnabled={giftAidEnabled}
          status={params.status ?? null}
          defaults={{
            fullName: profile.full_name ?? "",
            addressLine1: profile.address_line1 ?? "",
            city: profile.city ?? "",
            postcode: profile.postcode ?? "",
          }}
          missingAddress={missingAddress}
        />
      </Card>
    </section>
  );
}
