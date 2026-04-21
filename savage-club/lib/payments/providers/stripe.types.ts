// lib/payments/providers/stripe.types.ts

export type StripePaymentIntent = {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "requires_capture" | "canceled" | "succeeded";
  metadata: Record<string, string>;
};

export type StripeWebhookEvent = {
  id: string;
  type: "payment_intent.succeeded" | "payment_intent.payment_failed";
  data: {
    object: StripePaymentIntent;
  };
  created: number;
};