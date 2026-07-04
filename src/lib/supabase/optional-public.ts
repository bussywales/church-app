import "server-only";

import { getOptionalEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function createOptionalPublicClient(context: string) {
  if (
    !getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    !getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  ) {
    console.warn(`${context}: public Supabase environment is unavailable.`);
    return null;
  }

  try {
    return await createClient();
  } catch {
    console.warn(`${context}: public Supabase client could not be initialised.`);
    return null;
  }
}
