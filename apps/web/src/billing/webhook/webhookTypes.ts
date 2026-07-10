export type StripeWebhookEvent =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.subscription.trial_will_end'
  | 'checkout.session.completed'
  | 'customer.created';

export interface WebhookPayload<T = unknown> {
  id: string;
  type: StripeWebhookEvent;
  created: number;
  data: {
    object: T;
  };
}

export interface SubscriptionWebhookObject {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  trial_start: number | null;
  trial_end: number | null;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  metadata: Record<string, string>;
  items: {
    data: Array<{
      price: {
        id: string;
        product: string;
        metadata: Record<string, string>;
      };
    }>;
  };
}

export interface InvoiceWebhookObject {
  id: string;
  customer: string;
  subscription: string;
  status: string;
  paid: boolean;
  amount_due: number;
  amount_paid: number;
  currency: string;
  period_start: number;
  period_end: number;
  lines: {
    data: Array<{
      description: string;
      amount: number;
    }>;
  };
}

export interface WebhookHandlerResult {
  handled: boolean;
  error?: string;
}

export type WebhookHandler = (payload: WebhookPayload) => Promise<WebhookHandlerResult>;
