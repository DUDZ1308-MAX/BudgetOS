import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleOptions, jsonResponse } from "../_shared/http.ts";
import { getStripe } from "../_shared/stripe.ts";
import { createAdminClient, getAuthenticatedUser, getAppUrl } from "../_shared/supabase.ts";
import { hasActiveSubscription } from "../_shared/subscriptionGate.ts";
import {
  getPriceIdForTier,
  isUuid,
  VALID_INTERVALS,
  VALID_TIERS,
  type BillingInterval,
  type SubscriptionTier,
} from "../_shared/tiers.ts";

const TRIAL_DAYS = 14;

interface CheckoutBody {
  tier?: unknown;
  interval?: unknown;
}

serve(async (req: Request): Promise<Response> => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = await getAuthenticatedUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  let body: CheckoutBody;
  try {
    body = await req.json() as CheckoutBody;
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const tier = body.tier as SubscriptionTier;
  const interval = (body.interval ?? "month") as BillingInterval;

  // The client may only request tier + interval. Any attempt to submit
  // a Price ID is rejected outright.
  const raw = body as Record<string, unknown>;
  if (raw.priceId !== undefined || raw.price_id !== undefined || raw.price !== undefined) {
    return jsonResponse({ error: "Price selection is handled by the server" }, 400);
  }

  if (!VALID_TIERS.includes(tier)) {
    return jsonResponse({ error: `Invalid tier "${String(tier)}"` }, 400);
  }
  if (!VALID_INTERVALS.includes(interval)) {
    return jsonResponse({ error: `Invalid interval "${String(interval)}"` }, 400);
  }

  let priceId: string;
  try {
    priceId = getPriceIdForTier(tier, interval) ?? "";
    if (!priceId) {
      return jsonResponse(
        { error: "Billing is not fully configured. Please try again later." },
        500,
      );
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();
    const admin = createAdminClient();

    // One user -> one active Stripe subscription. If the user already
    // has a billable subscription, never create a second Checkout
    // subscription (double billing). Route them to the Customer Portal
    // where plan changes, cancellations, and payment method updates are
    // managed on the existing subscription.
    const { data: existing, error: subError } = await admin
      .from("user_subscriptions")
      .select("stripe_subscription_id, stripe_customer_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError) {
      console.error("stripe-create-checkout-session subscription lookup error", subError);
      throw new Error(subError.message);
    }

    if (hasActiveSubscription(existing)) {
      if (existing?.stripe_customer_id) {
        const portal = await stripe.billingPortal.sessions.create({
          customer: existing.stripe_customer_id,
          return_url: `${appUrl}/billing`,
        });
        return jsonResponse({
          error: "You already have an active subscription. Manage your plan in the billing portal.",
          alreadySubscribed: true,
          portalUrl: portal.url,
        });
      }
      return jsonResponse({
        error: "You already have an active subscription. Manage your plan in the billing portal.",
        alreadySubscribed: true,
      });
    }

    const customerId = await getOrCreateCustomer(stripe, admin, user.id);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { user_id: user.id, tier, interval },
      },
      metadata: { user_id: user.id, tier, interval },
      client_reference_id: user.id,
      success_url: `${appUrl}/billing?checkout=success`,
      cancel_url: `${appUrl}/billing?checkout=canceled`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return jsonResponse({ error: "Checkout session could not be created." }, 500);
    }

    return jsonResponse({ url: session.url });
  } catch (err) {
    console.error("stripe-create-checkout-session error", err);
    return jsonResponse({ error: "Failed to start checkout. Please try again." }, 500);
  }
});

async function getOrCreateCustomer(
  stripe: ReturnType<typeof getStripe>,
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<string> {
  // 1. Existing customer already stored for this user.
  const { data: existing } = await admin
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  // 2. A customer may exist in Stripe but not yet be recorded locally
  // (e.g. created by an earlier race or manual setup).
  const customers = await stripe.customers.list({
    limit: 1,
    metadata: { supabase_user_id: userId },
  });
  if (customers.data.length > 0) {
    const customerId = customers.data[0].id;
    await upsertCustomerRef(admin, userId, customerId);
    return customerId;
  }

  // 3. Create a new customer and record it.
  const customer = await stripe.customers.create({
    metadata: { supabase_user_id: userId },
  });
  await upsertCustomerRef(admin, userId, customer.id);
  return customer.id;
}

async function upsertCustomerRef(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  customerId: string,
): Promise<void> {
  if (!isUuid(userId)) {
    throw new Error("Invalid user id");
  }
  const { error } = await admin
    .from("user_subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        status: "active",
        tier: "free",
        interval: "month",
      },
      { onConflict: "user_id" },
    );
  if (error) {
    throw new Error(error.message);
  }
}
