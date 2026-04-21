import { PaymentType } from "@prisma/client";

export const COMMISSION_RATES: Partial<Record<PaymentType, number>> = {
  SUBSCRIPTION:   0.15,
  MESSAGE:        0.10,
  AUDIO_CALL:     0.10,
  VIDEO_CALL:     0.10,
  CUSTOM_CONTENT: 0.20,
};