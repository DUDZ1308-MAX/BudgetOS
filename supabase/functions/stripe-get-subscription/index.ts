import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleOptions, jsonResponse } from "../_shared/http.ts";
import { createAdminClient, getAuthenticatedUser } from "../_shared/supabase.ts";

interface SubscriptionResponse {
  tier: string;
  interval: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
}

function freeSubscription(): SubscriptionResponse {
  return {
    tier: "free",
    interval: "month",
    status: "active",
    currentPeriodStart: null,
    currentPeriodEnd: null,
    trialStart: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
  };
}

function toIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

serve(async (req: Request): Promise<Response> => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = await getAuthenticatedUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  try {
    const admin = createAdminClient();

    const { data: row, error } = await admin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("stripe-get-subscription error", error);
      return jsonResponse({ error: "Failed to load subscription." }, 500);
    }

    // No row yet -> normalized FREE entitlement. New users are free by
    // default; paid entitlements exist only after Stripe webhooks write
    // them. Never derived from client state.
    if (!row) {
      return jsonResponse(freeSubscription());
    }

    const sub: SubscriptionResponse = {
      tier: row.tier ?? "free",
      interval: row.interval ?? "month",
      status: row.status ?? "active",
      currentPeriodStart: toIso(row.current_period_start),
      currentPeriodEnd: toIso(row.current_period_end),
      trialStart: toIso(row.trial_start),
      trialEnd: toIso(row.trial_end),
      cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
      canceledAt: toIso(row.canceled_at),
      stripeCustomerId: row.stripe_customer_id ?? null,
      stripeSubscriptionId: row.stripe_subscription_id ?? null,
      stripePriceId: row.stripe_price_id ?? null,
    };

    return jsonResponse(sub);
  } catch (err) {
    console.error("stripe-get-subscription error", err);
    return jsonResponse({ error: "Failed to load subscription." }, 500);
  }
});
