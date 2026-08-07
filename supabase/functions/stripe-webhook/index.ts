import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleOptions, jsonResponse } from "../_shared/http.ts";
import { getStripe } from "../_shared/stripe.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { isUuid, resolveTierFromPriceId } from "../_shared/tiers.ts";
import type Stripe from "npm:stripe@17.0.0";

// Statuses that keep the purchased tier. Everything else
// (canceled, incomplete_expired, unpaid) downgrades to FREE so a user
// can never retain PRO/Premium indefinitely without an active
// subscription.
const ENTITLED_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "incomplete",
]);

/**
 * ORDERING STRATEGY
 * -----------------
 * Stripe events can arrive out of order. Deduplication by event id
 * (webhook_events) only prevents *duplicates*, not reordering.
 *
 * Each user_subscriptions row records `last_stripe_event_at`, the
 * Stripe event `created` timestamp (unix seconds) of the last event we
 * applied. `customer.subscription.created/updated/deleted` events and
 * `invoice.payment_failed` are only applied when their `event.created`
 * is NOT older than the last applied event. Because Stripe creates
 * events for one subscription monotonically, this rejects stale
 * deliveries while still applying legitimate later events (e.g. a
 * `trial_will_end` notice followed by a charge transition).
 *
 * Idempotent application: rows are keyed by the authenticated user and
 * upserted/updated via the service role, so re-applying an event (after
 * a failed acknowledgement) converges to the same state.
 */
serve(async (req: Request): Promise<Response> => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return jsonResponse({ error: "Missing Stripe signature" }, 400);
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return jsonResponse({ error: "Webhook is not configured" }, 500);
  }

  // Read the raw body and verify the signature BEFORE any parsing.
  // Reconstructing the body from a parsed JSON object would break
  // signature verification.
  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.warn("stripe-webhook signature verification failed", err);
    return jsonResponse({ error: "Invalid signature" }, 400);
  }

  const admin = createAdminClient();

  // Idempotency: if this exact Stripe event was already processed,
  // acknowledge without applying it again.
  const { data: existing } = await admin
    .from("webhook_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing) {
    return jsonResponse({ received: true, duplicate: true });
  }

  try {
    await processEvent(event, admin, stripe);
  } catch (err) {
    console.error("stripe-webhook processing failed", event.id, event.type, err);
    // Do NOT record the event -> Stripe will retry.
    return jsonResponse({ error: "Failed to process event" }, 500);
  }

  // Record AFTER successful processing so a failure triggers a retry.
  const { error: recordError } = await admin
    .from("webhook_events")
    .upsert(
      { stripe_event_id: event.id, event_type: event.type },
      { onConflict: "stripe_event_id" },
    );
  if (recordError) {
    console.error("stripe-webhook failed to record event", recordError);
    return jsonResponse({ error: "Failed to record event" }, 500);
  }

  return jsonResponse({ received: true });
});

async function processEvent(
  event: Stripe.Event,
  admin: ReturnType<typeof createAdminClient>,
  stripe: ReturnType<typeof getStripe>,
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event, admin);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event, admin, stripe);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event, admin, stripe);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event, admin);
      break;
    // Entitlement is driven by the subscription lifecycle events above.
    case "invoice.payment_succeeded":
    case "customer.subscription.trial_will_end":
      // Informational only; no state change required.
      break;
    default:
      console.warn("stripe-webhook unhandled event type", event.type);
  }
}

async function handleCheckoutCompleted(
  event: Stripe.Event,
  admin: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.user_id ?? session.client_reference_id;
  if (!userId || !isUuid(userId)) return;

  const customerId = typeof session.customer === "string"
    ? session.customer
    : session.customer?.id;

  if (customerId) {
    await admin.from("user_subscriptions").upsert(
      { user_id: userId, stripe_customer_id: customerId },
      { onConflict: "user_id" },
    );
  }
}

async function handleSubscriptionUpsert(
  event: Stripe.Event,
  admin: ReturnType<typeof createAdminClient>,
  stripe: ReturnType<typeof getStripe>,
): Promise<void> {
  const sub = event.data.object as Stripe.Subscription;
  const eventCreatedAt = event.created;

  const userId = await resolveUserId(sub, admin, stripe);
  if (!userId) return;

  const { data: existing } = await admin
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing && isStaleEvent(existing.last_stripe_event_at, eventCreatedAt)) {
    return;
  }

  const priceId = sub.items?.data?.[0]?.price?.id ?? null;
  const resolved = priceId ? resolveTierFromPriceId(priceId) : null;

  // Entitlement policy:
  //  - trialing/active/past_due/incomplete -> purchased tier (if the
  //    price is a known configured price; otherwise keep current tier).
  //  - canceled/incomplete_expired/unpaid -> FREE.
  const entitled = ENTITLED_STATUSES.has(sub.status);
  const tier = entitled
    ? (resolved?.tier ?? existing?.tier ?? "free")
    : "free";
  const interval = entitled
    ? (resolved?.interval ?? existing?.interval ?? "month")
    : existing?.interval ?? "month";

  const payload = {
    user_id: userId,
    stripe_subscription_id: sub.id,
    stripe_customer_id: sub.customer,
    status: sub.status,
    tier,
    interval,
    trial_start: unixToIso(sub.trial_start),
    trial_end: unixToIso(sub.trial_end),
    current_period_start: unixToIso(sub.current_period_start),
    current_period_end: unixToIso(sub.current_period_end),
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    canceled_at: unixToIso(sub.canceled_at),
    stripe_price_id: priceId,
    last_stripe_event_at: unixToIso(eventCreatedAt),
  };

  if (existing) {
    const { error } = await admin
      .from("user_subscriptions")
      .update(payload)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin
      .from("user_subscriptions")
      .insert(payload);
    if (error) throw new Error(error.message);
  }
}

async function handleSubscriptionDeleted(
  event: Stripe.Event,
  admin: ReturnType<typeof createAdminClient>,
  stripe: ReturnType<typeof getStripe>,
): Promise<void> {
  const sub = event.data.object as Stripe.Subscription;
  const eventCreatedAt = event.created;

  const userId = await resolveUserId(sub, admin, stripe);
  if (!userId) return;

  const { data: existing } = await admin
    .from("user_subscriptions")
    .select("last_stripe_event_at, tier, interval")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing && isStaleEvent(existing.last_stripe_event_at, eventCreatedAt)) {
    return;
  }

  const canceledAt = unixToIso(sub.canceled_at ?? eventCreatedAt);

  const { error } = await admin
    .from("user_subscriptions")
    .update({
      status: "canceled",
      tier: "free",
      cancel_at_period_end: false,
      canceled_at: canceledAt,
      last_stripe_event_at: unixToIso(eventCreatedAt),
    })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

async function handlePaymentFailed(
  event: Stripe.Event,
  admin: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription;
  if (typeof subscriptionId !== "string") return;

  const { data: existing } = await admin
    .from("user_subscriptions")
    .select("id, last_stripe_event_at")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!existing) return;
  if (isStaleEvent(existing.last_stripe_event_at, event.created)) return;

  const { error } = await admin
    .from("user_subscriptions")
    .update({
      status: "past_due",
      last_stripe_event_at: unixToIso(event.created),
    })
    .eq("id", existing.id);

  if (error) throw new Error(error.message);
}

/**
 * Resolves the Supabase user id from a Stripe subscription. Source of
 * truth order:
 *   1. subscription.metadata.user_id (set at checkout time)
 *   2. customer.metadata.supabase_user_id (set at customer creation)
 *   3. existing user_subscriptions row by stripe_customer_id
 */
async function resolveUserId(
  sub: Stripe.Subscription,
  admin: ReturnType<typeof createAdminClient>,
  stripe: ReturnType<typeof getStripe>,
): Promise<string | null> {
  const metadataUserId = sub.metadata?.user_id;
  if (isUuid(metadataUserId)) return metadataUserId;

  try {
    const customer = await stripe.customers.retrieve(sub.customer);
    if (!customer.deleted) {
      const customerId = customer.metadata?.supabase_user_id;
      if (isUuid(customerId)) return customerId;
    }
  } catch {
    // fall through to the database lookup
  }

  const { data: row } = await admin
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", sub.customer)
    .maybeSingle();

  return row?.user_id ?? null;
}

function isStaleEvent(lastStripeEventAt: string | null, eventCreatedAt: number): boolean {
  if (!lastStripeEventAt) return false;
  const lastMs = new Date(lastStripeEventAt).getTime();
  if (Number.isNaN(lastMs)) return false;
  return eventCreatedAt < lastMs / 1000;
}

function unixToIso(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds || Number.isNaN(unixSeconds)) return null;
  return new Date(unixSeconds * 1000).toISOString();
}
