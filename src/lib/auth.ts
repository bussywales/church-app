import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole, type AppRole } from "@/lib/roles";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
};

async function fetchProfile(user: User): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role: normalizeRole(data.role),
  };
}

async function ensureProfile(user: User): Promise<Profile> {
  const existing = await fetchProfile(user);

  if (existing) {
    return existing;
  }

  const supabase = await createClient();

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      role: "MEMBER",
    },
    { onConflict: "id" },
  );

  return {
    id: user.id,
    email: user.email ?? null,
    full_name: null,
    role: "MEMBER",
  };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return ensureProfile(user);
}

export async function requireRole(roles: AppRole[]) {
  const user = await requireUser();
  const profile = await ensureProfile(user);

  if (!roles.includes(profile.role)) {
    redirect("/account");
  }

  return { user, profile };
}
