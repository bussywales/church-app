import Stripe from "stripe";
import { assertRuntimeEnvironmentSafety, serverEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  assertRuntimeEnvironmentSafety();

  if (stripeClient) {
    return stripeClient;
  }

  stripeClient = new Stripe(serverEnv.STRIPE_SECRET_KEY);

  return stripeClient;
}
