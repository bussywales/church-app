import { NextResponse } from "next/server";
import { ensureProfile } from "@/lib/auth";
import { getRegistrationEmailProvider } from "@/lib/email/provider";
import { createClient } from "@/lib/supabase/server";

type RegisterRouteContext = {
  params: Promise<{ id: string }>;
};

type RegistrationRpcResult = {
  registration_id: string;
  qr_code: string | null;
  event_title: string;
  event_starts_at: string;
  status: string;
  message: string;
  was_created: boolean;
};

function registrationErrorResponse(message: string) {
  if (message.includes("AUTH_REQUIRED")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (message.includes("EVENT_NOT_FOUND")) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (message.includes("EVENT_FULL")) {
    return NextResponse.json({ error: "Event capacity reached." }, { status: 409 });
  }

  if (message.includes("DUPLICATE_REGISTRATION")) {
    return NextResponse.json({ message: "You are already registered for this event." });
  }

  return NextResponse.json({ error: "Unable to register right now." }, { status: 400 });
}

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

  const { data, error } = await supabase.rpc("register_for_event", { p_event_id: eventId }).single();

  if (error) {
    return registrationErrorResponse(error.message);
  }

  const registration = data as RegistrationRpcResult | null;

  if (!registration) {
    return NextResponse.json({ error: "Unable to register right now." }, { status: 400 });
  }

  if (registration.was_created && user.email && registration.qr_code) {
    const emailProvider = getRegistrationEmailProvider();

    try {
      await emailProvider.sendRegistrationConfirmation({
        to: user.email,
        eventTitle: registration.event_title,
        eventStartsAt: registration.event_starts_at,
        qrToken: registration.qr_code,
      });
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Registration confirmation email failed.");
    }
  }

  return NextResponse.json({
    message: registration.message,
    registrationId: registration.registration_id,
    qrCode: registration.qr_code,
    status: registration.status,
  });
}
