import { PaymentType } from "@prisma/client";

export const COMMISSION_RATES: Partial<Record<PaymentType, number>> = {
  SUBSCRIPTION:   0.15,
  MESSAGE:        0.10,
  AUDIO_CALL:     0.10,
  VIDEO_CALL:     0.10,
  CUSTOM_CONTENT: 0.20,
};

export const PAYMENT_PROVIDERS = {
  STRIPE: "STRIPE",
  MONEY_FUSION: "MONEY_FUSION",
} as const;

export type PaymentProvider = typeof PAYMENT_PROVIDERS[keyof typeof PAYMENT_PROVIDERS]