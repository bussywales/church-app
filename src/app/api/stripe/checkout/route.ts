import { NextResponse } from "next/server";
import { ensureProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe";
import { getGiftAidEnabled } from "@/lib/settings";

export const runtime = "nodejs";

const ALLOWED_PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

type CheckoutPayload = {
  fundId?: string;
  amountMode?: "preset" | "custom";
  presetAmountPence?: number;
  customAmountPounds?: string;
  giftAid?: boolean;
  declarationAccepted?: boolean;
  fullName?: string;
  addressLine1?: string;
  city?: string;
  postcode?: string;
};

function sanitizeText(value: string | undefined) {
  return value?.trim() || "";
}

function computeAmountPence(payload: CheckoutPayload) {
  if (payload.amountMode === "preset") {
    const amount = Number(payload.presetAmountPence);
    return ALLOWED_PRESET_AMOUNTS.includes(amount) ? amount : null;
  }

  if (payload.amountMode === "custom") {
    const amountPounds = Number(payload.customAmountPounds);

    if (!Number.isFinite(amountPounds)) {
      return null;
    }

    const amountPence = Math.round(amountPounds * 100);

    if (amountPence < 100 || amountPence > 100000000) {
      return null;
    }

    return amountPence;
  }

  return null;
}

function getSiteUrl(request: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const profile = await ensureProfile(user);
  const payload = (await request.json()) as CheckoutPayload;
  const amountPence = computeAmountPence(payload);

  if (!amountPence) {
    return NextResponse.json({ error: "Invalid donation amount." }, { status: 400 });
  }

  const fundId = sanitizeText(payload.fundId);

  if (!fundId) {
    return NextResponse.json({ error: "Fund is required." }, { status: 400 });
  }

  const { data: fund } = await supabase
    .from("funds")
    .select("id, name, is_active")
    .eq("id", fundId)
    .eq("is_active", true)
    .maybeSingle();

  if (!fund) {
    return NextResponse.json({ error: "Fund not found or inactive." }, { status: 404 });
  }

  const giftAidEnabled = await getGiftAidEnabled();
  const wantsGiftAid = payload.giftAid === true;

  if (wantsGiftAid && !giftAidEnabled) {
    return NextResponse.json({ error: "Gift Aid is currently disabled." }, { status: 400 });
  }

  const declarationAccepted = payload.declarationAccepted === true;

  if (wantsGiftAid && !declarationAccepted) {
    return NextResponse.json({ error: "Gift Aid declaration consent is required." }, { status: 400 });
  }

  if (wantsGiftAid) {
    const fullName = sanitizeText(payload.fullName) || profile.full_name || "";
    const addressLine1 = sanitizeText(payload.addressLine1) || profile.address_line1 || "";
    const city = sanitizeText(payload.city) || profile.city || "";
    const postcode = sanitizeText(payload.postcode) || profile.postcode || "";

    if (!fullName || !addressLine1 || !city || !postcode) {
      return NextResponse.json({ error: "Gift Aid requires full name and address details." }, { status: 400 });
    }

    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        address_line1: addressLine1,
        city,
        postcode,
      })
      .eq("user_id", user.id);

    await supabase.from("gift_aid_declarations").insert({
      user_id: user.id,
      accepted_at: new Date().toISOString(),
      address_snapshot: {
        full_name: fullName,
        address_line1: addressLine1,
        city,
        postcode,
      },
      wording_version: "v1",
    });
  }

  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: amountPence,
          product_data: {
            name: `Donation: ${fund.name}`,
            description: "One-off donation",
          },
        },
      },
    ],
    success_url: `${getSiteUrl(request)}/give?status=success`,
    cancel_url: `${getSiteUrl(request)}/give?status=cancelled`,
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      fund_id: fund.id,
      gift_aid: wantsGiftAid ? "true" : "false",
      amount_pence: String(amountPence),
    },
  });

  await supabase.from("donations").insert({
    user_id: user.id,
    fund_id: fund.id,
    amount_pence: amountPence,
    currency: "gbp",
    stripe_session_id: session.id,
    payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
    status: "PENDING",
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe checkout URL unavailable." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
