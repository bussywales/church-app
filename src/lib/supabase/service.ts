import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { assertRuntimeEnvironmentSafety, publicClientEnv, serverEnv } from "@/lib/env";

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export function createServiceClient() {
  assertRuntimeEnvironmentSafety();

  if (serviceClient) {
    return serviceClient;
  }

  serviceClient = createClient<Database>(
    publicClientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return serviceClient;
}
