// lib/payments/providers/stripe.ts
import Stripe from "stripe";

export class StripeClient {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY manquant");
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  }

  async createPaymentIntent(
    amount: number,
    currency: string = "eur",
    metadata?: Record<string, string>
  ) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: metadata || {},
      automatic_payment_methods: { enabled: true },
    });
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async getPaymentIntent(paymentIntentId: string) {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      return true;
    } catch {
      return false;
    }
  }
}

// ← Lazy : instancié seulement quand appelé, pas au build
let _stripe: StripeClient | null = null;
export function getStripe(): StripeClient {
  if (!_stripe) _stripe = new StripeClient();
  return _stripe;
}

// Garde la compatibilité avec les imports existants
// mais n'instancie pas au chargement du module
export const stripe = {
  createPaymentIntent: (...args: Parameters<StripeClient["createPaymentIntent"]>) =>
    getStripe().createPaymentIntent(...args),
  getPaymentIntent: (...args: Parameters<StripeClient["getPaymentIntent"]>) =>
    getStripe().getPaymentIntent(...args),
  verifyWebhookSignature: (...args: Parameters<StripeClient["verifyWebhookSignature"]>) =>
    getStripe().verifyWebhookSignature(...args),
};