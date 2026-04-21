// lib/payments/providers/moneyfusion.types.ts

export type MoneyFusionConfig = {
  apiKey: string;
  secret: string;
  merchantId: string;
  webhookSecret: string;
  apiUrl: string;
  environment: "sandbox" | "production";
};

export type CreatePaymentRequest = {
  amount: number;
  currency: "XOF" | "XAF" | "EUR";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  reference?: string;
  returnUrl?: string;
  webhookUrl?: string;
};

export type CreatePaymentResponse = {
  success: boolean;
  data: {
    paymentId: string;
    reference: string;
    checkoutUrl: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    amount: number;
    currency: string;
  };
};

export type WithdrawRequest = {
  amount: number;
  currency: "XOF" | "XAF" | "EUR";
  phoneNumber: string;
  accountName: string;
  description?: string;
};

export type WithdrawResponse = {
  success: boolean;
  data: {
    withdrawalId: string;
    reference: string;
    status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
    amount: number;
    fees: number;
    netAmount: number;
  };
};

export type PaymentStatusResponse = {
  success: boolean;
  data: {
    paymentId: string;
    reference: string;
    status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
    amount: number;
    currency: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    paymentMethod?: "OM" | "MTN" | "CARD";
    transactionId?: string;
    paidAt?: string;
  };
};