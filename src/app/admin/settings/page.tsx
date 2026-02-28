import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { FINANCE_ROLES } from "@/lib/roles";
import { getGiftAidEnabled, setGiftAidEnabled } from "@/lib/settings";
import { Card } from "@/components/ui/card";

async function saveGiftAidSettingAction(formData: FormData) {
  "use server";

  await requireRole(FINANCE_ROLES);
  const enabled = formData.get("gift_aid_enabled") === "on";
  await setGiftAidEnabled(enabled);

  revalidatePath("/admin/settings");
  revalidatePath("/give");
}

export default async function AdminSettingsPage() {
  await requireRole(FINANCE_ROLES);
  const giftAidEnabled = await getGiftAidEnabled();

  return (
    <section className="space-y-5">
      <Card>
        <h2 className="text-xl font-semibold">Giving settings</h2>
        <p className="mt-2 text-sm text-slate-600">Configure global giving behavior.</p>

        <form action={saveGiftAidSettingAction} className="mt-4 space-y-4">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="gift_aid_enabled" defaultChecked={giftAidEnabled} className="mt-1" />
            Enable Gift Aid for one-off giving
          </label>

          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Save settings
          </button>
        </form>
      </Card>
    </section>
  );
}
