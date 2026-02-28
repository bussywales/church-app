import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

type NewHerePageProps = {
  searchParams: Promise<{ submitted?: string; error?: string }>;
};

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function submitNewHereAction(formData: FormData) {
  "use server";

  const fullName = readText(formData, "full_name");
  const email = readText(formData, "email").toLowerCase();
  const phone = readText(formData, "phone");
  const consent = formData.get("consent") === "on";

  if (!fullName || !email || !consent) {
    redirect("/new-here?error=invalid");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("leads").insert({
    full_name: fullName,
    email,
    phone: phone || null,
    consent: true,
    status: "NEW",
    tags: ["new-here"],
  });

  if (error) {
    redirect("/new-here?error=save");
  }

  redirect("/new-here?submitted=1");
}

export default async function NewHerePage({ searchParams }: NewHerePageProps) {
  const params = await searchParams;

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <Card>
        <h1 className="text-3xl font-semibold">New Here</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tell us about you and our team will reach out.
        </p>

        <form action={submitNewHereAction} className="mt-4 space-y-3">
          <input
            name="full_name"
            required
            placeholder="Full name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="phone"
            placeholder="Phone"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="consent" className="mt-1" required />
            I consent to being contacted by the church.
          </label>

          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Submit
          </button>
        </form>

        {params.submitted === "1" ? (
          <p className="mt-3 text-sm text-emerald-700">Thank you. We have received your details.</p>
        ) : null}
        {params.error ? (
          <p className="mt-3 text-sm text-rose-700">Unable to submit right now. Please check your details and try again.</p>
        ) : null}
      </Card>
    </section>
  );
}
