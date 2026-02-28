import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export function createServiceClient() {
  if (serviceClient) {
    return serviceClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.");
  }

  serviceClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serviceClient;
}
