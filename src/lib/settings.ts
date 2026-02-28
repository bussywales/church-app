import { createClient } from "@/lib/supabase/server";

const GIFT_AID_SETTING_KEY = "gift_aid_enabled";

export async function getGiftAidEnabled() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value_json")
    .eq("key", GIFT_AID_SETTING_KEY)
    .maybeSingle();

  const valueObject =
    data?.value_json && typeof data.value_json === "object" && !Array.isArray(data.value_json)
      ? (data.value_json as { enabled?: unknown })
      : null;
  const enabled = valueObject?.enabled;

  return enabled === true;
}

export async function setGiftAidEnabled(enabled: boolean) {
  const supabase = await createClient();

  await supabase.from("settings").upsert(
    {
      key: GIFT_AID_SETTING_KEY,
      value_json: {
        enabled,
      },
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "key",
    },
  );
}
