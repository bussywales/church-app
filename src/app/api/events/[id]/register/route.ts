import { NextResponse } from "next/server";
import { ensureProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type RegisterRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RegisterRouteContext) {
  const { id: eventId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await ensureProfile(user);

  const [{ data: event }, { count }, { data: existing }] = await Promise.all([
    supabase
      .from("events")
      .select("id, capacity, is_published")
      .eq("id", eventId)
      .eq("is_published", true)
      .maybeSingle(),
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (existing) {
    return NextResponse.json({ message: "You are already registered for this event." });
  }

  if (event.capacity !== null && (count ?? 0) >= event.capacity) {
    return NextResponse.json({ error: "Event capacity reached." }, { status: 409 });
  }

  const { error } = await supabase.from("registrations").insert({
    event_id: eventId,
    user_id: user.id,
    status: "REGISTERED",
    qr_code: null,
  });

  if (error) {
    return NextResponse.json({ error: "Unable to register right now." }, { status: 400 });
  }

  return NextResponse.json({ message: "Registration successful." });
}
