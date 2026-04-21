// lib/payments/providers/moneyfusion.ts

import crypto from "crypto";
import {
  MoneyFusionConfig,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusResponse,
  WithdrawRequest,
  WithdrawResponse,
} from "./moneyfusion.types";

export class MoneyFusionClient {
  private config: MoneyFusionConfig;

  constructor() {
    this.config = {
      apiKey: process.env.MONEY_FUSION_API_KEY!,
      secret: process.env.MONEY_FUSION_SECRET!,
      merchantId: process.env.MONEY_FUSION_MERCHANT_ID!,
      webhookSecret: process.env.MONEY_FUSION_WEBHOOK_SECRET!,
      apiUrl: process.env.MONEY_FUSION_API_URL!,
      environment: (process.env.MONEY_FUSION_ENVIRONMENT as "sandbox" | "production") || "sandbox",
    };
  }

  private generateSignature(payload: any): string {
    const timestamp = Date.now().toString();
    const stringToSign = `${timestamp}.${JSON.stringify(payload)}.${this.config.secret}`;
    return crypto.createHash("sha256").update(stringToSign).digest("hex");
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" = "POST",
    body?: any
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;
    const timestamp = Date.now().toString();
    const payload = body || {};
    const signature = this.generateSignature(payload);

    const headers = {
      "Content-Type": "application/json",
      "X-API-Key": this.config.apiKey,
      "X-Merchant-Id": this.config.merchantId,
      "X-Timestamp": timestamp,
      "X-Signature": signature,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: method === "POST" ? JSON.stringify(payload) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur MoneyFusion");
    }

    return data;
  }

  /**
   * Créer un paiement
   */
  async createPayment(params: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const payload = {
      amount: params.amount,
      currency: params.currency,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      description: params.description,
      reference: params.reference || `PAY-${Date.now()}`,
      return_url: params.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payments/confirm`,
      webhook_url: params.webhookUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhooks/moneyfusion`,
    };

    return this.request<CreatePaymentResponse>("/payments", "POST", payload);
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async checkPaymentStatus(reference: string): Promise<PaymentStatusResponse> {
    return this.request<PaymentStatusResponse>(`/payments/${reference}`, "GET");
  }

  /**
   * Effectuer un retrait vers Mobile Money
   */
  async withdraw(params: WithdrawRequest): Promise<WithdrawResponse> {
    const payload = {
      amount: params.amount,
      currency: params.currency,
      phone_number: params.phoneNumber,
      account_name: params.accountName,
      description: params.description || "Retrait Savage Club",
      reference: `WITHDRAW-${Date.now()}`,
    };

    return this.request<WithdrawResponse>("/withdrawals", "POST", payload);
  }

  /**
   * Vérifier la signature d'un webhook
   */
  verifyWebhookSignature(payload: any, signature: string, timestamp: string): boolean {
    const stringToSign = `${timestamp}.${JSON.stringify(payload)}.${this.config.webhookSecret}`;
    const expectedSignature = crypto.createHash("sha256").update(stringToSign).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}

export const moneyFusion = new MoneyFusionClient();