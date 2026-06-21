import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type EnvMap = Record<string, string>;

type CleanupState = {
  marker: string;
  eventIds: string[];
  userIds: string[];
};

type RegistrationResult = {
  registration_id: string;
  qr_code: string | null;
  event_title: string;
  event_starts_at: string;
  status: string;
  message: string;
  was_created: boolean;
};

type AvailabilityResult = {
  event_id: string;
  active_registration_count: number;
  capacity: number | null;
  capacity_reached: boolean;
};

const STAGING_REF = "onikyhqhcbmrrlrcirrg";

function loadLocalEnv(): EnvMap {
  const env: EnvMap = {};
  const envPath = path.join(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return env;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    env[trimmed.slice(0, separatorIndex).trim()] = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }

  return env;
}

function requiredEnv(env: EnvMap, name: string) {
  const value = env[name] || process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function assertStaging(url: string) {
  if (!url.includes(STAGING_REF)) {
    throw new Error("Refusing to run: Supabase URL is not the staging project.");
  }
}

function futureIsoDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

async function mustSucceed<T>(
  result: { data: T; error: { message: string } | null },
  context: string,
): Promise<T> {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }

  return result.data;
}

function createAuthedClient(url: string, anonKey: string, accessToken: string) {
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

async function createTestUser(
  serviceClient: SupabaseClient,
  url: string,
  anonKey: string,
  marker: string,
  index: number,
  cleanup: CleanupState,
) {
  const email = `qa-event-${randomUUID()}@example.invalid`;
  const password = `QA-${randomUUID()}aA1!`;

  const created = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created.error || !created.data.user) {
    throw new Error(`Create test user ${index}: ${created.error?.message ?? "No user returned."}`);
  }

  const userId = created.data.user.id;
  cleanup.userIds.push(userId);

  await mustSucceed(
    await serviceClient.from("profiles").upsert(
      {
        user_id: userId,
        email,
        full_name: `QA Event User ${index}`,
        status: "MEMBER",
        role: "MEMBER",
        tags: [marker],
      },
      { onConflict: "user_id" },
    ),
    `Create profile ${index}`,
  );

  const authClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const session = await authClient.auth.signInWithPassword({ email, password });

  if (session.error || !session.data.session?.access_token) {
    throw new Error(`Sign in test user ${index}: ${session.error?.message ?? "No access token returned."}`);
  }

  return createAuthedClient(url, anonKey, session.data.session.access_token);
}

async function createCapacityOneEvent(serviceClient: SupabaseClient, marker: string, cleanup: CleanupState) {
  const event = await mustSucceed(
    await serviceClient
      .from("events")
      .insert({
        title: marker,
        description: "Disposable QA event for atomic registration verification.",
        location: "QA",
        starts_at: futureIsoDate(),
        capacity: 1,
        is_published: true,
      })
      .select("id")
      .single(),
    "Create test event",
  );

  if (!event?.id) {
    throw new Error("Create test event: no event id returned.");
  }

  cleanup.eventIds.push(event.id);

  return event.id as string;
}

async function activeRegistrationCount(serviceClient: SupabaseClient, eventId: string) {
  const { count, error } = await serviceClient
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .in("status", ["REGISTERED", "CHECKED_IN"]);

  if (error) {
    throw new Error(`Count active registrations: ${error.message}`);
  }

  return count ?? 0;
}

async function runVerification(serviceClient: SupabaseClient, url: string, anonKey: string, cleanup: CleanupState) {
  const eventId = await createCapacityOneEvent(serviceClient, cleanup.marker, cleanup);
  const userOne = await createTestUser(serviceClient, url, anonKey, cleanup.marker, 1, cleanup);
  const userTwo = await createTestUser(serviceClient, url, anonKey, cleanup.marker, 2, cleanup);

  const concurrentResults = await Promise.all([
    userOne.rpc("register_for_event", { p_event_id: eventId }).single(),
    userTwo.rpc("register_for_event", { p_event_id: eventId }).single(),
  ]);

  const successes = concurrentResults.filter((result) => !result.error);
  const fullErrors = concurrentResults.filter((result) => result.error?.message.includes("EVENT_FULL"));
  const activeCount = await activeRegistrationCount(serviceClient, eventId);

  if (activeCount > 1) {
    throw new Error(`Overbooking detected: active registration count is ${activeCount}.`);
  }

  if (successes.length !== 1 || fullErrors.length !== 1 || activeCount !== 1) {
    throw new Error("Concurrency test failed: expected one success, one full rejection, and one active registration.");
  }

  const registration = successes[0].data as RegistrationResult;

  if (!registration.qr_code || registration.status !== "REGISTERED" || !registration.was_created) {
    throw new Error("Successful registration did not return expected QR/status/created fields.");
  }

  const duplicate = await userOne.rpc("register_for_event", { p_event_id: eventId }).single();

  if (duplicate.error) {
    throw new Error(`Duplicate registration returned an error: ${duplicate.error.message}`);
  }

  const duplicateData = duplicate.data as RegistrationResult;

  if (duplicateData.was_created || duplicateData.message !== "You are already registered for this event.") {
    throw new Error("Duplicate registration did not return the existing-registration response.");
  }

  const availability = await mustSucceed(
    await userOne.rpc("get_event_registration_availability", { p_event_id: eventId }).single(),
    "Read availability",
  );
  const availabilityData = availability as AvailabilityResult;

  if (
    availabilityData.active_registration_count !== 1 ||
    availabilityData.capacity !== 1 ||
    availabilityData.capacity_reached !== true
  ) {
    throw new Error("Availability RPC returned inaccurate capacity state.");
  }

  await mustSucceed(
    await serviceClient
      .from("registrations")
      .update({
        status: "CHECKED_IN",
        checked_in_at: new Date().toISOString(),
      })
      .eq("event_id", eventId)
      .eq("qr_code", registration.qr_code)
      .select("id, status, checked_in_at")
      .single(),
    "Check in registration",
  );

  const checkedInCount = await activeRegistrationCount(serviceClient, eventId);

  if (checkedInCount !== 1) {
    throw new Error("Checked-in registration did not continue occupying capacity.");
  }

  console.info("Concurrency overbooking detected? no");
  console.info("Duplicate registration blocked? yes");
  console.info("QR token returned? yes");
  console.info("Availability count accurate? yes");
  console.info("Check-in occupies capacity? yes");
}

async function cleanupDisposableData(serviceClient: SupabaseClient, cleanup: CleanupState) {
  if (cleanup.eventIds.length) {
    await mustSucceed(
      await serviceClient.from("registrations").delete().in("event_id", cleanup.eventIds),
      "Cleanup registrations",
    );
    await mustSucceed(await serviceClient.from("events").delete().in("id", cleanup.eventIds), "Cleanup events");
  }

  if (cleanup.userIds.length) {
    await mustSucceed(await serviceClient.from("profiles").delete().in("user_id", cleanup.userIds), "Cleanup profiles");

    for (const userId of cleanup.userIds) {
      const { error } = await serviceClient.auth.admin.deleteUser(userId);

      if (error) {
        throw new Error(`Cleanup auth user: ${error.message}`);
      }
    }
  }

  const eventProof = cleanup.eventIds.length
    ? await serviceClient.from("events").select("id", { count: "exact", head: true }).in("id", cleanup.eventIds)
    : { count: 0, error: null };
  const registrationProof = cleanup.eventIds.length
    ? await serviceClient
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .in("event_id", cleanup.eventIds)
    : { count: 0, error: null };
  const profileProof = cleanup.userIds.length
    ? await serviceClient.from("profiles").select("user_id", { count: "exact", head: true }).in("user_id", cleanup.userIds)
    : { count: 0, error: null };
  const markerProof = await serviceClient
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("title", cleanup.marker);

  for (const [label, result] of [
    ["event cleanup proof", eventProof],
    ["registration cleanup proof", registrationProof],
    ["profile cleanup proof", profileProof],
    ["marker cleanup proof", markerProof],
  ] as const) {
    if (result.error) {
      throw new Error(`${label}: ${result.error.message}`);
    }

    if ((result.count ?? 0) !== 0) {
      throw new Error(`${label}: expected zero remaining rows, found ${result.count ?? 0}.`);
    }
  }

  console.info("Disposable staging cleanup proven? yes");
}

async function main() {
  const env = loadLocalEnv();
  const url = requiredEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requiredEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = requiredEnv(env, "SUPABASE_SERVICE_ROLE_KEY");

  assertStaging(url);

  const serviceClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const cleanup: CleanupState = {
    marker: `QA Atomic Registration ${new Date().toISOString()} ${randomUUID()}`,
    eventIds: [],
    userIds: [],
  };

  let verificationError: unknown;
  let cleanupError: unknown;

  try {
    console.info("Staging ref confirmed? yes");
    await runVerification(serviceClient, url, anonKey, cleanup);
  } catch (error) {
    verificationError = error;
  } finally {
    try {
      await cleanupDisposableData(serviceClient, cleanup);
    } catch (error) {
      cleanupError = error;
    }
  }

  if (cleanupError) {
    throw cleanupError;
  }

  if (verificationError) {
    throw verificationError;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown staging verification failure.");
  process.exit(1);
});
