import "server-only";

export type AppEnv = "development" | "staging" | "production";

type ServerEnvConfig = {
  readonly APP_ENV: AppEnv;
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_WEBHOOK_SECRET: string;
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM_EMAIL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
};

type PublicClientEnvConfig = {
  readonly NEXT_PUBLIC_SUPABASE_URL: string;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  readonly NEXT_PUBLIC_APP_ENV: AppEnv;
};

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

function getRequiredAppEnv(name: string): AppEnv {
  const value = getRequiredEnv(name);

  if (value === "development" || value === "staging" || value === "production") {
    return value;
  }

  throw new Error(`Invalid environment variable ${name}: expected development, staging, or production.`);
}

export const serverEnv: ServerEnvConfig = {
  get APP_ENV() {
    return getRequiredAppEnv("APP_ENV");
  },
  get STRIPE_SECRET_KEY() {
    return getRequiredEnv("STRIPE_SECRET_KEY");
  },
  get STRIPE_WEBHOOK_SECRET() {
    return getRequiredEnv("STRIPE_WEBHOOK_SECRET");
  },
  get RESEND_API_KEY() {
    return getRequiredEnv("RESEND_API_KEY");
  },
  get RESEND_FROM_EMAIL() {
    return getRequiredEnv("RESEND_FROM_EMAIL");
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
};

export const publicClientEnv: PublicClientEnvConfig = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get NEXT_PUBLIC_APP_ENV() {
    return getRequiredAppEnv("NEXT_PUBLIC_APP_ENV");
  },
};

export function assertRuntimeEnvironmentSafety() {
  if (serverEnv.APP_ENV === "production" && publicClientEnv.NEXT_PUBLIC_APP_ENV !== "production") {
    throw new Error("Runtime environment mismatch: APP_ENV=production requires NEXT_PUBLIC_APP_ENV=production.");
  }
}
