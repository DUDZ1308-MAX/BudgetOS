import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleOptions, jsonResponse } from "../_shared/http.ts";
import { getStripe } from "../_shared/stripe.ts";
import { createAdminClient, getAuthenticatedUser, getAppUrl } from "../_shared/supabase.ts";

serve(async (req: Request): Promise<Response> => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = await getAuthenticatedUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  try {
    const admin = createAdminClient();

    // The customer ID always comes from the authenticated user's own
    // record. The client cannot specify an arbitrary customer.
    const { data: row, error } = await admin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("stripe-customer-portal lookup error", error);
      return jsonResponse({ error: "Failed to look up billing account." }, 500);
    }

    if (!row?.stripe_customer_id) {
      return jsonResponse(
        { error: "No active billing account. Start a checkout to create one." },
        404,
      );
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();

    const session = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${appUrl}/billing`,
    });

    if (!session.url) {
      return jsonResponse({ error: "Billing portal could not be opened." }, 500);
    }

    return jsonResponse({ url: session.url });
  } catch (err) {
    console.error("stripe-customer-portal error", err);
    return jsonResponse({ error: "Failed to open billing portal. Please try again." }, 500);
  }
});
