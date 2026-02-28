import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole, type AppRole } from "@/lib/roles";

export type Profile = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  postcode: string | null;
  role: AppRole;
};

async function fetchProfile(user: User): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, phone, address_line1, city, postcode, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    user_id: data.user_id,
    full_name: data.full_name,
    phone: data.phone,
    address_line1: data.address_line1,
    city: data.city,
    postcode: data.postcode,
    role: normalizeRole(data.role),
  };
}

export async function ensureProfile(user: User): Promise<Profile> {
  const existing = await fetchProfile(user);

  if (existing) {
    return existing;
  }

  const supabase = await createClient();

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      role: "MEMBER",
    },
    { onConflict: "user_id" },
  );

  return {
    user_id: user.id,
    full_name: null,
    phone: null,
    address_line1: null,
    city: null,
    postcode: null,
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
