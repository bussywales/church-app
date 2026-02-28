import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripeClient } from "@/lib/stripe";
import { getDonationReceiptProvider } from "@/lib/email/receipt";

export const runtime = "nodejs";

type ExistingDonationRow = {
  id: string;
  user_id: string;
  fund_id: string | null;
  amount_pence: number;
  currency: string;
  status: string;
};

function mapDonationStatus(eventType: string, session: Stripe.Checkout.Session) {
  if (eventType === "checkout.session.completed") {
    return session.payment_status === "paid" ? "SUCCEEDED" : "COMPLETED";
  }

  if (eventType === "checkout.session.async_payment_succeeded") {
    return "SUCCEEDED";
  }

  if (eventType === "checkout.session.async_payment_failed") {
    return "FAILED";
  }

  if (eventType === "checkout.session.expired") {
    return "EXPIRED";
  }

  return "PENDING";
}

async function sendReceiptIfNeeded(
  userId: string,
  fundName: string,
  amountPence: number,
  currency: string,
  status: string,
) {
  if (status !== "SUCCEEDED") {
    return;
  }

  const supabase = createServiceClient();
  const { data } = await supabase.auth.admin.getUserById(userId);

  if (!data.user?.email) {
    return;
  }

  const receiptProvider = getDonationReceiptProvider();
  await receiptProvider.sendDonationReceipt({
    to: data.user.email,
    amountPence,
    currency,
    fundName,
    status,
  });
}

async function handleCheckoutSessionEvent(eventType: string, session: Stripe.Checkout.Session) {
  const supabase = createServiceClient();

  const { data: existingDonationRaw } = await supabase
    .from("donations")
    .select("id, user_id, fund_id, amount_pence, currency, status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  const existingDonation = existingDonationRaw as ExistingDonationRow | null;

  const userId = session.metadata?.user_id || existingDonation?.user_id;

  if (!userId) {
    return NextResponse.json({ error: "Unable to resolve donation owner." }, { status: 400 });
  }

  const fundId = session.metadata?.fund_id || existingDonation?.fund_id || null;
  const amountPence = session.amount_total ?? existingDonation?.amount_pence;

  if (!amountPence || amountPence <= 0) {
    return NextResponse.json({ error: "Invalid donation amount from session." }, { status: 400 });
  }

  const currency = session.currency ?? existingDonation?.currency ?? "gbp";
  const status = mapDonationStatus(eventType, session);
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;

  const { error } = await supabase.from("donations").upsert(
    {
      user_id: userId,
      fund_id: fundId,
      amount_pence: amountPence,
      currency,
      stripe_session_id: session.id,
      payment_intent_id: paymentIntentId,
      status,
    },
    {
      onConflict: "stripe_session_id",
    },
  );

  if (error) {
    return NextResponse.json({ error: "Failed to persist donation status." }, { status: 400 });
  }

  const shouldSendReceipt = status === "SUCCEEDED" && existingDonation?.status !== "SUCCEEDED";

  if (shouldSendReceipt) {
    let fundName = "General Fund";

    if (fundId) {
      const { data: fund } = await supabase.from("funds").select("name").eq("id", fundId).maybeSingle();
      fundName = fund?.name || fundName;
    }

    await sendReceiptIfNeeded(userId, fundName, amountPence, currency, status);
  }

  return NextResponse.json({ received: true });
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook signature configuration." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "checkout.session.expired"
  ) {
    return handleCheckoutSessionEvent(event.type, event.data.object as Stripe.Checkout.Session);
  }

  return NextResponse.json({ received: true });
}
