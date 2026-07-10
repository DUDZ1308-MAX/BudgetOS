import type {
  WebhookPayload,
  SubscriptionWebhookObject,
  InvoiceWebhookObject,
  WebhookHandlerResult,
  StripeWebhookEvent,
} from './webhookTypes';

const HANDLER_MAP: Partial<Record<StripeWebhookEvent, (payload: WebhookPayload) => Promise<WebhookHandlerResult>>> = {
  'customer.subscription.created': handleSubscriptionCreated,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.payment_succeeded': handlePaymentSucceeded,
  'invoice.payment_failed': handlePaymentFailed,
  'customer.subscription.trial_will_end': handleTrialWillEnd,
  'checkout.session.completed': handleCheckoutCompleted,
};

export async function routeWebhookEvent(payload: WebhookPayload): Promise<WebhookHandlerResult> {
  const handler = HANDLER_MAP[payload.type];
  if (!handler) {
    return { handled: false, error: `No handler for event: ${payload.type}` };
  }
  return handler(payload);
}

async function handleSubscriptionCreated(payload: WebhookPayload): Promise<WebhookHandlerResult> {
  const sub = payload.data.object as SubscriptionWebhookObject;
  console.info('[Webhook] Subscription created:', sub.id, 'for customer:', sub.customer);
  return { handled: true };
}

async function handleSubscriptionUpdated(payload: WebhookPayload): Promise<WebhookHandlerResult> {
  const sub = payload.data.object as SubscriptionWebhookObject;
  console.info('[Webhook] Subscription updated:', sub.id, 'status:', sub.status);
  return { handled: true };
}

async function handleSubscriptionDeleted(payload: WebhookPayload): Promise<WebhookHandlerResult> {
  const sub = payload.data.object as SubscriptionWebhookObject;
  console.info('[Webhook] Subscription deleted:', sub.id);
  return { handled: true };
}

async function handlePaymentSucceeded(payload: WebhookPayload): Promise<WebhookHandlerResult> {
  const invoice = payload.data.object as InvoiceWebhookObject;
  console.info('[Webhook] Payment succeeded:', invoice.id, 'amount:', invoice.amount_paid);
  return { handled: true };
}

async function handlePaymentFailed(payload: WebhookPayload): Promise<WebhookHandlerResult> {
  const invoice = payload.data.object as InvoiceWebhookObject;
  console.warn('[Webhook] Payment failed:', invoice.id, 'for subscription:', invoice.subscription);
  return { handled: true };
}

async function handleTrialWillEnd(payload: WebhookPayload): Promise<WebhookHandlerResult> {
  const sub = payload.data.object as SubscriptionWebhookObject;
  console.info('[Webhook] Trial will end for subscription:', sub.id);
  return { handled: true };
}

async function handleCheckoutCompleted(payload: WebhookPayload): Promise<WebhookHandlerResult> {
  const session = payload.data.object as Record<string, unknown>;
  console.info('[Webhook] Checkout completed:', session.id);
  return { handled: true };
}
